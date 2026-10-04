// Generates the mock JSON datasets in src/data (brand sizing matrices + retailer catalog).
// Run with: node scripts/generate-data.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");

// ---------------------------------------------------------------------------
// Brand sizing matrices: body-measurement ranges (cm) each size is cut for.
// ---------------------------------------------------------------------------
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const BASE = {
  XS: { chest: [82, 88], waist: [68, 74], hips: [84, 90], shoulder: [39, 41.5], inseam: [74, 77] },
  S: { chest: [88, 95], waist: [74, 80], hips: [90, 96], shoulder: [41.5, 44], inseam: [77, 79] },
  M: { chest: [95, 102], waist: [80, 87], hips: [96, 102], shoulder: [44, 46.5], inseam: [79, 81] },
  L: { chest: [102, 109], waist: [87, 94], hips: [102, 108], shoulder: [46.5, 49], inseam: [81, 83] },
  XL: { chest: [109, 117], waist: [94, 102], hips: [108, 115], shoulder: [49, 51.5], inseam: [83, 85] },
  XXL: { chest: [117, 125], waist: [102, 110], hips: [115, 122], shoulder: [51.5, 54], inseam: [85, 87] },
};
const WOMENS = { chest: -6, waist: -10, hips: 0, shoulder: -5, inseam: -3 };

const BRANDS = {
  "amazon-essentials": {
    name: "Amazon Essentials",
    fitNote: "Relaxed cut, roomy through the chest and shoulders",
    offset: { chest: 2, waist: 2, hips: 2, shoulder: 1, inseam: 0 },
  },
  zara: {
    name: "Zara",
    fitNote: "Runs small; European slim cut",
    offset: { chest: -3, waist: -3, hips: -2, shoulder: -1, inseam: 0 },
  },
  "asos-design": {
    name: "ASOS DESIGN",
    fitNote: "True to size in the body, narrow through the shoulders",
    offset: { chest: 0, waist: 0, hips: 0, shoulder: -1.5, inseam: 1 },
  },
  nike: {
    name: "Nike",
    fitNote: "Standard athletic fit",
    offset: { chest: 0, waist: 0, hips: 0, shoulder: 0, inseam: 0 },
  },
  levis: {
    name: "Levi's",
    fitNote: "Waist runs slightly small, generous inseam",
    offset: { chest: 0, waist: -1, hips: 0, shoulder: 0, inseam: 1.5 },
  },
  uniqlo: {
    name: "Uniqlo",
    fitNote: "Boxy Japanese cut, short inseams",
    offset: { chest: 1, waist: 1, hips: 0, shoulder: 0.5, inseam: -2 },
  },
};

const shift = (range, d) => [+(range[0] + d).toFixed(1), +(range[1] + d).toFixed(1)];
const buildChart = (offset, extra = {}) =>
  Object.fromEntries(
    SIZES.map((s) => [
      s,
      Object.fromEntries(
        Object.entries(BASE[s]).map(([k, r]) => [k, shift(r, (offset[k] ?? 0) + (extra[k] ?? 0))]),
      ),
    ]),
  );

const sizeCharts = {
  unit: "cm",
  sizes: SIZES,
  brands: Object.fromEntries(
    Object.entries(BRANDS).map(([id, b]) => [
      id,
      { name: b.name, fitNote: b.fitNote, charts: { mens: buildChart(b.offset), womens: buildChart(b.offset, WOMENS) } },
    ]),
  ),
};

// ---------------------------------------------------------------------------
// Retailer catalogs
// ---------------------------------------------------------------------------
// Deterministic pseudo-random so the dataset is stable between runs.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const RETAILER_URL = {
  amazon: (slug, sku) => `https://www.amazon.com/${slug}/dp/${sku}`,
  zara: (slug, sku) => `https://www.zara.com/us/en/${slug}-p${sku}.html`,
  asos: (slug, sku) => `https://www.asos.com/asos-design/${slug}/prd/${sku}`,
  nike: (slug, sku) => `https://www.nike.com/t/${slug}/${sku}`,
};

