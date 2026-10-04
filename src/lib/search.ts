import { brandName, RETAILERS } from "./data";
import { matchesMySize } from "./fit";
import type { ClothingType, Gender, Product, RetailerId, UserScan } from "./types";

export interface Filters {
  query: string;
  retailers: RetailerId[];
  types: ClothingType[];
  colors: string[];
  priceMin: number;
  priceMax: number;
  matchesMySize: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  retailers: [],
  types: [],
  colors: [],
  priceMin: 0,
  priceMax: 200,
  matchesMySize: false,
};

export interface ParsedCategory {
  gender?: Gender;
  type?: ClothingType;
  season?: string;
  tag?: string;
  text: string[];
}

const GENDER_WORDS: Record<string, Gender> = {
  men: "men",
  mens: "men",
  "men's": "men",
  man: "men",
  male: "men",
  women: "women",
  womens: "women",
  "women's": "women",
  woman: "women",
  ladies: "women",
  female: "women",
};

const TYPE_WORDS: Record<string, ClothingType> = {
  jacket: "jackets",
  jackets: "jackets",
  coat: "jackets",
  coats: "jackets",
  outerwear: "jackets",
  blazer: "jackets",
  dress: "dresses",
  dresses: "dresses",
  pants: "pants",
  pant: "pants",
  jeans: "pants",
  trousers: "pants",
  bottoms: "pants",
  shorts: "pants",
  joggers: "pants",
  tops: "tops",
  top: "tops",
  shirts: "tops",
  shirt: "tops",
  tees: "tops",
  "t-shirts": "tops",
  hoodies: "tops",
};

const STOPWORDS = ["gear", "clothes", "clothing", "wear", "outfits", "for", "and", "the", "in"];
const SEASONS = ["summer", "winter", "spring"];
const TAGS = ["running", "denim", "work", "casual", "evening", "travel"];

/** Turns free text like "Men's Jackets" or "summer dresses" into structured category filters. */
export function parseCategoryQuery(query: string): ParsedCategory {
  const out: ParsedCategory = { text: [] };
  for (const raw of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    const w = raw.replace(/[^a-z'-]/g, "");
    if (STOPWORDS.includes(w)) continue;
    if (w === "jeans") out.tag = "denim";
    if (GENDER_WORDS[w]) out.gender = GENDER_WORDS[w];
    else if (TYPE_WORDS[w]) out.type = TYPE_WORDS[w];
    else if (SEASONS.includes(w)) out.season = w;
    else if (TAGS.includes(w)) out.tag = w;
    else if (w) out.text.push(w);
  }
  return out;
}

export function filterProducts(products: Product[], f: Filters, scan?: UserScan) {
  const cat = parseCategoryQuery(f.query);
  return products.filter((p) => {
    if (f.retailers.length && !f.retailers.includes(p.retailer)) return false;
    if (f.types.length && !f.types.includes(p.type)) return false;
    if (f.colors.length && !f.colors.includes(p.color)) return false;
    if (p.price < f.priceMin || (f.priceMax < 200 && p.price > f.priceMax)) return false;
    if (cat.gender && p.gender !== cat.gender && p.gender !== "unisex") return false;
    if (cat.type && p.type !== cat.type) return false;
    if (cat.season && !p.tags.includes(cat.season)) return false;
    if (cat.tag && !p.tags.includes(cat.tag)) return false;
    if (cat.text.length) {
      const hay = `${p.name} ${brandName(p.brand)} ${RETAILERS[p.retailer].name} ${p.color} ${p.tags.join(" ")}`.toLowerCase();
      if (!cat.text.every((t) => hay.includes(t))) return false;
    }
    if (f.matchesMySize && (!scan || !matchesMySize(scan, p))) return false;
    return true;
  });
}

export const CATEGORY_SHORTCUTS = [
  "Men's Jackets",
  "Summer Dresses",
  "Women's Tops",
  "Men's Jeans",
  "Running Gear",
  "Winter Coats",
];
