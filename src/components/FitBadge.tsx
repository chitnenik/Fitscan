import { BadgeCheck, TriangleAlert } from "lucide-react";
import type { SizeEvaluation } from "@/lib/types";

export default function FitBadge({ evaluation }: { evaluation?: SizeEvaluation }) {
  if (!evaluation) return null;
  return evaluation.fits ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-400">
      <BadgeCheck className="h-3.5 w-3.5" /> {evaluation.size} fits
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
      <TriangleAlert className="h-3.5 w-3.5" /> Best {evaluation.size}
    </span>
  );
}
