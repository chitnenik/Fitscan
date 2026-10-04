import catalogJson from "@/data/catalog.json";
import sizeChartsJson from "@/data/sizeCharts.json";
import userScansJson from "@/data/userScans.json";
import type { Brand, ClothingType, Product, RetailerId, Size, UserScan } from "./types";

export const SIZES = sizeChartsJson.sizes as Size[];
export const BRANDS = sizeChartsJson.brands as unknown as Record<string, Brand>;
export const PRODUCTS = catalogJson.products as unknown as Product[];
export const SAMPLE_SCANS = userScansJson.scans as UserScan[];

export const RETAILERS: Record<RetailerId, { name: string; color: string; host: string }> = {
  amazon: { name: "Amazon", color: "#ff9900", host: "amazon.com" },
  zara: { name: "Zara", color: "#e5e5e5", host: "zara.com" },
  asos: { name: "ASOS", color: "#2d9cdb", host: "asos.com" },
  nike: { name: "Nike", color: "#f97316", host: "nike.com" },
};

export const TYPE_LABEL: Record<ClothingType, string> = {
  tops: "Tops",
  pants: "Pants",
  jackets: "Jackets",
  dresses: "Dresses",
};

export const COLOR_SWATCH: Record<string, string> = {
  Black: "#111827",
  White: "#f8fafc",
  Navy: "#1e3a8a",
  Blue: "#3b82f6",
  Grey: "#9ca3af",
  Khaki: "#c3b091",
  Beige: "#e7d7b9",
  Olive: "#6b7d3a",
  Green: "#16a34a",
  Red: "#dc2626",
  Yellow: "#facc15",
  Pink: "#f472b6",
};

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
export const brandName = (id: string) => BRANDS[id]?.name ?? id;
