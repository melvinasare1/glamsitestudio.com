"use client";

import { useState, type FormEvent } from "react";
import type { CartItem } from "@/lib/cart-context";
import type { CheckoutSuccess } from "@/lib/checkout";
import { checkoutCart } from "@/lib/preview-checkout";
import { formatCedis } from "@/lib/price";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-full border border-[#d9cfc3] bg-white px-4 text-sm text-[#4f4a3d] outline-none placeholder:text-[#4f4a3d]/40 focus:border-[#8a8165]";

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
      <h2
        className="text-xl font-medium tracking-tight text-[#4f4a3d]"
        style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
      >
        Checkout
      </h2>
      <p className="mt-1 text-sm text-[#4f4a3d]/55">
        Pay the seller by Mobile Money after you place the order. No card is charged here.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-[#4f4a3d]">
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
        <label className="block text-sm font-medium text-[#4f4a3d]">
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
        <label className="block text-sm font-medium text-[#4f4a3d]">
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
        <label className="block text-sm font-medium text-[#4f4a3d]">
          Delivery address
          <textarea
            name="deliveryAddress"
            autoComplete="street-address"
            required
            rows={3}
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            className="mt-1.5 w-full resize-y rounded-2xl border border-[#d9cfc3] bg-white px-4 py-3 text-sm text-[#4f4a3d] outline-none placeholder:text-[#4f4a3d]/40 focus:border-[#8a8165]"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 flex h-11 w-full items-center justify-center rounded-full bg-[#8a8165] text-sm font-medium text-[#f7f1df] transition-colors hover:bg-[#91886d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Placing order…" : "Pay now"}
      </button>
      <p className="mt-4 text-center text-xs text-[#4f4a3d]/50">
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
    <div className="mt-8 rounded-2xl border border-[#d9cfc3] bg-[#f7f1df] p-6">
      <p className="text-xs font-semibold tracking-wide text-[#8a8165] uppercase">
        Awaiting payment
      </p>
      <h2
        className="mt-2 text-xl font-medium text-[#4f4a3d]"
        style={{ fontFamily: "var(--font-hair-display), ui-serif, Georgia" }}
      >
        Pay with Mobile Money
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#4f4a3d]/65">{receipt.momo.instructions}</p>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[#4f4a3d]/55">Amount</dt>
          <dd className="font-semibold text-[#4f4a3d]">{formatCedis(receipt.subtotalCedis)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[#4f4a3d]/55">MoMo name</dt>
          <dd className="font-semibold text-[#4f4a3d]">{receipt.momo.accountName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[#4f4a3d]/55">MoMo number</dt>
          <dd className="font-mono text-[13px] font-semibold text-[#4f4a3d]">{receipt.momo.number}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[#4f4a3d]/55">Reference</dt>
          <dd className="font-mono text-[13px] font-semibold text-[#4f4a3d]">
            {receipt.paymentReference}
          </dd>
        </div>
      </dl>

      <a
        href={shopHref}
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#8a8165] px-6 text-sm font-medium text-[#f7f1df] hover:bg-[#91886d]"
      >
        Continue shopping
      </a>
    </div>
  );
}
