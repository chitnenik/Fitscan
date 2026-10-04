import type { Product, Size } from "./types";

const PARTNER_TAG = "fitscan-20";

/** Builds an affiliate-style deep link that pre-selects the recommended size. */
export function buyLink(product: Product, size: Size) {
  const url = new URL(product.url);
  switch (product.retailer) {
    case "amazon":
      url.searchParams.set("tag", PARTNER_TAG);
      url.searchParams.set("th", "1");
      url.searchParams.set("psc", "1");
      break;
    case "zara":
      url.searchParams.set("utm_source", "fitscan");
      break;
    case "asos":
      url.searchParams.set("affid", "fitscan");
      break;
    case "nike":
      url.searchParams.set("cp", "fitscan_aff");
      break;
  }
  url.searchParams.set("size", size);
  return url.toString();
}
