"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, TriangleAlert } from "lucide-react";
import Avatar from "@/components/Avatar";
import HeatLegend from "@/components/HeatLegend";
import HeatToggle from "@/components/HeatToggle";
import PageHeader from "@/components/PageHeader";
import ProductThumb from "@/components/ProductThumb";
import ZoneBreakdown from "@/components/ZoneBreakdown";
import { buyLink } from "@/lib/affiliate";
import { BRANDS, getProduct, PRODUCTS, RETAILERS, SIZES } from "@/lib/data";
import { chartFor, evaluateSize, recommendSize, verdictText, zoneStatusMap } from "@/lib/fit";
import { useScans } from "@/lib/store";
import type { Size } from "@/lib/types";

export default function FitPreview({ productId, initialSize }: { productId?: string; initialSize?: string }) {
  const { activeScan } = useScans();
  const [id, setId] = useState(productId && getProduct(productId) ? productId : "p007");
  const product = getProduct(id)!;
  const best = useMemo(() => recommendSize(activeScan, product, true), [activeScan, product]);
  const [chosen, setChosen] = useState<Size | null>(
    (SIZES as string[]).includes(initialSize ?? "") ? (initialSize as Size) : null,
  );
  const size = chosen ?? best?.size ?? "M";
  const [heat, setHeat] = useState(true);
  const evaluation = evaluateSize(activeScan, chartFor(product, activeScan), size, product.type);
  const verdict = verdictText(evaluation);

  return (
    <main>
      <PageHeader eyebrow="Fit preview" title={`${activeScan.name} × ${BRANDS[product.brand].name}`} />
      <section className="space-y-4 px-4">
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setChosen(null);
          }}
          className="w-full rounded-xl border border-edge bg-panel px-3 py-2.5 text-sm outline-none"
          aria-label="Choose a product"
        >
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {RETAILERS[p.retailer].name}
            </option>
          ))}
        </select>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex items-center gap-2">
              {evaluation.fits ? (
                <BadgeCheck className="h-5 w-5 text-green-400" />
              ) : (
                <TriangleAlert className="h-5 w-5 text-red-400" />
              )}
              <p className="text-sm font-semibold">{verdict.detail}</p>
            </div>
            <HeatToggle on={heat} onChange={setHeat} />
          </div>
          <Avatar measurements={activeScan.measurements} zones={zoneStatusMap(evaluation)} heatmap={heat} className="h-96 w-full" />
          <HeatLegend />
          <div className="flex gap-1.5 p-4 pb-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setChosen(s)}
                disabled={product.stock[s] === 0}
                className={`chip relative flex-1 justify-center disabled:opacity-30 ${size === s ? "chip-on" : ""}`}
              >
                {s}
                {best?.size === s && <span className="absolute -top-1 right-0.5 h-2 w-2 rounded-full bg-lime" />}
              </button>
            ))}
          </div>
          <p className="px-4 text-[11px] text-slate-500">
            Green dot = recommended in-stock size. Greyed sizes are sold out.
          </p>
          <div className="p-4 pt-2">
            <ZoneBreakdown evaluation={evaluation} />
          </div>
        </div>

        <motion.div layout className="card flex gap-3 p-3">
          <div className="w-24 shrink-0">
            <ProductThumb product={product} className="h-24" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="line-clamp-2 text-sm font-medium text-white">{product.name}</p>
            <p className="text-xs text-slate-400">
              ${product.price.toFixed(2)} · {product.color} · {BRANDS[product.brand].fitNote}
            </p>
            <a
              href={buyLink(product, size)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="btn-primary mt-auto py-2"
            >
              Buy size {size} at {RETAILERS[product.retailer].name} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
