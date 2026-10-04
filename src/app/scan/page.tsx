"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, CheckCircle2, Cpu, RotateCcw, ScanLine, ShoppingBag, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import HeatLegend from "@/components/HeatLegend";
import HeatToggle from "@/components/HeatToggle";
import MeasurementGrid from "@/components/MeasurementGrid";
import PageHeader from "@/components/PageHeader";
import ScannerCanvas from "@/components/ScannerCanvas";
import ZoneBreakdown from "@/components/ZoneBreakdown";
import { BRANDS, SIZES } from "@/lib/data";
import { chartFor, evaluateSize, recommendSize, zoneStatusMap } from "@/lib/fit";
import { useScans } from "@/lib/store";
import type { Measurements, Size, UserScan } from "@/lib/types";

type Stage = "setup" | "scanning" | "done";
type Build = "slim" | "regular" | "athletic" | "broad";

const BUILD: Record<Build, Partial<Measurements>> = {
  slim: { chest: 0.92, waist: 0.9, hips: 0.94, shoulder: 0.95 },
  regular: {},
  athletic: { chest: 1.04, waist: 0.95, hips: 0.98, shoulder: 1.04 },
  broad: { chest: 1.08, waist: 1.1, hips: 1.05, shoulder: 1.06 },
};

const BASE = {
  men: { height: 178, m: { chest: 100, waist: 84, hips: 99, inseam: 81, shoulder: 46 } },
  women: { height: 165, m: { chest: 89, waist: 72, hips: 98, inseam: 77, shoulder: 39.5 } },
};

const PHASES = [
  { at: 0, label: "Calibrating depth sensor" },
  { at: 0.12, label: "Front capture — hold still" },
  { at: 0.35, label: "Turn slowly — side capture" },
  { at: 0.6, label: "Back capture" },
  { at: 0.85, label: "Fusing point cloud into mesh" },
  { at: 0.95, label: "Extracting measurements" },
];

const SCAN_MS = 9000;

