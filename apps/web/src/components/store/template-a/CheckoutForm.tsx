"use client";

import { useState, type FormEvent } from "react";
import type { CartItem } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { checkoutCart } from "@/lib/preview-checkout";
import { formatCedis } from "@/lib/price";

const ACCENT = "#FF7A1A";
const fieldClass =
  "mt-1.5 h-11 w-full rounded-xl border border-black/10 bg-[#F7F7F7] px-4 text-sm text-black outline-none placeholder:text-black/35 focus:border-black/30";

export function CheckoutForm({
  storeSlug,
  items,
  onSuccess,
}: {
  storeSlug: string;
  items: CartItem[];
  onSuccess: (receipt: CheckoutSuccess) => void;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await checkoutCart({
      storeSlug,
      buyerName,
      buyerEmail,
      buyerPhone,
      deliveryAddress,
      items,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    onSuccess(result.receipt);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10">
      <h2 className="text-[18px] font-extrabold tracking-tight">Checkout</h2>
      <p className="mt-1 text-sm text-black/50">
        Pay the seller by Mobile Money after you place the order. No card is charged here.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">
          Full name
          <input
            type="text"
            name="buyerName"
            autoComplete="name"
            required
            value={buyerName}
            onChange={(event) => setBuyerName(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input
            type="email"
            name="buyerEmail"
            autoComplete="email"
            required
            value={buyerEmail}
            onChange={(event) => setBuyerEmail(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          Phone
          <input
            type="tel"
            name="buyerPhone"
            autoComplete="tel"
            required
            value={buyerPhone}
            onChange={(event) => setBuyerPhone(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-semibold">
          Delivery address
          <textarea
            name="deliveryAddress"
            autoComplete="street-address"
            required
            rows={3}
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            className="mt-1.5 w-full resize-y rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-3 text-sm text-black outline-none placeholder:text-black/35 focus:border-black/30"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-black text-[15px] font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Placing order…" : "Pay now"}
      </button>
      <p className="mt-4 text-center text-xs text-black/40">
        Payment is collected upfront. Your order ships once the seller marks it paid.
      </p>
    </form>
  );
}

export function PaymentInstructions({
  receipt,
  shopHref,
}: {
  receipt: CheckoutSuccess;
  shopHref: string;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-black/10 bg-[#FAFAFA] p-6">
      <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: ACCENT }}>
        Awaiting payment
      </p>
      <h2 className="mt-2 text-[22px] font-extrabold tracking-tight">Pay with Mobile Money</h2>
      <p className="mt-2 text-sm leading-relaxed text-black/55">{receipt.momo.instructions}</p>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-black/45">Amount</dt>
          <dd className="font-bold">{formatCedis(receipt.subtotalCedis)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-black/45">MoMo name</dt>
          <dd className="font-semibold">{receipt.momo.accountName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-black/45">MoMo number</dt>
          <dd className="font-mono text-[13px] font-semibold">{receipt.momo.number}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-black/45">Reference</dt>
          <dd className="font-mono text-[13px] font-extrabold">{receipt.paymentReference}</dd>
        </div>
      </dl>

      <a
        href={shopHref}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white"
      >
        Continue shopping
      </a>
    </div>
  );
}
