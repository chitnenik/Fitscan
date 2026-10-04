import { BRANDS, PRODUCTS, RETAILERS, SIZES } from "./data";
import type { ClothingType, Gender, Product, RetailerId, Size } from "./types";

export interface ScrapeResult {
  product: Product;
  requestedSize: Size;
  source: "catalog" | "parsed";
  steps: string[];
}

export type ScrapeOutcome = { ok: true; result: ScrapeResult } | { ok: false; error: string };

const TYPE_WORDS: [RegExp, ClothingType][] = [
  [/(jacket|coat|blazer|parka|puffer|windbreaker|windrunner|anorak|bomber)/, "jackets"],
  [/(dress|gown|sundress)/, "dresses"],
  [/(jean|pant|trouser|chino|jogger|short|legging|cargo)/, "pants"],
  [/(shirt|tee|t-shirt|top|polo|hoodie|sweater|sweatshirt|crew|tank|blouse)/, "tops"],
];

const BRAND_WORDS: [RegExp, string][] = [
  [/levi/, "levis"],
  [/nike/, "nike"],
  [/uniqlo/, "uniqlo"],
  [/zara/, "zara"],
  [/asos/, "asos-design"],
  [/(amazon-essentials|essentials)/, "amazon-essentials"],
];

const DEFAULT_BRAND: Record<RetailerId, string> = {
  amazon: "amazon-essentials",
  zara: "zara",
  asos: "asos-design",
  nike: "nike",
};

const COLORS = ["Black", "White", "Navy", "Blue", "Grey", "Khaki", "Green", "Red"];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const titleCase = (s: string) =>
  s
    .split(/[-_+]+/)
    .filter((w) => w && !/^\d+$/.test(w) && w.length > 1)
    .slice(0, 7)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

/** Mock scraper: resolves a pasted retailer URL into a product + its brand size chart. */
export function scrapeProductUrl(raw: string): ScrapeOutcome {
  const input = raw.trim();
  if (!input) return { ok: false, error: "Paste a product link to check." };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, error: "That doesn't look like a valid link." };
  }

  const host = url.hostname.toLowerCase();
  const retailer = (Object.keys(RETAILERS) as RetailerId[]).find((r) => host.includes(r));
  if (!retailer) {
    return {
      ok: false,
      error: `We don't have a size-chart partner for ${host} yet. Try Amazon, Zara, ASOS or Nike.`,
    };
  }

  const sizeParam = (url.searchParams.get("size") ?? url.searchParams.get("sz") ?? "").toUpperCase();
  const requestedSize: Size = (SIZES as string[]).includes(sizeParam) ? (sizeParam as Size) : "M";
  const path = decodeURIComponent(url.pathname.toLowerCase());

  const steps = [
    `Fetched ${RETAILERS[retailer].name} product page`,
    "Parsed product title, brand and variants",
  ];

  // Exact catalog hit (same retailer + SKU or path).
  const known = PRODUCTS.find(
    (p) =>
      p.retailer === retailer &&
      (path.includes(p.sku.toLowerCase()) || new URL(p.url).pathname.toLowerCase() === path),
  );
  if (known) {
    steps.push(`Loaded ${BRANDS[known.brand].name} size chart`);
    return { ok: true, result: { product: known, requestedSize, source: "catalog", steps } };
  }

  // Otherwise, infer what we can from the URL slug.
  const segments = path.split("/").filter(Boolean);
  const slug =
    segments.find((s) => s.includes("-") && !/^(us|en|t|dp|prd|gp|product)$/.test(s)) ?? segments[0] ?? "item";
  const type = TYPE_WORDS.find(([re]) => re.test(path))?.[1] ?? "tops";
  const brand = BRAND_WORDS.find(([re]) => re.test(path))?.[1] ?? DEFAULT_BRAND[retailer];
  const gender: Gender = /(women|womens|ladies|dress)/.test(path) ? "women" : /(men|mens)/.test(path) ? "men" : "unisex";
  const h = hash(url.href);
  const name = titleCase(slug.replace(/\.html$/, "").replace(/-p\d+$/, "")) || `${BRANDS[brand].name} item`;
  const skuMatch = path.match(/(b0[a-z0-9]{8}|\d{6,})/i);
  steps.push(`Matched brand: ${BRANDS[brand].name}`, `Loaded ${BRANDS[brand].name} size chart`);

  const product: Product = {
    id: `ext-${h.toString(36)}`,
    sku: skuMatch?.[0].toUpperCase() ?? h.toString(36).toUpperCase(),
    name,
    brand,
    retailer,
    type,
    gender,
    color: COLORS[h % COLORS.length],
    price: +(19 + (h % 12000) / 100).toFixed(2),
    currency: "USD",
    rating: +(3.5 + (h % 15) / 10).toFixed(1),
    reviews: 50 + (h % 3000),
    tags: [],
    stock: Object.fromEntries(SIZES.map((s, i) => [s, (h >> i) % 5 === 0 ? 0 : 3 + ((h >> (i + 3)) % 20)])) as Record<
      Size,
      number
    >,
    url: `${url.origin}${url.pathname}`,
  };
  return { ok: true, result: { product, requestedSize, source: "parsed", steps } };
}
