"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { config, formatARS } from "@/lib/config";
import type { Cart } from "@/lib/cart";
import {
  TIME_SLOTS,
  dateToISO,
  getMinDeliveryDateObj,
  isoToDate,
  isValidDeliveryDate,
} from "@/lib/delivery";

type Props = {
  cart: Cart;
  backHref: string;
};

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  apartment: "",
  neighborhood: "",
  postalCode: "",
  notes: "",
  deliveryDate: "",
  deliverySlot: "" as "" | (typeof TIME_SLOTS)[number]["value"],
};

export function CheckoutForm({ cart, backHref }: Props) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const minDateObj = getMinDeliveryDateObj();
  const selectedDate = isoToDate(form.deliveryDate);

  const update = <K extends keyof typeof initialForm>(
    key: K,
    value: (typeof initialForm)[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValidDeliveryDate(form.deliveryDate)) {
      toast.error(
        `La fecha debe ser al menos ${config.delivery.minHoursAhead} hs después de ahora.`,
      );
      return;
    }
    if (!form.deliverySlot) {
      toast.error("Elegí una franja horaria.");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: conectar /api/create-preference en la próxima tarea.
      console.log("Pedido listo para MP:", { form, cart });
      await new Promise((r) => setTimeout(r, 600));
      toast.success(
        "Pedido armado. Próximo paso: conectar Mercado Pago para cobrar.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 pb-40">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al combo
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Finalizá tu pedido
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Te tomará menos de un minuto. Después pagás con Mercado Pago.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <Section title="Tus datos">
          <Field label="Nombre y apellido" htmlFor="fullName">
            <Input
              id="fullName"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Field>
            <Field label="WhatsApp" htmlFor="phone" hint="Te avisamos cuando salga el delivery">
              <Input
                id="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+54 9 11 ..."
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Dirección de entrega">
          <Field label="Calle y altura" htmlFor="street">
            <Input
              id="street"
              required
              autoComplete="street-address"
              placeholder="Ej. Av. Cabildo 1234"
              value={form.street}
              onChange={(e) => update("street", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Piso / depto" htmlFor="apartment" hint="Opcional">
              <Input
                id="apartment"
                value={form.apartment}
                onChange={(e) => update("apartment", e.target.value)}
              />
            </Field>
            <Field label="Barrio" htmlFor="neighborhood">
              <Input
                id="neighborhood"
                required
                placeholder="Ej. Belgrano"
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
              />
            </Field>
          </div>
          <Field
            label="Notas para el repartidor"
            htmlFor="notes"
            hint="Opcional · timbre, referencia, etc."
          >
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Field>
        </Section>

        <Section
          title="Cuándo lo querés"
          hint={`Mínimo ${config.delivery.minHoursAhead} hs de anticipación`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha" htmlFor="deliveryDate">
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="deliveryDate"
                    type="button"
                    variant="outline"
                    className="h-9 w-full justify-start font-normal"
                  >
                    <CalendarIcon className="size-4" />
                    {selectedDate ? (
                      format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                    ) : (
                      <span className="text-muted-foreground">
                        Elegí una fecha
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  sideOffset={6}
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    defaultMonth={selectedDate ?? minDateObj}
                    onSelect={(d) => {
                      if (d) {
                        update("deliveryDate", dateToISO(d));
                        setDateOpen(false);
                      }
                    }}
                    disabled={(d) => d < minDateObj}
                    locale={es}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Field label="Franja horaria" htmlFor="deliverySlot">
              <select
                id="deliverySlot"
                required
                value={form.deliverySlot}
                onChange={(e) =>
                  update("deliverySlot", e.target.value as typeof form.deliverySlot)
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="" disabled>
                  Elegí una franja
                </option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <OrderSummary cart={cart} />

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-14 w-full rounded-full text-base font-medium"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Pagar {formatARS(cart.total)} con Mercado Pago
              <ArrowRight className="ml-1 size-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Vas a ser redirigido a Mercado Pago para finalizar el pago. Cobra al
          momento.
        </p>
      </form>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-primary/80">
          {title}
        </h2>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm">
        {label}
        {hint && (
          <span className="ml-2 text-xs text-muted-foreground">{hint}</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function OrderSummary({ cart }: { cart: Cart }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-primary/80">
        Tu pedido
      </h2>
      <ul className="mt-4 space-y-2">
        {cart.items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between text-sm"
          >
            <span>
              {item.label}{" "}
              <span className="text-muted-foreground">× {item.qty}</span>
            </span>
            <span className="tabular-nums">
              {formatARS(item.qty * config.pricing.pricePerPerson)}
            </span>
          </li>
        ))}
      </ul>
      <div className="my-4 h-px bg-border" />
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatARS(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Envío</span>
          <span className="tabular-nums">{formatARS(cart.shipping)}</span>
        </div>
        <div className="mt-2 flex justify-between text-base font-medium">
          <span>Total</span>
          <span className="tabular-nums">{formatARS(cart.total)}</span>
        </div>
      </div>
    </div>
  );
}
