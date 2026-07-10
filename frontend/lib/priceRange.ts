export const PRICE_MIN = 500;
export const PRICE_MAX = 15000;
export const PRICE_STEP = 100;

export function clampPrice(value: number) {
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, value));
}

export function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}
