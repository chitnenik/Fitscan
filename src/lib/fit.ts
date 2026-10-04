import { BRANDS, SIZES } from "./data";
import type {
  ClothingType,
  FitStatus,
  MeasurementKey,
  Product,
  Size,
  SizeChart,
  SizeEvaluation,
  UserScan,
  Zone,
  ZoneResult,
} from "./types";

export const ZONES_BY_TYPE: Record<ClothingType, Zone[]> = {
  tops: ["shoulders", "chest", "waist"],
  jackets: ["shoulders", "chest", "waist"],
  pants: ["waist", "hips", "inseam"],
  dresses: ["shoulders", "chest", "waist", "hips"],
};

const ZONE_KEY: Record<Zone, MeasurementKey> = {
  shoulders: "shoulder",
  chest: "chest",
  waist: "waist",
  hips: "hips",
  inseam: "inseam",
};

export const ZONE_LABEL: Record<Zone, string> = {
  shoulders: "shoulders",
  chest: "chest",
  waist: "waist",
  hips: "hips",
  inseam: "inseam",
};

/** How far past a range's max (cm) before it reads as tight. */
const TIGHT_TOLERANCE = 0.5;
/** How far under a range's min (cm) before it reads as loose; ease is more forgiving. */
const LOOSE_TOLERANCE: Record<Zone, number> = { shoulders: 2, chest: 3, waist: 3, hips: 3, inseam: 2 };

export function chartFor(product: Pick<Product, "brand" | "gender">, scan?: UserScan): SizeChart {
  const brand = BRANDS[product.brand] ?? BRANDS.nike;
  const gender = product.gender === "unisex" ? (scan?.gender ?? "men") : product.gender;
  return gender === "women" ? brand.charts.womens : brand.charts.mens;
}

export function evaluateSize(
  scan: UserScan,
  chart: SizeChart,
  size: Size,
  type: ClothingType,
): SizeEvaluation {
  const zones: ZoneResult[] = ZONES_BY_TYPE[type].map((zone) => {
    const user = scan.measurements[ZONE_KEY[zone]];
    const range = chart[size][ZONE_KEY[zone]];
    let status: FitStatus = "perfect";
    let delta = 0;
    if (user > range[1] + TIGHT_TOLERANCE) {
      status = "tight";
      delta = user - range[1];
    } else if (user < range[0] - LOOSE_TOLERANCE[zone]) {
      status = "loose";
      delta = range[0] - user;
    }
    return { zone, status, delta: +delta.toFixed(1), user, range };
  });
  // Tightness is worse than looseness: you can't wear a garment that pinches.
  const score = zones.reduce((s, z) => s + (z.status === "tight" ? z.delta * 2 : z.delta), 0);
  const problems = zones.filter((z) => z.status !== "perfect");
  const worst = problems.sort((a, b) => (b.status === "tight" ? b.delta * 2 : b.delta) - (a.status === "tight" ? a.delta * 2 : a.delta))[0];
  return { size, zones, fits: problems.length === 0, score: +score.toFixed(2), worst };
}

export function evaluateAll(scan: UserScan, product: Pick<Product, "brand" | "gender" | "type">) {
  const chart = chartFor(product, scan);
  return SIZES.map((s) => evaluateSize(scan, chart, s, product.type));
}

/** Best size for the scan, optionally limited to sizes in stock. */
export function recommendSize(
  scan: UserScan,
  product: Pick<Product, "brand" | "gender" | "type"> & { stock?: Product["stock"] },
  inStockOnly = false,
): SizeEvaluation | undefined {
  const evals = evaluateAll(scan, product).filter(
    (e) => !inStockOnly || !product.stock || product.stock[e.size] > 0,
  );
  return evals.sort((a, b) => a.score - b.score || SIZES.indexOf(a.size) - SIZES.indexOf(b.size))[0];
}

/** True when the scan's exact best size verifies as a fit and is in stock. */
export function matchesMySize(scan: UserScan, product: Product): SizeEvaluation | undefined {
  const best = recommendSize(scan, product);
  if (best && best.fits && product.stock[best.size] > 0) return best;
  return undefined;
}

export function verdictText(e: SizeEvaluation): { headline: string; detail: string } {
  if (e.fits) {
    return {
      headline: "VERIFIED FIT: YES",
      detail: `Size ${e.size} fits your measurements perfectly.`,
    };
  }
  const w = e.worst!;
  const where = w.zone === "inseam" ? "in the inseam" : `at the ${ZONE_LABEL[w.zone]}`;
  const how = w.zone === "inseam" ? (w.status === "tight" ? "too short" : "too long") : `too ${w.status}`;
  return {
    headline: "FIT WARNING: NO",
    detail: `Size ${e.size} will be ${how} ${where}.`,
  };
}

export function zoneStatusMap(e?: SizeEvaluation): Partial<Record<Zone, FitStatus>> {
  if (!e) return {};
  return Object.fromEntries(e.zones.map((z) => [z.zone, z.status]));
}
