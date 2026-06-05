"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Minus, Plus } from "lucide-react";
import logo from "../../public/logo.png";
import { Button } from "@/components/ui/button";
import { config, formatARS } from "@/lib/config";
import { comboIncludes, proteins, type ProteinKey } from "@/lib/menu";
import {
  buildCartQueryString,
  parseQuantitiesFromParams,
  type Quantities,
} from "@/lib/cart";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Configurator />
    </Suspense>
  );
}

function Configurator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [qty, setQty] = useState<Quantities>(() =>
    parseQuantitiesFromParams((k) => searchParams.get(k)),
  );

  const totalPortions = useMemo(
    () => Object.values(qty).reduce((sum, n) => sum + n, 0),
    [qty],
  );

  const subtotal = totalPortions * config.pricing.pricePerPerson;
  const shipping = totalPortions > 0 ? config.pricing.shippingFee : 0;
  const total = subtotal + shipping;

  const updateQty = (key: ProteinKey, delta: number) =>
    setQty((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));

  const goToCheckout = () => {
    router.push(`/checkout?${buildCartQueryString(qty)}`);
  };

  return (
    <div className="flex flex-1 flex-col pb-36">
      <header className="px-5 pt-6 pb-2 text-center">
        <Image
          src={logo}
          alt={`${config.business.name} ${config.business.tagline}`}
          priority
          className="mx-auto h-24 w-auto mix-blend-screen sm:h-28"
        />
      </header>

      <main className="mx-auto w-full max-w-2xl px-4">
        <ComboIncludes />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {proteins.map((p) => (
            <ProteinCard
              key={p.key}
              label={p.label}
              description={p.description}
              imageUrl={p.imageUrl}
              qty={qty[p.key]}
              onChange={(delta) => updateQty(p.key, delta)}
            />
          ))}
        </div>
      </main>

      <SummaryBar
        totalPortions={totalPortions}
        subtotal={subtotal}
        shipping={shipping}
        total={total}
        onContinue={goToCheckout}
      />
    </div>
  );
}

function ComboIncludes() {
  return (
    <div className="mt-4 rounded-2xl border border-border bg-card/60 px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-primary/80">
        Cada combo por persona incluye
      </p>
      <ul className="mt-3 space-y-1.5">
        {comboIncludes.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-foreground/90"
          >
            <span
              aria-hidden
              className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProteinCard({
  label,
  description,
  imageUrl,
  qty,
  onChange,
}: {
  label: string;
  description: string;
  imageUrl?: string;
  qty: number;
  onChange: (delta: number) => void;
}) {
  const active = qty > 0;

  return (
    <div
      className={`flex items-stretch gap-3 overflow-hidden rounded-2xl border bg-card p-3 transition ${
        active
          ? "border-primary/60 shadow-[0_0_0_1px] shadow-primary/30"
          : "border-border"
      }`}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={label}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[oklch(0.34_0.09_140)] to-[oklch(0.18_0.04_140)]">
            <span className="text-xs font-medium uppercase tracking-wider text-white/70">
              {label}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-base font-medium leading-tight">{label}</h3>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-medium tabular-nums">
            {formatARS(config.pricing.pricePerPerson)}
          </span>
          <Stepper qty={qty} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

function Stepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (delta: number) => void;
}) {
  if (qty === 0) {
    return (
      <Button
        type="button"
        size="sm"
        className="h-9 rounded-full px-4"
        onClick={() => onChange(1)}
      >
        <Plus className="size-4" />
        Agregar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-primary/60 bg-primary/10 p-1">
      <button
        type="button"
        aria-label="Quitar uno"
        className="flex size-7 items-center justify-center rounded-full text-primary hover:bg-primary/15"
        onClick={() => onChange(-1)}
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-medium tabular-nums">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Agregar uno"
        className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => onChange(1)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function SummaryBar({
  totalPortions,
  subtotal,
  shipping,
  total,
  onContinue,
}: {
  totalPortions: number;
  subtotal: number;
  shipping: number;
  total: number;
  onContinue: () => void;
}) {
  const empty = totalPortions === 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {empty ? (
            <p className="text-muted-foreground">
              Tocá <span className="text-foreground">Agregar</span> para armar tu combo
            </p>
          ) : (
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-muted-foreground">
                {totalPortions}{" "}
                {totalPortions === 1 ? "persona" : "personas"} ·{" "}
                {formatARS(subtotal)} + envío {formatARS(shipping)}
              </span>
              <span className="text-base font-medium">
                Total {formatARS(total)}
              </span>
            </div>
          )}
        </div>

        <Button
          size="lg"
          className="h-12 rounded-full px-6 text-base font-medium disabled:opacity-40"
          disabled={empty}
          onClick={onContinue}
        >
          Continuar
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
