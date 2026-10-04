"use client";

import { useEffect, useRef } from "react";

type Seg = { c: number; hw: number };

/** Body silhouette in height-normalised units: v = 0 feet … 1 head top. Returns horizontal segments. */
function silhouette(v: number): Seg[] {
  const segs: Seg[] = [];
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const between = (a: number, b: number) => (v - a) / (b - a);
  if (v >= 0.87 && v <= 1) {
    const t = (v - 0.935) / 0.065;
    segs.push({ c: 0, hw: 0.055 * Math.sqrt(Math.max(0, 1 - t * t)) });
  } else if (v >= 0.84) {
    segs.push({ c: 0, hw: 0.028 });
  } else if (v >= 0.48) {
    const profile: [number, number][] = [
      [0.48, 0.1],
      [0.52, 0.106],
      [0.62, 0.088],
      [0.74, 0.11],
      [0.8, 0.125],
      [0.82, 0.12],
      [0.84, 0.05],
    ];
    for (let i = 0; i < profile.length - 1; i++) {
      const [a, wa] = profile[i];
      const [b, wb] = profile[i + 1];
      if (v >= a && v <= b) segs.push({ c: 0, hw: lerp(wa, wb, between(a, b)) });
    }
  }
  if (v >= 0.44 && v <= 0.82) {
    const t = between(0.82, 0.44);
    const hw = lerp(0.03, 0.022, t);
    const c = lerp(0.145, 0.19, t);
    segs.push({ c: -c, hw }, { c, hw });
  }
  if (v < 0.5) {
    const t = v / 0.5;
    const hw = lerp(0.03, 0.058, t);
    const c = lerp(0.065, 0.052, t);
    segs.push({ c: -c, hw }, { c, hw });
  }
  return segs;
}

interface Pt {
  x: number;
  z: number;
  v: number;
  d: number;
}

function samplePoints(n: number): Pt[] {
  const pts: Pt[] = [];
  while (pts.length < n) {
    const v = Math.random();
    const segs = silhouette(v);
    if (!segs.length) continue;
    const s = segs[Math.floor(Math.random() * segs.length)];
    const u = Math.random() * 2 - 1;
    const d = Math.sqrt(1 - u * u);
    pts.push({ x: s.c + u * s.hw, z: (Math.random() < 0.5 ? -1 : 1) * d * s.hw * 0.75, v, d });
  }
  return pts;
}

export default function ScannerCanvas({ progress, running }: { progress: number; running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const runningRef = useRef(running);
  progressRef.current = progress;
  runningRef.current = running;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const points = samplePoints(4200);
    let frame = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const p = progressRef.current;
      ctx.clearRect(0, 0, w, h);

      const bodyH = h * 0.62;
      const baseY = h * 0.72;
      const cx = w / 2;
      const toY = (v: number) => baseY - v * bodyH;

      // Perspective floor grid
      ctx.strokeStyle = "rgba(34,211,238,0.12)";
      ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 14, baseY - 6);
        ctx.lineTo(cx + i * 70, h);
        ctx.stroke();
      }
      for (let j = 0; j < 6; j++) {
        const y = baseY - 6 + Math.pow(j / 5, 1.6) * (h - baseY + 6);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Body rotates during side/back capture phases.
      const angle = p < 0.35 ? 0 : p < 0.85 ? ((p - 0.35) / 0.5) * Math.PI * 2 : 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const revealed = Math.min(1, p / 0.3);
      const density = Math.min(1, 0.15 + p * 1.1);

      // Depth contour grid across the surface
      ctx.lineWidth = 1;
      for (let v = 0.02; v < 1; v += 0.025) {
        if (1 - v > revealed) continue;
        for (const s of silhouette(v)) {
          ctx.beginPath();
          for (let k = 0; k <= 16; k++) {
            const u = -1 + (k / 16) * 2;
            const d = Math.sqrt(1 - u * u);
            const x = s.c + u * s.hw;
            const z = d * s.hw * 0.75;
            const px = cx + (x * cos + z * sin) * bodyH;
            const py = toY(v) - d * 2;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `hsla(${200 + v * 80}, 90%, 60%, 0.22)`;
          ctx.stroke();
        }
      }

      // Point cloud
      const shown = Math.floor(points.length * density);
      for (let i = 0; i < shown; i++) {
        const pt = points[i];
        if (1 - pt.v > revealed) continue;
        const zr = -pt.x * sin + pt.z * cos;
        if (zr < -0.01) continue; // back-facing
        const px = cx + (pt.x * cos + pt.z * sin) * bodyH;
        const py = toY(pt.v);
        ctx.fillStyle = `hsla(${185 + (1 - pt.d) * 90}, 95%, ${55 + pt.d * 15}%, ${0.35 + pt.d * 0.5})`;
        ctx.fillRect(px, py, 1.6, 1.6);
      }

      // Sweeping scan plane
      if (runningRef.current) {
        const sv = 0.5 + 0.5 * Math.sin(t * 1.8);
        const y = toY(sv);
        const grad = ctx.createLinearGradient(0, y - 30, 0, y + 30);
        grad.addColorStop(0, "rgba(34,211,238,0)");
        grad.addColorStop(0.5, "rgba(34,211,238,0.25)");
        grad.addColorStop(1, "rgba(34,211,238,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, y - 30, w, 60);
        ctx.strokeStyle = "rgba(165,243,252,0.95)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.08, y);
        ctx.lineTo(w * 0.92, y);
        ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
