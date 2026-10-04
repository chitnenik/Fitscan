"use client";

import { Flame } from "lucide-react";

export default function HeatToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`chip ${on ? "chip-on" : ""}`}
    >
      <Flame className="h-3.5 w-3.5" /> Heat map {on ? "on" : "off"}
    </button>
  );
}
