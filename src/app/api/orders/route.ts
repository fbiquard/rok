import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { isoToDate } from "@/lib/delivery";
import { proteins, type ProteinKey } from "@/lib/menu";
import { createOrder, type OrderItem } from "@/lib/orders";

export const runtime = "nodejs";

type Body = {
  customerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  apartment?: string;
  neighborhood?: string;
  notes?: string;
  deliveryDate?: string; // YYYY-MM-DD
  deliverySlot?: string; // "12-14" etc.
  cart?: Partial<Record<ProteinKey, number>>;
};

function required(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Validaciones básicas
  if (
    !required(body.customerName) ||
    !required(body.phone) ||
    !required(body.email) ||
    !required(body.address) ||
    !required(body.neighborhood) ||
    !required(body.deliveryDate) ||
    !required(body.deliverySlot) ||
    !body.cart
  ) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 },
    );
  }

  // Construir items desde el cart (canonical: server-side)
  const items: OrderItem[] = proteins
    .map((p) => ({
      proteinKey: p.key,
      label: p.label,
      qty: Math.max(0, Math.floor(body.cart?.[p.key] ?? 0)),
    }))
    .filter((i) => i.qty > 0);

  if (items.length === 0) {
    return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
  }

  const personas = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = personas * config.pricing.pricePerPerson;
  const shipping = config.pricing.shippingFee;
  const total = subtotal + shipping;

  // Combinar fecha + hora de inicio del slot
  const baseDate = isoToDate(body.deliveryDate);
  if (!baseDate) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }
  const [startHourStr] = body.deliverySlot.split("-");
  const startHour = parseInt(startHourStr, 10);
  if (!Number.isFinite(startHour)) {
    return NextResponse.json({ error: "Franja inválida" }, { status: 400 });
  }
  const deliveryAt = new Date(baseDate);
  deliveryAt.setHours(startHour, 0, 0, 0);

  try {
    const order = await createOrder({
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      email: body.email.trim(),
      address: body.address.trim(),
      apartment: body.apartment?.trim() || undefined,
      neighborhood: body.neighborhood.trim(),
      notes: body.notes?.trim() || undefined,
      deliveryAt,
      deliverySlot: body.deliverySlot,
      items,
      subtotal,
      shipping,
      total,
      status: "paid", // TODO: cambiar a 'pending' cuando conectemos MP
    });

    return NextResponse.json({
      id: order.id,
      total: order.total,
    });
  } catch (err) {
    console.error("Error creando orden:", err);
    return NextResponse.json(
      { error: "Error guardando el pedido" },
      { status: 500 },
    );
  }
}
