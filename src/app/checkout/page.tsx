import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import {
  buildCart,
  buildCartQueryString,
  parseQuantitiesFromParams,
} from "@/lib/cart";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const quantities = parseQuantitiesFromParams((k) => {
    const raw = params[k];
    return typeof raw === "string" ? raw : null;
  });
  const cart = buildCart(quantities);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tu combo está vacío
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Volvé al inicio y elegí al menos una porción.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-sm hover:underline"
        >
          <ArrowLeft className="size-4" />
          Volver al combo
        </Link>
      </div>
    );
  }

  const backHref = `/?${buildCartQueryString(quantities)}`;

  return <CheckoutForm cart={cart} backHref={backHref} />;
}
