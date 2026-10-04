import { STATUS_COLOR } from "@/lib/colors";

export default function HeatLegend() {
  return (
    <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
      {(["tight", "perfect", "loose"] as const).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5 capitalize">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[s] }} />
          {s}
        </span>
      ))}
    </div>
  );
}
