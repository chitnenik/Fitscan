"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Link2, Ruler, ScanLine, Search, Shirt, UserRound } from "lucide-react";
import MeasurementGrid from "@/components/MeasurementGrid";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/data";
import { matchesMySize } from "@/lib/fit";
import { useScans } from "@/lib/store";

const FEATURES = [
  { href: "/scan", icon: ScanLine, title: "Scan your body", body: "LiDAR-style depth capture builds your 3D mesh." },
  { href: "/catalog", icon: Search, title: "Shop all retailers", body: "Amazon, Zara, ASOS and Nike in one feed." },
  { href: "/check", icon: Link2, title: "Will it fit me?", body: "Paste any product link to verify the size." },
  { href: "/fit", icon: Shirt, title: "Fit preview", body: "See where a garment pinches or gaps." },
];

export default function Home() {
  const { scans, activeScan, setActive } = useScans();
  const picks = PRODUCTS.filter((p) => matchesMySize(activeScan, p)).slice(0, 6);

  return (
    <main className="space-y-6 px-4 pt-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">FitScan</p>
        <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-white">
          Never guess your <span className="bg-gradient-to-r from-accent to-lime bg-clip-text text-transparent">size</span> again.
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          One body scan, checked against every brand&apos;s size chart before you buy.
        </p>
      </motion.div>

      <section className="card space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{activeScan.name}&apos;s active scan</p>
            <p className="text-xs text-slate-500">
              {activeScan.source} · {activeScan.heightCm} cm · {new Date(activeScan.scannedAt).toLocaleDateString()}
            </p>
          </div>
          <Link href="/scan" className="text-xs font-semibold text-accent">
            Rescan
          </Link>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {scans.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)} className={`chip ${s.id === activeScan.id ? "chip-on" : ""}`}>
              {s.name}
            </button>
          ))}
        </div>
        <MeasurementGrid m={activeScan.measurements} />
      </section>

      <section className="grid grid-cols-2 gap-3">
        {FEATURES.map(({ href, icon: Icon, title, body }, i) => (
          <motion.div key={href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Link href={href} className="card flex h-full flex-col gap-2 p-4 transition active:scale-[0.98]">
              <Icon className="h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-400">{body}</p>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <Ruler className="h-4 w-4 text-lime" /> Verified in your size
          </h2>
          <Link href="/catalog" className="inline-flex items-center text-xs text-accent">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {picks.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </section>
    </main>
  );
}
