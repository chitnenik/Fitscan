export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type RetailerId = "amazon" | "zara" | "asos" | "nike";
export type ClothingType = "tops" | "pants" | "jackets" | "dresses";
export type Gender = "men" | "women" | "unisex";

export type MeasurementKey = "chest" | "waist" | "hips" | "inseam" | "shoulder";
export type Measurements = Record<MeasurementKey, number>;

export interface UserScan {
  id: string;
  name: string;
  gender: "men" | "women";
  heightCm: number;
  build: string;
  source: "LiDAR" | "Camera" | "Simulated";
  scannedAt: string;
  confidence: number;
  measurements: Measurements;
}

export type Range = [number, number];
export type SizeRow = Record<MeasurementKey, Range>;
export type SizeChart = Record<Size, SizeRow>;

export interface Brand {
  name: string;
  fitNote: string;
  charts: { mens: SizeChart; womens: SizeChart };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  retailer: RetailerId;
  type: ClothingType;
  gender: Gender;
  color: string;
  price: number;
  currency: string;
  rating: number;
  reviews: number;
  tags: string[];
  stock: Record<Size, number>;
  url: string;
}

/** Body zones the fit engine and heat map reason about. */
export type Zone = "shoulders" | "chest" | "waist" | "hips" | "inseam";
export type FitStatus = "tight" | "perfect" | "loose";

export interface ZoneResult {
  zone: Zone;
  status: FitStatus;
  /** cm outside the size's range (0 when perfect). */
  delta: number;
  user: number;
  range: Range;
}

export interface SizeEvaluation {
  size: Size;
  zones: ZoneResult[];
  fits: boolean;
  /** Lower is better. */
  score: number;
  /** The zone with the largest problem, if any. */
  worst?: ZoneResult;
}
