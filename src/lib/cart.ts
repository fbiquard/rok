import { config } from "./config";
import { proteins, type ProteinKey } from "./menu";

export type Quantities = Record<ProteinKey, number>;

export type CartItem = {
  key: ProteinKey;
  label: string;
  qty: number;
};

export type Cart = {
  items: CartItem[];
  totalPortions: number;
  subtotal: number;
  shipping: number;
  total: number;
};

export const zeroQuantities: Quantities = {
  carne: 0,
  pollo: 0,
  cerdo: 0,
  veggie: 0,
};

export function parseQuantitiesFromParams(
  get: (key: string) => string | null | undefined,
): Quantities {
  const out = { ...zeroQuantities };
  (Object.keys(out) as ProteinKey[]).forEach((k) => {
    const raw = get(k);
    const n = typeof raw === "string" ? parseInt(raw, 10) : 0;
    if (Number.isFinite(n) && n > 0) out[k] = n;
  });
  return out;
}

export function buildCartQueryString(qty: Quantities): string {
  const params = new URLSearchParams();
  (Object.keys(qty) as ProteinKey[]).forEach((k) => {
    if (qty[k] > 0) params.set(k, String(qty[k]));
  });
  return params.toString();
}

export function buildCart(qty: Quantities): Cart {
  const items: CartItem[] = proteins
    .map((p) => ({ key: p.key, label: p.label, qty: qty[p.key] }))
    .filter((i) => i.qty > 0);

  const totalPortions = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = totalPortions * config.pricing.pricePerPerson;
  const shipping = totalPortions > 0 ? config.pricing.shippingFee : 0;
  const total = subtotal + shipping;

  return { items, totalPortions, subtotal, shipping, total };
}
