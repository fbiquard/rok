import { config } from "./config";

export const TIME_SLOTS = [
  { value: "12-14", label: "12:00 – 14:00 h" },
  { value: "14-16", label: "14:00 – 16:00 h" },
  { value: "16-18", label: "16:00 – 18:00 h" },
  { value: "18-20", label: "18:00 – 20:00 h" },
  { value: "20-22", label: "20:00 – 22:00 h" },
] as const;

export type TimeSlotValue = (typeof TIME_SLOTS)[number]["value"];

/**
 * Fecha mínima (Date object, medianoche local) para entrega.
 */
export function getMinDeliveryDateObj(now: Date = new Date()): Date {
  const min = new Date(now);
  min.setHours(min.getHours() + config.delivery.minHoursAhead);
  min.setHours(0, 0, 0, 0);
  return min;
}

/**
 * Fecha mínima en formato yyyy-mm-dd (para inputs date nativos y comparaciones).
 */
export function getMinDeliveryDate(now: Date = new Date()): string {
  return dateToISO(getMinDeliveryDateObj(now));
}

export function isValidDeliveryDate(
  dateStr: string,
  now: Date = new Date(),
): boolean {
  if (!dateStr) return false;
  return dateStr >= getMinDeliveryDate(now);
}

/** Date → "yyyy-mm-dd" usando hora local (sin drift por UTC). */
export function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "yyyy-mm-dd" → Date local, o undefined si la cadena es inválida. */
export function isoToDate(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}
