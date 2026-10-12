"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import {
  checkStoreSlugAvailable,
  completeSellerProfile,
  signUpSeller,
} from "@/app/signup-seller/actions";
import {
  FULFILMENT_FEATURES,
  PRODUCT_CATEGORY_SUGGESTIONS,
  STOREFRONT_TEMPLATE_OPTIONS,
  templateLabel,
  WEBSITE_ADMIN_FEATURES,
} from "@/lib/storefront-templates";
import { slugifyStoreName } from "@/lib/store-slug";
import {
  isValidPhoneNumber,
  normalizePhoneForStorage,
  PHONE_DIGIT_ERROR,
  stripPhoneWhitespace,
} from "@/lib/phone";
import { TRIAL_LENGTH_DAYS } from "@/lib/trial";
import { cn } from "@/lib/utils";
import { storefrontPublicPath } from "@glamsite/shared/store-domain";
import { getWebUrl } from "@glamsite/shared/supabase/env";
import {
  PRICING_TIER_BASE_FEE_CEDIS,
  parseStorefrontTemplate,
  type PricingTier,
  type StorefrontTemplate,
} from "@glamsite/shared/types";

const INPUT_CLASS =
  "mt-1.5 w-full rounded-lg border border-black/8 bg-white px-4 py-2.5 text-sm text-ink-950 outline-none placeholder:text-muted-foreground focus:border-brand";

const STORAGE_KEY = "glamsite-seller-onboarding";

type WizardMode = "signup" | "complete";
type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

type Draft = {
  email: string;
  businessName: string;
  storeSlug: string;
  phone: string;
  momoPhone: string;
  momoSameAsMobile: boolean;
  template: StorefrontTemplate;
  productCategory: string;
  pricingTier: PricingTier;
  startFreeTrial: boolean;
};

const EMPTY_DRAFT: Draft = {
  email: "",
  businessName: "",
  storeSlug: "",
  phone: "",
  momoPhone: "",
  momoSameAsMobile: true,
  template: "template-a",
  productCategory: "",
  pricingTier: "website_admin",
  startFreeTrial: true,
};

const SIGNUP_STEPS = ["Account", "Template", "Business", "Plan", "Confirm"] as const;
const COMPLETE_STEPS = ["Template", "Business", "Plan", "Confirm"] as const;

function readDraft(): Draft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      email: String(parsed.email ?? ""),
      businessName: String(parsed.businessName ?? ""),
      storeSlug: slugifyStoreName(String(parsed.storeSlug ?? "")),
      phone: String(parsed.phone ?? ""),
      momoPhone: String(parsed.momoPhone ?? parsed.phone ?? ""),
      momoSameAsMobile: parsed.momoSameAsMobile !== false,
      template: parseStorefrontTemplate(parsed.template),
      productCategory: String(parsed.productCategory ?? ""),
      pricingTier: parsed.pricingTier === "fulfilment" ? "fulfilment" : "website_admin",
      startFreeTrial: parsed.startFreeTrial !== false,
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function persistDraft(draft: Draft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* private mode */
  }
}

function previewStoreUrl(slug: string) {
  return `${getWebUrl()}${storefrontPublicPath(slug || "your-store")}`;
}

