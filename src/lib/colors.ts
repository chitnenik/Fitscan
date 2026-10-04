import type { FitStatus } from "./types";

export const STATUS_COLOR: Record<FitStatus | "neutral", string> = {
  tight: "#ef4444",
  perfect: "#22c55e",
  loose: "#3b82f6",
  neutral: "#7c8db5",
};
