/**
 * ROK — configuración central.
 * Cambiar los números acá impacta en toda la app.
 */
export const config = {
  business: {
    name: "RÖK",
    tagline: "Ahumados",
    whatsapp: "+5491156433030",
    whatsappDisplay: "+54 9 11 5643 3030",
  },
  pricing: {
    pricePerPerson: 18500,
    shippingFee: 2500,
    currency: "ARS",
  },
  delivery: {
    minHoursAhead: 48,
    windowStartHour: 12,
    windowEndHour: 22,
    coverageArea: "CABA",
  },
} as const;

export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
