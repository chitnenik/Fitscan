"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ruler, Search, SlidersHorizontal, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import { COLOR_SWATCH, PRODUCTS, RETAILERS, TYPE_LABEL } from "@/lib/data";
import { CATEGORY_SHORTCUTS, DEFAULT_FILTERS, filterProducts, parseCategoryQuery, type Filters } from "@/lib/search";
import { useScans } from "@/lib/store";
import type { ClothingType, RetailerId } from "@/lib/types";

const COLORS = Array.from(new Set(PRODUCTS.map((p) => p.color)));

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export default function CatalogPage() {
  const { activeScan } = useScans();
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const results = useMemo(() => filterProducts(PRODUCTS, f, activeScan), [f, activeScan]);
  const cat = parseCategoryQuery(f.query);
  const activeCount =
    f.retailers.length + f.types.length + f.colors.length + (f.priceMin > 0 || f.priceMax < 200 ? 1 : 0);
  const set = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));

  return (
    <main>
      <PageHeader eyebrow="Features B + D" title="Shop every retailer" />
      <div className="sticky top-[68px] z-20 space-y-3 bg-ink/85 px-4 pb-3 backdrop-blur-lg">
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-edge bg-panel px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={f.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="Try “Men's Jackets” or “Summer Dresses”"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-500"
            />
            {f.query && (
              <button onClick={() => set({ query: "" })} aria-label="Clear search">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </label>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`relative rounded-xl border px-3 ${showFilters ? "border-accent text-accent" : "border-edge text-slate-300"} bg-panel`}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button
            onClick={() => set({ matchesMySize: !f.matchesMySize })}
            className={`chip ${f.matchesMySize ? "border-lime/60 bg-lime/15 text-lime" : ""}`}
          >
            <Ruler className="h-3.5 w-3.5" /> Matches My Size
          </button>
          {CATEGORY_SHORTCUTS.map((c) => (
            <button key={c} onClick={() => set({ query: c })} className={`chip ${f.query === c ? "chip-on" : ""}`}>
              {c}
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="card space-y-3 p-3">
                <FilterRow label="Retailer">
                  {(Object.keys(RETAILERS) as RetailerId[]).map((r) => (
                    <button key={r} onClick={() => set({ retailers: toggle(f.retailers, r) })} className={`chip ${f.retailers.includes(r) ? "chip-on" : ""}`}>
                      {RETAILERS[r].name}
                    </button>
                  ))}
                </FilterRow>
                <FilterRow label="Clothing type">
                  {(Object.keys(TYPE_LABEL) as ClothingType[]).map((t) => (
                    <button key={t} onClick={() => set({ types: toggle(f.types, t) })} className={`chip ${f.types.includes(t) ? "chip-on" : ""}`}>
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </FilterRow>
                <FilterRow label="Color">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => set({ colors: toggle(f.colors, c) })} className={`chip ${f.colors.includes(c) ? "chip-on" : ""}`}>
                      <span className="h-3 w-3 rounded-full border border-white/20" style={{ background: COLOR_SWATCH[c] }} />
                      {c}
                    </button>
                  ))}
                </FilterRow>
                <div>
                  <p className="mb-1 flex justify-between text-xs text-slate-400">
                    Price range
                    <span className="font-mono text-slate-200">
                      ${f.priceMin} – ${f.priceMax}
                      {f.priceMax >= 200 ? "+" : ""}
                    </span>
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={200}
                      step={5}
                      value={f.priceMin}
                      onChange={(e) => set({ priceMin: Math.min(+e.target.value, f.priceMax - 5) })}
                      className="w-full"
                      aria-label="Minimum price"
                    />
                    <input
                      type="range"
                      min={0}
                      max={200}
                      step={5}
                      value={f.priceMax}
                      onChange={(e) => set({ priceMax: Math.max(+e.target.value, f.priceMin + 5) })}
                      className="w-full"
                      aria-label="Maximum price"
                    />
                  </div>
                </div>
                <button onClick={() => setF({ ...DEFAULT_FILTERS, query: f.query })} className="text-xs text-accent">
                  Reset filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>
            {results.length} item{results.length === 1 ? "" : "s"}
          </span>
          {(cat.gender || cat.type || cat.season || cat.tag) && (
            <span className="inline-flex flex-wrap gap-1">
              Category:
              {[cat.gender && (cat.gender === "men" ? "Men's" : "Women's"), cat.type && TYPE_LABEL[cat.type], cat.season, cat.tag]
                .filter(Boolean)
                .map((x) => (
                  <span key={String(x)} className="rounded bg-accent/10 px-1.5 capitalize text-accent">
                    {x}
                  </span>
                ))}
            </span>
          )}
          {f.matchesMySize && (
            <span className="text-lime">
              In stock in {activeScan.name}&apos;s exact size
            </span>
          )}
        </div>
        <motion.div layout className="grid grid-cols-2 gap-3">
          <AnimatePresence>
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </AnimatePresence>
        </motion.div>
        {results.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">Nothing matches those filters. Try widening the search.</p>
        )}
      </div>
    </main>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
