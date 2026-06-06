import { config } from "./config";
import { proteins, type ProteinKey } from "./menu";

export type OrderStatus =
  | "paid"
  | "preparing"
  | "out_for_delivery"
  | "delivered";

export type OrderItem = {
  proteinKey: ProteinKey;
  label: string;
  qty: number;
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  apartment?: string;
  neighborhood: string;
  notes?: string;
  deliveryAt: Date;
  deliverySlot: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
};

export const statusMeta: Record<
  OrderStatus,
  { label: string; tone: string; nextLabel?: string; nextStatus?: OrderStatus }
> = {
  paid: {
    label: "Pagado",
    tone: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    nextLabel: "Empezar a preparar",
    nextStatus: "preparing",
  },
  preparing: {
    label: "Preparando",
    tone: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    nextLabel: "Salgo a entregar",
    nextStatus: "out_for_delivery",
  },
  out_for_delivery: {
    label: "En camino",
    tone: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    nextLabel: "Marcar entregado",
    nextStatus: "delivered",
  },
  delivered: {
    label: "Entregado",
    tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
};

function makeItems(map: Partial<Record<ProteinKey, number>>): OrderItem[] {
  return proteins
    .map((p) => ({
      proteinKey: p.key,
      label: p.label,
      qty: map[p.key] ?? 0,
    }))
    .filter((i) => i.qty > 0);
}

function totals(items: OrderItem[]) {
  const personas = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = personas * config.pricing.pricePerPerson;
  const shipping = config.pricing.shippingFee;
  return { subtotal, shipping, total: subtotal + shipping };
}

/**
 * Pedidos de ejemplo (mock) para previsualizar el panel admin sin Supabase.
 * Las fechas se calculan relativas a `now` para que siempre se vean "actuales".
 */
export function getMockOrders(now: Date = new Date()): Order[] {
  const at = (daysOffset: number, hour: number, minute = 0): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const orders: Order[] = [
    {
      id: "RK-2614",
      customerName: "Camila Riera",
      phone: "+5491165443322",
      email: "cami.riera@gmail.com",
      address: "José Hernández 2244",
      apartment: "5°B",
      neighborhood: "Belgrano",
      notes: "Tocar timbre depto 5B, hay perro pero no muerde.",
      deliveryAt: at(0, 21, 0),
      deliverySlot: "20-22",
      items: makeItems({ carne: 2, pollo: 1 }),
      ...totals(makeItems({ carne: 2, pollo: 1 })),
      status: "out_for_delivery",
      createdAt: at(-1, 18, 24),
    },
    {
      id: "RK-2615",
      customerName: "Mateo Salinas",
      phone: "+5491134567788",
      email: "mateo.salinas@hotmail.com",
      address: "Av. Juan B. Justo 4180",
      neighborhood: "Villa Crespo",
      deliveryAt: at(1, 14, 0),
      deliverySlot: "14-16",
      items: makeItems({ cerdo: 3, veggie: 1 }),
      ...totals(makeItems({ cerdo: 3, veggie: 1 })),
      status: "preparing",
      createdAt: at(-1, 11, 5),
    },
    {
      id: "RK-2616",
      customerName: "Sofía Aguirre",
      phone: "+5491178998877",
      email: "soa.aguirre@gmail.com",
      address: "Honduras 5630",
      apartment: "PB",
      neighborhood: "Palermo",
      notes: "Sin mayonesa en uno de los de cerdo, soy alérgica.",
      deliveryAt: at(1, 21, 0),
      deliverySlot: "20-22",
      items: makeItems({ carne: 1, cerdo: 2, veggie: 1 }),
      ...totals(makeItems({ carne: 1, cerdo: 2, veggie: 1 })),
      status: "paid",
      createdAt: at(0, 17, 50),
    },
    {
      id: "RK-2617",
      customerName: "Iván Pereyra",
      phone: "+5491144556677",
      email: "ivan.pereyra@gmail.com",
      address: "Av. Cabildo 2840",
      apartment: "12°A",
      neighborhood: "Núñez",
      deliveryAt: at(2, 13, 0),
      deliverySlot: "12-14",
      items: makeItems({ pollo: 4 }),
      ...totals(makeItems({ pollo: 4 })),
      status: "paid",
      createdAt: at(0, 18, 10),
    },
    {
      id: "RK-2613",
      customerName: "Lucía Méndez",
      phone: "+5491166112233",
      email: "lu.mendez@gmail.com",
      address: "Olleros 2266",
      neighborhood: "Las Cañitas",
      deliveryAt: at(-1, 20, 0),
      deliverySlot: "20-22",
      items: makeItems({ carne: 2, pollo: 2 }),
      ...totals(makeItems({ carne: 2, pollo: 2 })),
      status: "delivered",
      createdAt: at(-2, 15, 0),
    },
  ];

  return orders.sort((a, b) => a.deliveryAt.getTime() - b.deliveryAt.getTime());
}

export function getMockOrderById(id: string): Order | undefined {
  return getMockOrders().find((o) => o.id === id);
}

/**
 * Mensaje pre-armado para WhatsApp al cliente cuando sale el delivery.
 */
export function buildOutForDeliveryMessage(order: Order): string {
  const firstName = order.customerName.split(" ")[0];
  const lines = [
    `Hola ${firstName}! Soy de RÖK Ahumados.`,
    `Salimos para entregar tu combo a ${order.address}, ${order.neighborhood}.`,
    `Llegamos en unos 30 minutos. Cualquier cosa avisame por acá.`,
  ];
  return lines.join("\n\n");
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
