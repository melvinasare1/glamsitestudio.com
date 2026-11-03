"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AUTH_INPUT_CLASS, AuthFrame } from "@/components/auth-frame";
import { startSignup } from "./actions";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startSignup(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.checkEmail) {
        setCheckEmail(true);
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  if (checkEmail) {
    return (
      <AuthFrame
        kicker="Glam Site Studios"
        title="Check your email"
        description={`We've sent a sign-in link to ${email}. Open it on this device to get into your dashboard.`}
      >
        <p className="mt-6 text-sm text-ink-700">
          Didn&apos;t get it? Check spam, or{" "}
          <button
            type="button"
            onClick={() => setCheckEmail(false)}
            className="font-medium text-navy hover:underline"
          >
            try again
          </button>
          .
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      kicker="Glam Site Studios"
      title="Create your website"
      description="Just your email to start. Add your business details and customise your site once you're in. Pay only when you're ready to go live."
    >
      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <label className="block text-sm font-medium">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-navy px-6 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:opacity-60"
        >
          {pending ? "Creating your dashboard…" : "Create your website"}
        </button>
        <p className="text-sm text-ink-700">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-navy hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
