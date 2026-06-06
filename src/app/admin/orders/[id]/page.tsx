import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { config, formatARS } from "@/lib/config";
import {
  buildOutForDeliveryMessage,
  buildWhatsappUrl,
  getMockOrderById,
  statusMeta,
  type Order,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getMockOrderById(id);

  if (!order) return notFound();

  const meta = statusMeta[order.status];
  const wppPhone = order.phone.replace(/\D/g, "");
  const wppLink = buildWhatsappUrl(
    order.phone,
    buildOutForDeliveryMessage(order),
  );
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${order.address}, ${order.neighborhood}, Buenos Aires`,
  )}`;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 pb-32">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Pedidos
      </Link>

      <header className="mt-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${meta.tone}`}
            >
              {meta.label}
            </span>
            <span className="text-muted-foreground">#{order.id}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {order.customerName}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Entrega
          </p>
          <p className="mt-0.5 text-base font-medium">
            {format(order.deliveryAt, "EEEE d", { locale: es })}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {format(order.deliveryAt, "HH:mm", { locale: es })} h · {order.deliverySlot} h
          </p>
        </div>
      </header>

      <Section title="Contacto">
        <div className="flex flex-col gap-2">
          <a
            href={`tel:${order.phone}`}
            className="inline-flex items-center gap-2 text-sm hover:underline"
          >
            <Phone className="size-4" /> {order.phone}
          </a>
          <a
            href={`https://wa.me/${wppPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:underline"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          <p className="text-sm text-muted-foreground">{order.email}</p>
        </div>
      </Section>

      <Section title="Dirección">
        <p className="text-sm">
          {order.address}
          {order.apartment ? `, ${order.apartment}` : ""}
        </p>
        <p className="text-sm text-muted-foreground">{order.neighborhood}</p>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 hover:underline"
        >
          Abrir en Google Maps <ExternalLink className="size-3" />
        </a>
        {order.notes && (
          <div className="mt-3 rounded-lg bg-muted/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Notas del cliente
            </p>
            <p className="mt-1 text-sm">{order.notes}</p>
          </div>
        )}
      </Section>

      <Section title="Pedido">
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li
              key={item.proteinKey}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {item.label}{" "}
                <span className="text-muted-foreground">× {item.qty}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatARS(item.qty * config.pricing.pricePerPerson)}
              </span>
            </li>
          ))}
        </ul>
        <div className="my-3 h-px bg-border" />
        <div className="space-y-1 text-sm">
          <Row label="Subtotal" value={formatARS(order.subtotal)} muted />
          <Row label="Envío" value={formatARS(order.shipping)} muted />
          <Row label="Total cobrado" value={formatARS(order.total)} bold />
        </div>
      </Section>

      <ActionBar order={order} wppLink={wppLink} />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-primary/80">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        muted ? "text-muted-foreground" : ""
      } ${bold ? "text-base font-medium text-foreground" : ""}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ActionBar({ order, wppLink }: { order: Order; wppLink: string }) {
  const meta = statusMeta[order.status];
  const showWhatsApp = order.status !== "delivered";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-xl items-stretch gap-2 px-4 py-3">
        {showWhatsApp && (
          <a
            href={wppLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Avisar al cliente por WhatsApp"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full border-emerald-500/40 px-4 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200",
            )}
          >
            <MessageCircle className="size-4" />
            Avisar
          </a>
        )}
        {meta.nextStatus ? (
          <Button
            size="lg"
            className="h-12 flex-1 rounded-full px-5 text-base font-medium"
          >
            {meta.nextLabel}
          </Button>
        ) : (
          <span className="flex-1 self-center text-center text-sm text-muted-foreground">
            Pedido cerrado
          </span>
        )}
      </div>
    </div>
  );
}
