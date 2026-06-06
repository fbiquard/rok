import { config } from "./config";
import { sql } from "./db";
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
  mpPaymentId?: string;
  createdAt: Date;
};

export type NewOrderInput = Omit<Order, "id" | "createdAt" | "status" | "mpPaymentId"> & {
  status?: OrderStatus;
  mpPaymentId?: string;
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

// ─── Helpers ────────────────────────────────────────────────────────────────

export function generateOrderId(): string {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
  return `RK-${hex}`;
}

type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  apartment: string | null;
  neighborhood: string;
  notes: string | null;
  delivery_at: string;
  delivery_slot: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  mp_payment_id: string | null;
  created_at: string;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    apartment: row.apartment ?? undefined,
    neighborhood: row.neighborhood,
    notes: row.notes ?? undefined,
    deliveryAt: new Date(row.delivery_at),
    deliverySlot: row.delivery_slot,
    items: row.items,
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    status: row.status,
    mpPaymentId: row.mp_payment_id ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

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

// ─── DB queries ─────────────────────────────────────────────────────────────

export async function listOrders(): Promise<Order[]> {
  const rows = (await sql`
    SELECT * FROM orders
    ORDER BY delivery_at ASC
  `) as OrderRow[];
  return rows.map(rowToOrder);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const rows = (await sql`
    SELECT * FROM orders WHERE id = ${id} LIMIT 1
  `) as OrderRow[];
  if (rows.length === 0) return undefined;
  return rowToOrder(rows[0]);
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  const id = generateOrderId();
  const status = input.status ?? "paid";

  const rows = (await sql`
    INSERT INTO orders (
      id, customer_name, phone, email, address, apartment, neighborhood, notes,
      delivery_at, delivery_slot, items, subtotal, shipping, total, status, mp_payment_id
    )
    VALUES (
      ${id}, ${input.customerName}, ${input.phone}, ${input.email}, ${input.address},
      ${input.apartment ?? null}, ${input.neighborhood}, ${input.notes ?? null},
      ${input.deliveryAt.toISOString()}, ${input.deliverySlot},
      ${JSON.stringify(input.items)}::jsonb,
      ${input.subtotal}, ${input.shipping}, ${input.total},
      ${status}, ${input.mpPaymentId ?? null}
    )
    RETURNING *
  `) as OrderRow[];

  return rowToOrder(rows[0]);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | undefined> {
  const rows = (await sql`
    UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *
  `) as OrderRow[];
  if (rows.length === 0) return undefined;
  return rowToOrder(rows[0]);
}

// ─── Seed (mocks para vista previa) ─────────────────────────────────────────

/**
 * Inserta 5 pedidos de ejemplo en la DB SI está vacía. Idempotente.
 */
export async function seedMockOrdersIfEmpty(now: Date = new Date()): Promise<{
  inserted: number;
  alreadyHadOrders: boolean;
}> {
  const existing = (await sql`SELECT COUNT(*)::int as count FROM orders`) as {
    count: number;
  }[];
  if (existing[0].count > 0) {
    return { inserted: 0, alreadyHadOrders: true };
  }

  const at = (daysOffset: number, hour: number, minute = 0): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const mocks: Array<NewOrderInput & { _id: string }> = [
    {
      _id: "RK-002614",
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
    },
    {
      _id: "RK-002615",
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
    },
    {
      _id: "RK-002616",
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
    },
    {
      _id: "RK-002617",
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
    },
    {
      _id: "RK-002613",
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
    },
  ];

  for (const m of mocks) {
    await sql`
      INSERT INTO orders (
        id, customer_name, phone, email, address, apartment, neighborhood, notes,
        delivery_at, delivery_slot, items, subtotal, shipping, total, status
      ) VALUES (
        ${m._id}, ${m.customerName}, ${m.phone}, ${m.email}, ${m.address},
        ${m.apartment ?? null}, ${m.neighborhood}, ${m.notes ?? null},
        ${m.deliveryAt.toISOString()}, ${m.deliverySlot},
        ${JSON.stringify(m.items)}::jsonb,
        ${m.subtotal}, ${m.shipping}, ${m.total},
        ${m.status ?? "paid"}
      )
    `;
  }

  return { inserted: mocks.length, alreadyHadOrders: false };
}

// ─── Mensajes WhatsApp ──────────────────────────────────────────────────────

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
