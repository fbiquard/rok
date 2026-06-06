import Link from "next/link";
import { Check, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatARS } from "@/lib/config";
import { getOrderById } from "@/lib/orders";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GraciasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id : null;
  const order = id ? await getOrderById(id) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
        <Check className="size-8" />
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        ¡Gracias{order ? `, ${order.customerName.split(" ")[0]}` : ""}!
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Recibimos tu pedido. Te avisamos por WhatsApp cuando salgamos a
        entregártelo.
      </p>

      {order ? (
        <div className="mt-10 w-full rounded-2xl border border-border bg-card p-5 text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Pedido #{order.id}
          </p>

          <ul className="mt-4 space-y-1.5 text-sm">
            {order.items.map((item) => (
              <li key={item.proteinKey} className="flex justify-between">
                <span>
                  {item.label}{" "}
                  <span className="text-muted-foreground">× {item.qty}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="my-4 h-px bg-border" />

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p>
                  {format(order.deliveryAt, "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Franja {order.deliverySlot} h
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p>
                  {order.address}
                  {order.apartment ? `, ${order.apartment}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.neighborhood}
                </p>
              </div>
            </div>
          </div>

          <div className="my-4 h-px bg-border" />

          <div className="flex justify-between text-base font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatARS(order.total)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-8 text-xs text-muted-foreground">
          No encontramos los datos del pedido. Si pagaste, no te preocupes — el
          pedido está guardado.
        </p>
      )}

      <Link
        href="/"
        className="mt-10 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
