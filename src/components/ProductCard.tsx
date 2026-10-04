"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Star } from "lucide-react";
import { buyLink } from "@/lib/affiliate";
import { brandName } from "@/lib/data";
import { recommendSize } from "@/lib/fit";
import { useScans } from "@/lib/store";
import type { Product } from "@/lib/types";
import FitBadge from "./FitBadge";
import ProductThumb from "./ProductThumb";

export default function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { activeScan } = useScans();
  const best = recommendSize(activeScan, product, true);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`card flex flex-col gap-2 p-2 ${compact ? "w-44 shrink-0" : ""}`}
    >
      <Link href={`/fit?product=${product.id}${best ? `&size=${best.size}` : ""}`}>
        <ProductThumb product={product} className={compact ? "h-24" : "h-32"} />
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-1">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">{brandName(product.brand)}</p>
        <Link href={`/fit?product=${product.id}${best ? `&size=${best.size}` : ""}`} className="line-clamp-2 text-sm font-medium leading-snug text-slate-100">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-white">${product.price.toFixed(2)}</span>
          <span className="inline-flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {product.rating}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-1 pt-1">
          <FitBadge evaluation={best} />
          {best && (
            <a
              href={buyLink(product, best.size)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-white"
            >
              Buy {best.size} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
