"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, ClipboardPaste, ExternalLink, Link2, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import Avatar from "@/components/Avatar";
import HeatLegend from "@/components/HeatLegend";
import HeatToggle from "@/components/HeatToggle";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import ProductThumb from "@/components/ProductThumb";
import ZoneBreakdown from "@/components/ZoneBreakdown";
import { buyLink } from "@/lib/affiliate";
import { BRANDS, PRODUCTS, RETAILERS, SIZES } from "@/lib/data";
import { chartFor, evaluateAll, evaluateSize, matchesMySize, verdictText, zoneStatusMap } from "@/lib/fit";
import { scrapeProductUrl, type ScrapeResult } from "@/lib/scraper";
import { useScans } from "@/lib/store";
import type { Product, Size, UserScan } from "@/lib/types";

const nikeTee = PRODUCTS.find((p) => p.id === "p007")!;
const essentialsTee = PRODUCTS.find((p) => p.id === "p001")!;

const SAMPLES = [
  { label: "Nike tee · Amazon · M", url: `${nikeTee.url}?size=M` },
  { label: "Essentials tee · Amazon · M", url: `${essentialsTee.url}?size=M` },
  { label: "Zara blazer link", url: "https://www.zara.com/us/en/mens-slim-fit-textured-blazer-p01564302.html?size=M" },
  { label: "ASOS shirt link", url: "https://www.asos.com/asos-design/asos-design-muscle-fit-oxford-shirt/prd/204518832?size=M" },
];

type Phase = "idle" | "working" | "done";

