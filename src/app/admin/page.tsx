import Link from "next/link";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, Clock, MapPin } from "lucide-react";
import { formatARS } from "@/lib/config";
import {
  listOrders,
  statusMeta,
  type Order,
  type OrderStatus,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const orders = await listOrders();

  const upcoming = orders.filter((o) => o.status !== "delivered");
  const delivered = orders.filter((o) => o.status === "delivered");

  const todayOrders = upcoming.filter((o) => isToday(o.deliveryAt));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 pb-20">
      <DemoBanner />

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {todayOrders.length === 0
            ? "No hay pedidos para hoy."
            : `${todayOrders.length} ${
                todayOrders.length === 1 ? "pedido hoy" : "pedidos hoy"
              } · ${formatARS(todayRevenue)} para cobrar`}
        </p>
      </header>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-primary/80">
            Pendientes
          </h2>
          <span className="text-xs text-muted-foreground">
            {upcoming.length}{" "}
            {upcoming.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            upcoming.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Entregados
          </h2>
          <span className="text-xs text-muted-foreground">
            {delivered.length}{" "}
            {delivered.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>
        <div className="mt-3 space-y-3 opacity-60">
          {delivered.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Todavía no hay entregas.
            </p>
          ) : (
            delivered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
      Modo testing: la base de datos está conectada pero todavía no cobra plata
      real. Los pedidos reales van a aparecer acá apenas pruebes el flujo de
      checkout.
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      No hay pedidos pendientes. Buen momento para un mate.
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const meta = statusMeta[order.status];
  const personas = order.items.reduce((s, i) => s + i.qty, 0);
  const itemsSummary = order.items
    .map((i) => `${i.qty} ${i.label.toLowerCase()}`)
    .join(", ");

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="group block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${meta.tone}`}
            >
              {meta.label}
            </span>
            <span className="text-muted-foreground">#{order.id}</span>
          </div>
          <h3 className="mt-2 text-base font-medium">{order.customerName}</h3>
        </div>
        <DeliveryTime date={order.deliveryAt} slot={order.deliverySlot} />
      </div>

      <p className="mt-2 text-sm text-foreground/90">
        {personas} {personas === 1 ? "persona" : "personas"} ·{" "}
        <span className="text-muted-foreground">{itemsSummary}</span>
      </p>

      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3" />
        <span className="truncate">
          {order.address}
          {order.apartment ? `, ${order.apartment}` : ""} ·{" "}
          {order.neighborhood}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium tabular-nums">
          {formatARS(order.total)}
        </span>
        <span className="inline-flex items-center text-xs text-muted-foreground group-hover:text-foreground">
          Ver detalle <ChevronRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function DeliveryTime({ date, slot }: { date: Date; slot: string }) {
  return (
    <div className="text-right">
      <div className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
        <Clock className="size-3" />
        {relativeDay(date)}
      </div>
      <p className="mt-0.5 text-sm font-medium tabular-nums">
        {format(date, "HH:mm", { locale: es })}
      </p>
      <p className="text-[10px] text-muted-foreground">{slot} h</p>
    </div>
  );
}

function relativeDay(date: Date): string {
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  if (isYesterday(date)) return "Ayer";
  return format(date, "EEE d MMM", { locale: es });
}

// Forzar a typescript a chequear el statusMeta map completo (no usado runtime).
const _statusCheck: Record<OrderStatus, true> = {
  paid: true,
  preparing: true,
  out_for_delivery: true,
  delivered: true,
};
void _statusCheck;
