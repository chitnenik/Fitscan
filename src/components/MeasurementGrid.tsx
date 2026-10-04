"use client";

import { motion } from "framer-motion";
import type { Measurements } from "@/lib/types";

const ROWS: { key: keyof Measurements; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hips", label: "Hips" },
  { key: "inseam", label: "Inseam" },
  { key: "shoulder", label: "Shoulder width" },
];

export default function MeasurementGrid({ m, animate = false }: { m: Measurements; animate?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ROWS.map(({ key, label }, i) => (
        <motion.div
          key={key}
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animate ? 0.1 * i : 0 }}
          className={`rounded-xl border border-edge bg-ink/60 px-3 py-2 ${key === "shoulder" ? "col-span-2" : ""}`}
        >
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
          <p className="font-mono text-lg font-semibold text-white">
            {m[key].toFixed(1)}
            <span className="ml-0.5 text-xs font-normal text-slate-500">cm</span>
          </p>
        </motion.div>
      ))}
    </div>
  );
}