export default function CheckPage() {
  const { activeScan } = useScans();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [size, setSize] = useState<Size>("M");

  const run = async (raw = url) => {
    setError(null);
    const outcome = scrapeProductUrl(raw);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    setPhase("working");
    setResult(null);
    setSteps([]);
    const all = [...outcome.result.steps, `Comparing against ${activeScan.name}'s body scan`];
    for (const s of all) {
      await new Promise((r) => setTimeout(r, 420));
      setSteps((prev) => [...prev, s]);
    }
    await new Promise((r) => setTimeout(r, 300));
    setResult(outcome.result);
    setSize(outcome.result.requestedSize);
    setPhase("done");
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      setError("Clipboard access was blocked. Long-press the field to paste instead.");
    }
  };

  return (
    <main>
      <PageHeader eyebrow="Feature C" title="Will it fit me?" />
      <section className="space-y-3 px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="card space-y-3 p-3"
        >
          <label className="flex items-center gap-2 rounded-xl border border-edge bg-ink px-3">
            <Link2 className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a product link (Amazon, Zara, ASOS, Nike)"
              inputMode="url"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-500"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={paste} className="btn-ghost flex-1">
              <ClipboardPaste className="h-4 w-4" /> Paste
            </button>
            <button type="submit" disabled={phase === "working"} className="btn-primary flex-[1.4]">
              {phase === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Check my fit
            </button>
          </div>
          {error && <p className="text-xs text-amber-400">{error}</p>}
        </form>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <span className="shrink-0 self-center text-[11px] text-slate-500">Try:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setUrl(s.url);
                run(s.url);
              }}
              className="chip"
            >
              {s.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {phase === "working" && (
            <motion.ul key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card space-y-2 p-4 font-mono text-xs">
              {steps.map((s) => (
                <motion.li key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-slate-300">
                  <BadgeCheck className="h-3.5 w-3.5 text-accent" /> {s}
                </motion.li>
              ))}
              <li className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> working…
              </li>
            </motion.ul>
          )}
          {phase === "done" && result && (
            <FitResult key={result.product.id} scan={activeScan} result={result} size={size} onSize={setSize} />
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function FitResult({
  scan,
  result,
  size,
  onSize,
}: {
  scan: UserScan;
  result: ScrapeResult;
  size: Size;
  onSize: (s: Size) => void;
}) {
  const { product } = result;
  const [heat, setHeat] = useState(true);
  const evaluation = evaluateSize(scan, chartFor(product, scan), size, product.type);
  const verdict = verdictText(evaluation);
  const altSizes = evaluateAll(scan, product).filter((e) => e.fits && e.size !== size);
  const similar = similarItems(scan, product);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 pb-4">
      <div className="card flex gap-3 p-3">
        <div className="w-24 shrink-0">
          <ProductThumb product={product} className="h-24" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            {BRANDS[product.brand].name} · {RETAILERS[product.retailer].name}
          </p>
          <p className="line-clamp-2 text-sm font-medium text-white">{product.name}</p>
          <p className="mt-1 text-xs text-slate-400">
            ${product.price.toFixed(2)} · {result.source === "catalog" ? "Matched partner listing" : "Parsed from link"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Brand fit: {BRANDS[product.brand].fitNote}</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {SIZES.map((s) => (
          <button key={s} onClick={() => onSize(s)} className={`chip flex-1 justify-center ${size === s ? "chip-on" : ""}`}>
            {s}
          </button>
        ))}
      </div>

      <motion.div
        key={`${size}-${evaluation.fits}`}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-2xl border p-4 ${
          evaluation.fits ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"
        }`}
      >
        <div className="flex items-start gap-3">
          {evaluation.fits ? (
            <BadgeCheck className="h-7 w-7 shrink-0 text-green-400" />
          ) : (
            <TriangleAlert className="h-7 w-7 shrink-0 text-red-400" />
          )}
          <div>
            <p className={`font-mono text-sm font-bold tracking-wide ${evaluation.fits ? "text-green-400" : "text-red-400"}`}>
              {verdict.headline}
            </p>
            <p className="text-base font-semibold text-white">{verdict.detail}</p>
          </div>
        </div>
        {evaluation.fits && (
          <a
            href={buyLink(product, size)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="btn-primary mt-4 w-full bg-green-400"
          >
            Buy size {size} at {RETAILERS[product.retailer].name} <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </motion.div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <p className="text-sm font-semibold">{evaluation.fits ? "Fit preview" : "Where it pinches or gaps"}</p>
          <HeatToggle on={heat} onChange={setHeat} />
        </div>
        <Avatar measurements={scan.measurements} zones={zoneStatusMap(evaluation)} heatmap={heat} className="h-72 w-full" />
        <HeatLegend />
        <div className="p-4 pt-2">
          <ZoneBreakdown evaluation={evaluation} />
        </div>
      </div>

      {!evaluation.fits && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Recommended instead</h2>
          {altSizes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {altSizes.map((e) => (
                <div key={e.size} className="card flex flex-1 items-center justify-between gap-2 p-3">
                  <button onClick={() => onSize(e.size)} className="text-left">
                    <p className="text-sm font-semibold text-green-400">Size {e.size} fits</p>
                    <p className="text-[11px] text-slate-500">
                      {product.stock[e.size] > 0 ? `${product.stock[e.size]} in stock` : "Out of stock"}
                    </p>
                  </button>
                  {product.stock[e.size] > 0 && (
                    <a
                      href={buyLink(product, e.size)}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold"
                    >
                      Buy <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No size of this item fits {scan.name}&apos;s proportions.</p>
          )}
          {similar.length > 0 && (
            <>
              <h2 className="pt-2 text-sm font-semibold text-white">Similar items in your exact size</h2>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
                {similar.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

/** Same type, compatible gender, verified fit in stock — favouring other retailers and similar price. */
function similarItems(scan: UserScan, product: Product) {
  return PRODUCTS.filter(
    (p) =>
      p.id !== product.id &&
      p.type === product.type &&
      (p.gender === product.gender || p.gender === "unisex" || product.gender === "unisex") &&
      matchesMySize(scan, p),
  )
    .sort(
      (a, b) =>
        Number(a.retailer === product.retailer) - Number(b.retailer === product.retailer) ||
        Math.abs(a.price - product.price) - Math.abs(b.price - product.price),
    )
    .slice(0, 8);
}