// [retailer, brand, name, type, gender, color, price, tags]
const ITEMS = [
  ["amazon", "amazon-essentials", "Men's Slim-Fit Crewneck T-Shirt", "tops", "men", "Navy", 14.9, ["casual", "summer"]],
  ["amazon", "amazon-essentials", "Men's Water-Resistant Puffer Jacket", "jackets", "men", "Black", 54.9, ["winter"]],
  ["amazon", "amazon-essentials", "Women's Relaxed-Fit Linen Dress", "dresses", "women", "White", 32.0, ["summer", "casual"]],
  ["amazon", "amazon-essentials", "Men's Classic-Fit Chino Pant", "pants", "men", "Khaki", 27.5, ["casual", "work"]],
  ["amazon", "levis", "Levi's 511 Slim Fit Jeans", "pants", "men", "Blue", 59.5, ["denim", "casual"]],
  ["amazon", "levis", "Levi's Trucker Denim Jacket", "jackets", "men", "Blue", 89.5, ["denim", "spring"]],
  ["amazon", "nike", "Nike Dri-FIT Running Tee", "tops", "men", "Black", 30.0, ["running", "summer"]],
  ["amazon", "levis", "Levi's Women's 724 High-Rise Straight Jeans", "pants", "women", "Blue", 69.5, ["denim"]],
  ["amazon", "amazon-essentials", "Women's Classic-Fit Oxford Shirt", "tops", "women", "White", 22.9, ["work"]],
  ["amazon", "uniqlo", "Uniqlo Ultra Light Down Jacket", "jackets", "unisex", "Olive", 69.9, ["winter", "travel"]],
  ["zara", "zara", "Textured Knit Polo Shirt", "tops", "men", "Beige", 35.9, ["summer", "casual"]],
  ["zara", "zara", "Oversize Wool Blend Coat", "jackets", "men", "Grey", 149.0, ["winter"]],
  ["zara", "zara", "Linen Blend Midi Dress", "dresses", "women", "Green", 59.9, ["summer"]],
  ["zara", "zara", "Satin Effect Slip Dress", "dresses", "women", "Black", 49.9, ["evening"]],
  ["zara", "zara", "Slim Fit Suit Trousers", "pants", "men", "Black", 59.9, ["work"]],
  ["zara", "zara", "Faux Leather Biker Jacket", "jackets", "women", "Black", 89.9, ["spring"]],
  ["zara", "zara", "Cropped Poplin Shirt", "tops", "women", "Blue", 35.9, ["summer"]],
  ["zara", "zara", "Relaxed Fit Jogger Pants", "pants", "men", "Grey", 45.9, ["casual"]],
  ["zara", "zara", "Floral Print Mini Dress", "dresses", "women", "Red", 45.9, ["summer"]],
  ["asos", "asos-design", "Oversized T-Shirt in Washed Black", "tops", "men", "Black", 18.0, ["casual", "summer"]],
  ["asos", "asos-design", "Smart Skinny Wool Mix Blazer", "jackets", "men", "Navy", 95.0, ["work"]],
  ["asos", "asos-design", "Wrap Front Midi Sundress", "dresses", "women", "Yellow", 52.0, ["summer"]],
  ["asos", "asos-design", "Wide Leg Cargo Trousers", "pants", "men", "Khaki", 48.0, ["casual"]],
  ["asos", "asos-design", "Muscle Fit Rib Polo", "tops", "men", "White", 26.0, ["summer"]],
  ["asos", "nike", "Nike Club Fleece Hoodie", "tops", "unisex", "Grey", 60.0, ["casual", "winter"]],
  ["asos", "asos-design", "Puffer Jacket with Hood", "jackets", "women", "Red", 78.0, ["winter"]],
  ["asos", "asos-design", "Tiered Maxi Dress in Ditsy Floral", "dresses", "women", "Blue", 64.0, ["summer"]],
  ["asos", "levis", "Levi's 501 Original Jeans", "pants", "men", "Blue", 98.0, ["denim"]],
  ["nike", "nike", "Nike Windrunner Jacket", "jackets", "men", "Black", 110.0, ["running", "spring"]],
  ["nike", "nike", "Nike Tech Fleece Joggers", "pants", "men", "Grey", 120.0, ["casual"]],
  ["nike", "nike", "Nike Sportswear Club T-Shirt", "tops", "men", "White", 25.0, ["casual", "summer"]],
  ["nike", "nike", "Nike Dri-FIT Challenger Shorts", "pants", "men", "Navy", 45.0, ["running", "summer"]],
  ["nike", "nike", "Nike One Women's Leggings", "pants", "women", "Black", 55.0, ["running"]],
  ["nike", "nike", "Nike Storm-FIT Running Jacket", "jackets", "women", "Green", 150.0, ["running", "winter"]],
  ["nike", "nike", "Nike Sportswear Essential Tank Dress", "dresses", "women", "Black", 50.0, ["summer"]],
  ["nike", "nike", "Nike Dri-FIT Miler Top", "tops", "women", "Pink", 35.0, ["running", "summer"]],
  ["amazon", "nike", "Nike Sportswear Club Fleece Crew", "tops", "men", "Navy", 55.0, ["winter"]],
  ["zara", "zara", "Basic Heavy Weight T-Shirt", "tops", "men", "White", 19.9, ["casual", "summer"]],
  ["asos", "asos-design", "Slim Fit Shirt in Pink", "tops", "men", "Pink", 30.0, ["work"]],
  ["amazon", "uniqlo", "Uniqlo Smart Ankle Pants", "pants", "unisex", "Black", 49.9, ["work"]],
];

const slugify = (s) => s.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const catalog = ITEMS.map(([retailer, brand, name, type, gender, color, price, tags], i) => {
  const sku =
    retailer === "amazon"
      ? "B0" + Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"[Math.floor(rand() * 34)]).join("")
      : `${10000000 + Math.floor(rand() * 89999999)}`;
  const stock = Object.fromEntries(
    SIZES.map((s) => [s, rand() < 0.2 ? 0 : 1 + Math.floor(rand() * 24)]),
  );
  // Guarantee the demo-critical sizes behave predictably.
  if (i === 6) Object.assign(stock, { M: 12, L: 7 }); // Nike Dri-FIT Running Tee on Amazon
  if (i === 0) Object.assign(stock, { M: 18 }); // Amazon Essentials tee
  const slug = slugify(name);
  return {
    id: `p${String(i + 1).padStart(3, "0")}`,
    sku,
    name,
    brand,
    retailer,
    type,
    gender,
    color,
    price,
    currency: "USD",
    rating: +(3.6 + rand() * 1.3).toFixed(1),
    reviews: 40 + Math.floor(rand() * 4000),
    tags,
    stock,
    url: RETAILER_URL[retailer](slug, sku),
  };
});

writeFileSync(join(out, "sizeCharts.json"), JSON.stringify(sizeCharts, null, 2) + "\n");
writeFileSync(join(out, "catalog.json"), JSON.stringify({ products: catalog }, null, 2) + "\n");
console.log(`wrote ${catalog.length} products and ${Object.keys(BRANDS).length} brand charts`);