function simulateMeasurements(gender: "men" | "women", height: number, build: Build): Measurements {
  const base = BASE[gender];
  const s = height / base.height;
  const jitter = () => (Math.random() - 0.5) * 1.6;
  const f = BUILD[build];
  const m = base.m;
  return {
    chest: +(m.chest * s * (f.chest ?? 1) + jitter()).toFixed(1),
    waist: +(m.waist * s * (f.waist ?? 1) + jitter()).toFixed(1),
    hips: +(m.hips * s * (f.hips ?? 1) + jitter()).toFixed(1),
    inseam: +(m.inseam * s + jitter() / 2).toFixed(1),
    shoulder: +(m.shoulder * s * (f.shoulder ?? 1) + jitter() / 2).toFixed(1),
  };
}

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="rgba(148,163,184,0.2)" strokeWidth="6" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="url(#ring)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-white">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export default function ScanPage() {
  const { addScan, activeScan } = useScans();
  const [stage, setStage] = useState<Stage>("setup");
  const [name, setName] = useState("My scan");
  const [gender, setGender] = useState<"men" | "women">("men");
  const [height, setHeight] = useState(178);
  const [build, setBuild] = useState<Build>("regular");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UserScan | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const toggleCamera = async () => {
    if (cameraOn) return stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setCameraError("Camera unavailable — using simulated depth capture.");
    }
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOn, stage]);

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (stage !== "scanning") return;
    const started = performance.now();
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / SCAN_MS);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        const scan: UserScan = {
          id: `scan-${Date.now()}`,
          name: name.trim() || "My scan",
          gender,
          heightCm: height,
          build,
          source: cameraOn ? "Camera" : "Simulated",
          scannedAt: new Date().toISOString(),
          confidence: +(0.9 + Math.random() * 0.08).toFixed(2),
          measurements: simulateMeasurements(gender, height, build),
        };
        setResult(scan);
        setTimeout(() => setStage("done"), 400);
      }
    }, 50);
    return () => clearInterval(id);
  }, [stage, name, gender, height, build, cameraOn]);

  const phase = [...PHASES].reverse().find((p) => progress >= p.at)!.label;

  return (
    <main>
      <PageHeader eyebrow="Feature A" title="Body scan" />
      <AnimatePresence mode="wait">
        {stage === "setup" && (
          <motion.section
            key="setup"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4 px-4"
          >
            <div className="card space-y-4 p-4">
              <label className="block">
                <span className="text-xs text-slate-400">Profile name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-edge bg-ink px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
              <div>
                <span className="text-xs text-slate-400">Size charts</span>
                <div className="mt-1 flex gap-2">
                  {(["men", "women"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setGender(g);
                        setHeight(BASE[g].height);
                      }}
                      className={`chip ${gender === g ? "chip-on" : ""}`}
                    >
                      {g === "men" ? "Menswear" : "Womenswear"}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="flex justify-between text-xs text-slate-400">
                  Height <span className="font-mono text-slate-200">{height} cm</span>
                </span>
                <input
                  type="range"
                  min={150}
                  max={200}
                  value={height}
                  onChange={(e) => setHeight(+e.target.value)}
                  className="mt-2 w-full"
                />
              </label>
              <div>
                <span className="text-xs text-slate-400">Build (seeds the simulation)</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(BUILD) as Build[]).map((b) => (
                    <button key={b} onClick={() => setBuild(b)} className={`chip capitalize ${build === b ? "chip-on" : ""}`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card flex items-start gap-3 p-4 text-xs text-slate-400">
              <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p>
                Browsers can&apos;t reach the LiDAR sensor yet, so this prototype runs a simulated depth capture. Turn on the
                camera to scan over a live feed.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={toggleCamera} className="btn-ghost flex-1">
                {cameraOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {cameraOn ? "Camera on" : "Use camera"}
              </button>
              <button
                onClick={() => {
                  setProgress(0);
                  setStage("scanning");
                }}
                className="btn-primary flex-[1.4]"
              >
                <ScanLine className="h-4 w-4" /> Start scan
              </button>
            </div>
            {cameraError && <p className="text-center text-xs text-amber-400">{cameraError}</p>}
            <p className="text-center text-xs text-slate-500">
              Active profile: <span className="text-slate-300">{activeScan.name}</span>
            </p>
          </motion.section>
        )}

        {stage === "scanning" && (
          <motion.section
            key="scanning"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="px-4"
          >
            <div className="relative h-[68dvh] min-h-[460px] overflow-hidden rounded-3xl border border-edge bg-[radial-gradient(circle_at_50%_30%,#0f2236,#05080f_70%)]">
              {cameraOn && (
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover opacity-40" />
              )}
              <ScannerCanvas progress={progress} running={progress < 1} />
              {/* LiDAR frame */}
              {(["left-4 top-4 border-l-2 border-t-2", "right-4 top-4 border-r-2 border-t-2", "left-4 bottom-4 border-l-2 border-b-2", "right-4 bottom-4 border-r-2 border-b-2"] as const).map(
                (c) => (
                  <span key={c} className={`absolute h-8 w-8 rounded-sm border-accent ${c}`} />
                ),
              )}
              <div className="absolute left-6 top-6 space-y-0.5 font-mono text-[10px] text-accent/80">
                <p>DEPTH ● {cameraOn ? "CAM+SIM" : "SIM-LIDAR"}</p>
                <p>PTS {Math.floor(4200 * Math.min(1, 0.15 + progress * 1.1)).toLocaleString()}</p>
                <p>RANGE 1.8–2.4m</p>
              </div>
              <button
                onClick={() => {
                  setStage("setup");
                  setProgress(0);
                }}
                className="absolute right-6 top-6 rounded-full bg-black/50 p-1.5 text-slate-300"
                aria-label="Cancel scan"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2">
                <ProgressRing value={progress} />
                <motion.p key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-slate-200">
                  {phase}
                </motion.p>
              </div>
            </div>
          </motion.section>
        )}

        {stage === "done" && result && (
          <ScanResult
            key="done"
            scan={result}
            onSave={() => {
              addScan(result);
              stopCamera();
            }}
            onRescan={() => {
              setStage("setup");
              setProgress(0);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function ScanResult({ scan, onSave, onRescan }: { scan: UserScan; onSave: () => void; onRescan: () => void }) {
  const [saved, setSaved] = useState(false);
  const [heat, setHeat] = useState(true);
  const [brand, setBrand] = useState("nike");
  const ref = useMemo(() => ({ brand, gender: scan.gender, type: "tops" as const }), [brand, scan.gender]);
  const best = recommendSize(scan, ref)!;
  const [size, setSize] = useState<Size>(best.size);
  const evaluation = evaluateSize(scan, chartFor(ref, scan), size, "tops");

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 px-4">
      <div className="card flex items-center gap-3 p-4">
        <CheckCircle2 className="h-8 w-8 text-lime" />
        <div className="flex-1">
          <p className="font-semibold text-white">Scan complete</p>
          <p className="text-xs text-slate-400">
            {scan.source} capture · {Math.round(scan.confidence * 100)}% confidence · {scan.heightCm} cm
          </p>
        </div>
      </div>

      <MeasurementGrid m={scan.measurements} animate />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <p className="text-sm font-semibold">Your 3D mesh</p>
          <HeatToggle on={heat} onChange={setHeat} />
        </div>
        <Avatar measurements={scan.measurements} zones={zoneStatusMap(evaluation)} heatmap={heat} />
        <HeatLegend />
        <div className="space-y-2 p-4">
          <p className="text-xs text-slate-400">Heat map against a reference tee</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {Object.entries(BRANDS).map(([id, b]) => (
              <button
                key={id}
                onClick={() => {
                  setBrand(id);
                  setSize(recommendSize(scan, { ...ref, brand: id })!.size);
                }}
                className={`chip ${brand === id ? "chip-on" : ""}`}
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {SIZES.map((s) => (
              <button key={s} onClick={() => setSize(s)} className={`chip flex-1 justify-center ${size === s ? "chip-on" : ""}`}>
                {s}
              </button>
            ))}
          </div>
          <ZoneBreakdown evaluation={evaluation} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onRescan} className="btn-ghost flex-1">
          <RotateCcw className="h-4 w-4" /> Rescan
        </button>
        {saved ? (
          <Link href="/catalog" className="btn-primary flex-[1.4]">
            <ShoppingBag className="h-4 w-4" /> Shop my size
          </Link>
        ) : (
          <button
            onClick={() => {
              onSave();
              setSaved(true);
            }}
            className="btn-primary flex-[1.4]"
          >
            <CheckCircle2 className="h-4 w-4" /> Save as active profile
          </button>
        )}
      </div>
    </motion.section>
  );
}