export default function SellerOnboardingWizard({ mode }: { mode: WizardMode }) {
  const router = useRouter();
  const steps = mode === "signup" ? SIGNUP_STEPS : COMPLETE_STEPS;
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [momoPhoneError, setMomoPhoneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    const saved = readDraft();
    setDraft(saved);
    if (saved.storeSlug) setSlugTouched(true);
  }, []);

  const updateDraft = useCallback((patch: Partial<Draft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      persistDraft(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (step !== (mode === "signup" ? 2 : 1)) return;
    const slug = draft.storeSlug;
    if (!slug) {
      setSlugStatus("invalid");
      setSlugError(null);
      return;
    }
    setSlugStatus("checking");
    setSlugError(null);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      checkStoreSlugAvailable(slug)
        .then((result) => {
          if (cancelled) return;
          if (result.error) {
            setSlugStatus("error");
            setSlugError(result.error);
            return;
          }
          setSlugError(null);
          setSlugStatus(result.available ? "available" : "taken");
          if (result.slug && result.slug !== slug) {
            updateDraft({ storeSlug: result.slug });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSlugStatus("error");
            setSlugError("Could not check that store URL. Try again.");
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [draft.storeSlug, mode, step, updateDraft]);

  const planLabel =
    draft.pricingTier === "fulfilment" ? "Fulfilment · 400 GHS/mo intro" : "Website & Admin · 250 GHS/mo";

  const paymentPhone = draft.momoSameAsMobile ? draft.phone : draft.momoPhone;
  const phoneValid = isValidPhoneNumber(draft.phone);
  const paymentPhoneValid = isValidPhoneNumber(paymentPhone);

  const canContinue = useMemo(() => {
    const signupStep = mode === "signup" ? step : step + 1;
    if (signupStep === 0) {
      return Boolean(draft.email.trim() && password.length >= 6 && password === confirmPassword);
    }
    if (signupStep === 2) {
      return (
        Boolean(draft.businessName.trim()) &&
        Boolean(draft.productCategory.trim()) &&
        Boolean(draft.storeSlug) &&
        slugStatus === "available" &&
        phoneValid &&
        paymentPhoneValid &&
        !phoneError &&
        !momoPhoneError
      );
    }
    return true;
  }, [
    confirmPassword,
    draft,
    mode,
    momoPhoneError,
    password,
    paymentPhoneValid,
    phoneError,
    phoneValid,
    slugStatus,
    step,
  ]);

  function goNext() {
    setError(null);
    if (mode === "signup" && step === 0 && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const signupStep = mode === "signup" ? step : step + 1;
    if (signupStep === 2) {
      const nextPhoneError = phoneValid ? null : PHONE_DIGIT_ERROR;
      const nextMomoError = paymentPhoneValid ? null : PHONE_DIGIT_ERROR;
      setPhoneError(nextPhoneError);
      setMomoPhoneError(draft.momoSameAsMobile ? null : nextMomoError);
      if (nextPhoneError || nextMomoError) return;
    }
    if (!canContinue) return;
    setStep((n) => Math.min(n + 1, steps.length - 1));
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        businessName: draft.businessName,
        storeSlug: draft.storeSlug,
        phone: normalizePhoneForStorage(draft.phone),
        momoPhone: normalizePhoneForStorage(paymentPhone),
        template: draft.template,
        pricingTier: draft.pricingTier,
        productCategory: draft.productCategory,
      };

      const result =
        mode === "signup"
          ? await signUpSeller({
              ...payload,
              email: draft.email,
              password,
            })
          : await completeSellerProfile(payload);

      if (!result || typeof result !== "object") {
        setError("Could not create the seller profile. Try again.");
        return;
      }

      if ("error" in result) {
        setError(result.error);
        if (result.resumeProfile && mode === "signup") {
          router.replace("/signup-seller/complete");
        }
        return;
      }

      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }

      if (result.needsEmailConfirmation) {
        setCheckEmail(true);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the seller profile.");
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <Shell>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand">Check your inbox</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink-950">Confirm your email to finish.</h1>
        <p className="mt-3 text-sm text-ink-700">
          We created your seller profile. Open the confirmation link, then{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            log in to your dashboard
          </Link>
          .
        </p>
      </Shell>
    );
  }

  const signupIndex = mode === "signup" ? step : step + 1;

  return (
    <Shell>
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-brand">
        {mode === "complete" ? "Finish setup" : "Create your store"}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink-950">
        {mode === "complete" ? "Complete your seller profile" : "Set up your Glam Site Studios store"}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-ink-700">
        {mode === "complete"
          ? "Your login exists, but there is no seller profile yet. Finish these steps to attach one. Nothing is live until you confirm."
          : "Five short steps. We only create your account and store when you confirm on the last screen."}
      </p>

      <ol className="mt-8 flex flex-wrap gap-2">
        {steps.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                  done && "bg-brand text-white",
                  active && "bg-brand-soft text-brand",
                  !done && !active && "bg-white text-muted-foreground ring-1 ring-black/8"
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={2.5} /> : index + 1}
              </span>
              <span className={cn("text-sm", active ? "font-medium text-ink-950" : "text-muted-foreground")}>
                {label}
              </span>
              {index < steps.length - 1 ? <span className="mx-1 hidden h-px w-6 bg-black/10 sm:block" /> : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-8">
        {signupIndex === 0 ? (
          <AccountStep
            email={draft.email}
            password={password}
            confirmPassword={confirmPassword}
            onEmail={(email) => updateDraft({ email })}
            onPassword={setPassword}
            onConfirm={setConfirmPassword}
          />
        ) : null}

        {signupIndex === 1 ? (
          <TemplateStep
            selected={draft.template}
            onSelect={(template) => updateDraft({ template })}
          />
        ) : null}

        {signupIndex === 2 ? (
          <BusinessStep
            draft={draft}
            slugStatus={slugStatus}
            slugError={slugError}
            phoneError={phoneError}
            momoPhoneError={momoPhoneError}
            onBusinessName={(businessName) => {
              updateDraft({
                businessName,
                storeSlug: slugTouched ? draft.storeSlug : slugifyStoreName(businessName),
              });
            }}
            onSlug={(storeSlug) => {
              setSlugTouched(true);
              updateDraft({ storeSlug: slugifyStoreName(storeSlug) });
            }}
            onPhone={(phone) => {
              setPhoneError(null);
              updateDraft({
                phone,
                ...(draft.momoSameAsMobile ? { momoPhone: phone } : {}),
              });
            }}
            onPhoneBlur={() => {
              const stripped = stripPhoneWhitespace(draft.phone);
              if (stripped !== draft.phone) {
                updateDraft({
                  phone: stripped,
                  ...(draft.momoSameAsMobile ? { momoPhone: stripped } : {}),
                });
              }
              setPhoneError(isValidPhoneNumber(stripped) ? null : PHONE_DIGIT_ERROR);
              if (draft.momoSameAsMobile) {
                setMomoPhoneError(null);
              }
            }}
            onMomoPhone={(momoPhone) => {
              setMomoPhoneError(null);
              updateDraft({ momoPhone });
            }}
            onMomoPhoneBlur={() => {
              const stripped = stripPhoneWhitespace(draft.momoPhone);
              if (stripped !== draft.momoPhone) {
                updateDraft({ momoPhone: stripped });
              }
              setMomoPhoneError(isValidPhoneNumber(stripped) ? null : PHONE_DIGIT_ERROR);
            }}
            onMomoSameAsMobile={(momoSameAsMobile) => {
              updateDraft({
                momoSameAsMobile,
                ...(momoSameAsMobile ? { momoPhone: draft.phone } : {}),
              });
              setMomoPhoneError(null);
            }}
            onCategory={(productCategory) => updateDraft({ productCategory })}
          />
        ) : null}

        {signupIndex === 3 ? (
          <PlanStep
            selected={draft.pricingTier}
            onSelect={(pricingTier) => updateDraft({ pricingTier })}
            startFreeTrial={draft.startFreeTrial}
          />
        ) : null}

        {signupIndex === 4 ? (
          <ConfirmStep
            draft={draft}
            paymentPhone={paymentPhone}
            email={mode === "signup" ? draft.email : undefined}
            planLabel={planLabel}
            startFreeTrial={draft.startFreeTrial}
          />
        ) : null}
      </div>

      {error ? <p className="mt-6 text-sm text-delta-down">{error}</p> : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((n) => n - 1);
            }}
            className="text-sm font-medium text-ink-700 hover:text-ink-950"
          >
            Back
          </button>
        ) : (
          <Link href="/login" className="text-sm text-muted-foreground hover:text-ink-950">
            Already have a login?
          </Link>
        )}

        {signupIndex < 4 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            {loading ? "Creating store…" : "Go to dashboard"}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-mist px-6 py-12 text-ink-950 md:py-16">
      <div className="mx-auto max-w-3xl">{children}</div>
    </main>
  );
}

function AccountStep({
  email,
  password,
  confirmPassword,
  onEmail,
  onPassword,
  onConfirm,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-black/8 bg-white p-6 shadow-card">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          className={INPUT_CLASS}
        />
      </label>
      <PasswordField
        label="Password"
        autoComplete="new-password"
        value={password}
        onChange={onPassword}
        hint="At least 6 characters."
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={onConfirm}
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "new-password" | "current-password";
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="relative mt-1.5">
        <input
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT_CLASS} mt-0 pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((show) => !show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-ink-950"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function TemplateStep({
  selected,
  onSelect,
}: {
  selected: StorefrontTemplate;
  onSelect: (id: StorefrontTemplate) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {STOREFRONT_TEMPLATE_OPTIONS.map((template) => {
        const active = template.id === selected;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={cn(
              "flex flex-col rounded-2xl border bg-white p-5 text-left shadow-card transition",
              active ? "border-brand ring-2 ring-brand/20" : "border-black/8 hover:border-black/20"
            )}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-canvas">
              {template.previewImage ? (
                <Image
                  src={template.previewImage}
                  alt={`${template.name} storefront preview`}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              ) : (
                <div className={cn("h-full w-full", template.previewClass)} aria-hidden="true" />
              )}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{template.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{template.description}</p>
            <span className={cn("mt-4 text-sm font-medium", active ? "text-brand" : "text-muted-foreground")}>
              {active ? "Selected" : "Select"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BusinessStep({
  draft,
  slugStatus,
  slugError,
  phoneError,
  momoPhoneError,
  onBusinessName,
  onSlug,
  onPhone,
  onPhoneBlur,
  onMomoPhone,
  onMomoPhoneBlur,
  onMomoSameAsMobile,
  onCategory,
}: {
  draft: Draft;
  slugStatus: SlugStatus;
  slugError: string | null;
  phoneError: string | null;
  momoPhoneError: string | null;
  onBusinessName: (value: string) => void;
  onSlug: (value: string) => void;
  onPhone: (value: string) => void;
  onPhoneBlur: () => void;
  onMomoPhone: (value: string) => void;
  onMomoPhoneBlur: () => void;
  onMomoSameAsMobile: (value: boolean) => void;
  onCategory: (value: string) => void;
}) {
  const slugHint =
    slugStatus === "checking"
      ? "Checking availability…"
      : slugStatus === "available"
        ? "This store URL is available."
        : slugStatus === "taken"
          ? "That store URL is taken. Try another."
          : slugStatus === "invalid"
            ? "Use letters or numbers."
            : slugStatus === "error"
              ? slugError ?? "Could not check that store URL. Try again."
              : "Used when we copy this template into your store.";

  return (
    <div className="space-y-5 rounded-2xl border border-black/8 bg-white p-6 shadow-card">
      <label className="block">
        <span className="text-sm font-medium">Business name</span>
        <input
          type="text"
          autoComplete="organization"
          required
          value={draft.businessName}
          onChange={(e) => onBusinessName(e.target.value)}
          className={INPUT_CLASS}
        />
      </label>

      <div>
        <span className="text-sm font-medium">Product category</span>
        <input
          type="text"
          required
          value={draft.productCategory}
          onChange={(e) => onCategory(e.target.value)}
          placeholder="e.g. Fashion"
          className={INPUT_CLASS}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {PRODUCT_CATEGORY_SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onCategory(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                draft.productCategory === tag
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-black/8 text-ink-700 hover:border-black/20"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Store slug</span>
        <input
          type="text"
          required
          value={draft.storeSlug}
          onChange={(e) => onSlug(e.target.value)}
          className={`${INPUT_CLASS} font-mono`}
        />
        <span
          className={cn(
            "mt-1.5 block text-xs",
            slugStatus === "taken" || slugStatus === "invalid" || slugStatus === "error"
              ? "text-delta-down"
              : slugStatus === "available"
                ? "text-brand"
                : "text-muted-foreground"
          )}
        >
          {slugHint} Preview: {previewStoreUrl(draft.storeSlug)}
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Mobile number</span>
        <input
          type="tel"
          autoComplete="tel"
          required
          value={draft.phone}
          onChange={(e) => onPhone(e.target.value)}
          onBlur={onPhoneBlur}
          placeholder="e.g. 0241234567"
          aria-invalid={phoneError ? true : undefined}
          className={cn(INPUT_CLASS, phoneError && "border-delta-down focus:border-delta-down")}
        />
        {phoneError ? (
          <span className="mt-1.5 block text-xs text-delta-down">{phoneError}</span>
        ) : (
          <span className="mt-1.5 block text-xs text-muted-foreground">
            Your contact number for account and support messages. Enter exactly 10 digits.
          </span>
        )}
      </label>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={draft.momoSameAsMobile}
            onChange={(e) => onMomoSameAsMobile(e.target.checked)}
            className="mt-1 size-4 rounded border-black/20 text-brand focus:ring-brand"
          />
          <span className="text-sm text-ink-800">
            Mobile Money payment number is the same as my mobile number
          </span>
        </label>

        {!draft.momoSameAsMobile ? (
          <label className="block">
            <span className="text-sm font-medium">Mobile Money payment number</span>
            <input
              type="tel"
              autoComplete="tel"
              required
              value={draft.momoPhone}
              onChange={(e) => onMomoPhone(e.target.value)}
              onBlur={onMomoPhoneBlur}
              placeholder="e.g. 0249876543"
              aria-invalid={momoPhoneError ? true : undefined}
              className={cn(INPUT_CLASS, momoPhoneError && "border-delta-down focus:border-delta-down")}
            />
            {momoPhoneError ? (
              <span className="mt-1.5 block text-xs text-delta-down">{momoPhoneError}</span>
            ) : (
              <span className="mt-1.5 block text-xs text-muted-foreground">
                This is the number buyers will send Mobile Money to at checkout. Enter exactly 10 digits.
              </span>
            )}
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            Buyers will pay to <span className="font-medium text-ink-800">{draft.phone || "your mobile number"}</span>{" "}
            at checkout.
          </p>
        )}
      </div>

      <div>
        <span className="text-sm font-medium">Store preview</span>
        <p className="mt-1.5 rounded-lg border border-dashed border-black/12 bg-mist px-4 py-2.5 font-mono text-sm text-ink-700">
          {previewStoreUrl(draft.storeSlug)}
        </p>
        <span className="mt-1.5 block text-xs text-muted-foreground">
          Use this path to test your shop. Your public domain is connected manually by Glam Site Studios — we will be in touch; this is not self-serve yet.
        </span>
      </div>
    </div>
  );
}

function PlanStep({
  selected,
  onSelect,
  startFreeTrial,
}: {
  selected: PricingTier;
  onSelect: (tier: PricingTier) => void;
  startFreeTrial: boolean;
}) {
  return (
    <div className="space-y-6">
    <div className="grid gap-6 md:grid-cols-2">
      <article
        className={cn(
          "flex flex-col rounded-2xl border bg-white p-6 shadow-card",
          selected === "website_admin" ? "border-brand ring-2 ring-brand/20" : "border-black/8"
        )}
      >
        <h3 className="font-display text-2xl font-semibold">Website & Admin</h3>
        <p className="mt-2 text-sm text-ink-700">Your own storefront, run it yourself.</p>
        <p className="mt-6 font-display text-4xl font-semibold">
          {PRICING_TIER_BASE_FEE_CEDIS.website_admin} GHS
          <span className="ml-1 text-lg font-medium text-ink-700">/ month</span>
        </p>
        <ul className="mt-8 flex-1 space-y-3">
          {WEBSITE_ADMIN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-ink-800">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.25} />
              {feature}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onSelect("website_admin")}
          className={cn(
            "mt-8 rounded-full px-6 py-3 text-sm font-medium",
            selected === "website_admin"
              ? "bg-brand text-white"
              : "border border-brand text-brand hover:bg-brand hover:text-white"
          )}
        >
          {selected === "website_admin" ? "Selected" : "Choose Website & Admin"}
        </button>
      </article>

      <article
        className={cn(
          "relative flex flex-col rounded-2xl border p-6 shadow-card",
          selected === "fulfilment" ? "border-brand bg-brand-soft/40 ring-2 ring-brand/20" : "border-brand/40 bg-brand-soft/20"
        )}
      >
        <span className="absolute -top-3 right-6 rounded-full bg-brand px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-white">
          Most complete
        </span>
        <h3 className="font-display text-2xl font-semibold">Fulfilment</h3>
        <p className="mt-2 text-sm text-ink-700">Everything above, plus we pack and send every order.</p>
        <p className="mt-6 font-display text-4xl font-semibold">
          {PRICING_TIER_BASE_FEE_CEDIS.fulfilment} GHS
          <span className="ml-1 text-lg font-medium text-ink-700">/ month</span>
        </p>
        <p className="mt-1 font-mono text-xs font-medium uppercase tracking-wide text-brand">Intro price</p>
        <ul className="mt-8 flex-1 space-y-3">
          {FULFILMENT_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-ink-800">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.25} />
              {feature}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onSelect("fulfilment")}
          className={cn(
            "mt-8 rounded-full px-6 py-3 text-sm font-medium",
            selected === "fulfilment"
              ? "bg-brand text-white"
              : "border border-brand text-brand hover:bg-brand hover:text-white"
          )}
        >
          {selected === "fulfilment" ? "Selected" : "Choose Fulfilment"}
        </button>
      </article>
    </div>

    <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-card">
      <label className="flex cursor-not-allowed items-start gap-3 opacity-90">
        <input
          type="checkbox"
          checked={startFreeTrial}
          disabled
          readOnly
          className="mt-1 size-4 rounded border-black/20 text-brand"
        />
        <span>
          <span className="text-sm font-medium text-ink-950">
            Start with a {TRIAL_LENGTH_DAYS}-day free trial — no payment needed until it ends
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Every new store gets a full {TRIAL_LENGTH_DAYS}-day free trial. After signup you can pay
            from your billing page when you are ready — there is no separate pay-upfront option yet.
          </span>
        </span>
      </label>
    </div>
    </div>
  );
}

function ConfirmStep({
  draft,
  paymentPhone,
  email,
  planLabel,
  startFreeTrial,
}: {
  draft: Draft;
  paymentPhone: string;
  email?: string;
  planLabel: string;
  startFreeTrial: boolean;
}) {
  const displayPhone = normalizePhoneForStorage(draft.phone) || draft.phone;
  const displayPaymentPhone = normalizePhoneForStorage(paymentPhone) || paymentPhone;

  return (
    <div className="space-y-4">
      {startFreeTrial ? (
        <div className="rounded-2xl border border-brand/30 bg-brand-soft p-6">
          <p className="text-sm font-medium text-ink-950">
            Your {TRIAL_LENGTH_DAYS}-day free trial starts today — no payment needed until it ends.
          </p>
          <p className="mt-2 text-sm text-ink-700">
            We will remind you from your dashboard when it is time to pay. You can send payment from
            the billing page at any point during or after the trial.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-white p-6">
          <p className="text-sm font-medium text-ink-950">No free trial selected.</p>
          <p className="mt-2 text-sm text-ink-700">
            Your account will need payment before it is fully active.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-black/8 bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Review before you go live</h2>
        <dl className="mt-4 divide-y divide-black/6 text-sm">
          {email ? (
            <Row label="Email" value={email} />
          ) : null}
          <Row label="Template" value={templateLabel(draft.template)} />
          <Row label="Business name" value={draft.businessName || "Not set"} />
          <Row label="Product category" value={draft.productCategory || "Not set"} />
          <Row label="Preview URL" value={previewStoreUrl(draft.storeSlug)} />
          <Row label="Plan" value={planLabel} />
          <Row
            label="Free trial"
            value={
              startFreeTrial
                ? `${TRIAL_LENGTH_DAYS}-day free trial — payment due after it ends`
                : "No trial — payment required to activate"
            }
          />
          <Row label="Mobile number" value={displayPhone || "Not set"} />
          <Row
            label="MoMo payment number"
            value={
              draft.momoSameAsMobile
                ? `${displayPaymentPhone || "Not set"} (same as mobile)`
                : displayPaymentPhone || "Not set"
            }
          />
        </dl>
      </div>

      <div className="rounded-2xl border border-brand/30 bg-brand-soft p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">MoMo number buyers will pay</p>
        <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink-950">
          {displayPaymentPhone || "Not set"}
        </p>
        <p className="mt-2 text-sm text-ink-700">
          Check this twice. Checkout tells buyers to send Mobile Money here. If it is wrong, they pay
          the wrong person.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-ink-950">{value}</dd>
    </div>
  );
}
