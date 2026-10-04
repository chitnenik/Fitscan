import { STATUS_COLOR } from "@/lib/colors";
import { ZONE_LABEL } from "@/lib/fit";
import type { SizeEvaluation } from "@/lib/types";

const WORD = { tight: "Tight", perfect: "Perfect", loose: "Loose" };

export default function ZoneBreakdown({ evaluation }: { evaluation: SizeEvaluation }) {
  return (
    <ul className="divide-y divide-edge">
      {evaluation.zones.map((z) => {
        // Position of the user's measurement on a bar spanning the size range ± 6cm.
        const lo = z.range[0] - 6;
        const hi = z.range[1] + 6;
        const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`;
        return (
          <li key={z.zone} className="flex items-center gap-3 py-2.5">
            <span className="w-20 text-sm capitalize text-slate-300">{ZONE_LABEL[z.zone]}</span>
            <div className="relative h-2 flex-1 rounded-full bg-slate-800">
              <div
                className="absolute inset-y-0 rounded-full bg-green-500/30"
                style={{ left: pct(z.range[0]), right: `calc(100% - ${pct(z.range[1])})` }}
              />
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink"
                style={{ left: pct(z.user), background: STATUS_COLOR[z.status] }}
              />
            </div>
            <span className="w-24 text-right text-xs font-semibold" style={{ color: STATUS_COLOR[z.status] }}>
              {WORD[z.status]}
              {z.delta > 0 && <span className="font-normal text-slate-500"> {z.delta}cm</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
