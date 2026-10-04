import { Footprints, Shirt, Sparkles, Wind } from "lucide-react";
import { COLOR_SWATCH, RETAILERS } from "@/lib/data";
import type { Product } from "@/lib/types";

const ICON = { tops: Shirt, pants: Footprints, jackets: Wind, dresses: Sparkles };

/** Stand-in product image: a tinted tile with the garment type glyph. */
export default function ProductThumb({ product, className = "h-32" }: { product: Product; className?: string }) {
  const Icon = ICON[product.type];
  const swatch = COLOR_SWATCH[product.color] ?? "#64748b";
  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{ background: `radial-gradient(circle at 30% 20%, ${swatch}55, #0b1220 75%)` }}
    >
      <Icon className="h-12 w-12 opacity-90" style={{ color: swatch === "#111827" ? "#94a3b8" : swatch }} strokeWidth={1.25} />
      <span
        className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold"
        style={{ color: RETAILERS[product.retailer].color }}
      >
        {RETAILERS[product.retailer].name}
      </span>
    </div>
  );
}
