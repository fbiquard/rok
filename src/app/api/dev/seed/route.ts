import { NextResponse } from "next/server";
import { seedMockOrdersIfEmpty } from "@/lib/orders";

export const runtime = "nodejs";

/**
 * Endpoint temporal de desarrollo: pobla la DB con 5 pedidos mock si está vacía.
 * Idempotente: si ya hay pedidos, no hace nada.
 *
 * Uso:  curl -X POST https://rok-zeta.vercel.app/api/dev/seed
 */
export async function POST() {
  try {
    const result = await seedMockOrdersIfEmpty();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error seedeando:", err);
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    hint: "Hacé POST a este endpoint para poblar la DB con pedidos de ejemplo (solo si está vacía).",
  });
}
