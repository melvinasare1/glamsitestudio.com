"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLATFORM_DOMAIN, slugify } from "@glamsite/shared/domain";
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from "@glamsite/shared/templates";
import { AUTH_INPUT_CLASS, AuthFrame } from "@/components/auth-frame";
import { cn } from "@/lib/utils";
import { checkSlug, signUpOwner } from "./actions";

export default function SignUpPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; error?: string } | null>(null);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [pending, startTransition] = useTransition();

  const effectiveSlug = slugEdited ? slug : slugify(businessName);

  useEffect(() => {
    if (!effectiveSlug) {
      setSlugStatus(null);
      return;
    }
    const timer = setTimeout(async () => setSlugStatus(await checkSlug(effectiveSlug)), 400);
    return () => clearTimeout(timer);
  }, [effectiveSlug]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUpOwner({ email, password, businessName, slug: effectiveSlug, templateId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.needsEmailConfirmation) {
        setConfirmEmail(true);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  }

  if (confirmEmail) {
    return (
      <AuthFrame kicker="Glam Site Studios" title="Check your email">
        <p className="mt-6 text-sm text-ink-700">
          We&apos;ve sent a link to <strong>{email}</strong>. Open it to confirm your account and go to your dashboard.
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame kicker="Glam Site Studios" title="Create your website" description="Takes a minute. You can change everything later.">
      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <label className="block text-sm font-medium">
          Business name
          <input required maxLength={120} value={businessName} placeholder="e.g. Maison Bloom Hair"
            onChange={(event) => setBusinessName(event.target.value)} className={AUTH_INPUT_CLASS} />
        </label>

        <label className="block text-sm font-medium">
          Web address
          <div className="mt-1.5 flex items-center rounded-lg border border-black/8 bg-white pr-4 focus-within:border-navy">
            <input
              required
              value={effectiveSlug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value.toLowerCase());
              }}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
              aria-describedby="slug-help"
            />
            <span className="shrink-0 text-sm text-ink-700/60">.{PLATFORM_DOMAIN}</span>
          </div>
          <span id="slug-help" className={cn("mt-1 block text-xs font-normal", slugStatus?.error ? "text-red-700" : "text-ink-700/60")}>
            {slugStatus?.error ?? (slugStatus?.available ? "Available" : "You can connect your own domain later.")}
          </span>
        </label>

        <fieldset>
          <legend className="text-sm font-medium">Template</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((template) => (
              <label
                key={template.id}
                className={cn(
                  "cursor-pointer rounded-lg border bg-white p-3 text-sm",
                  templateId === template.id ? "border-navy ring-1 ring-navy" : "border-black/8"
                )}
              >
                <input type="radio" name="template" value={template.id} className="sr-only"
                  checked={templateId === template.id} onChange={() => setTemplateId(template.id)} />
                <span className="font-medium">{template.name}</span>
                <span className="block text-xs text-ink-700/70">{template.tagline}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm font-medium">
          Email
          <input required type="email" autoComplete="email" value={email}
            onChange={(event) => setEmail(event.target.value)} className={AUTH_INPUT_CLASS} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input required type="password" minLength={8} autoComplete="new-password" value={password}
            onChange={(event) => setPassword(event.target.value)} className={AUTH_INPUT_CLASS} />
          <span className="mt-1 block text-xs font-normal text-ink-700/60">At least 8 characters.</span>
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={pending || slugStatus?.available === false}
          className="rounded-full bg-navy px-6 py-3 text-sm font-medium text-white transition hover:bg-navy/90 disabled:opacity-60"
        >
          {pending ? "Creating your site…" : "Create my website"}
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
