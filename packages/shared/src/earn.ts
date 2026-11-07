import type { PlatformReferralPayoutMethod } from "./types";

export const PLATFORM_REFERRAL_PAYOUT_METHODS: PlatformReferralPayoutMethod[] = [
  "bank_uk",
  "iban",
  "zelle",
  "cashapp",
  "paypal",
  "interac",
];

export const PLATFORM_REFERRAL_PAYOUT_METHOD_LABEL: Record<PlatformReferralPayoutMethod, string> = {
  bank_uk: "UK bank transfer",
  iban: "IBAN / SEPA transfer",
  zelle: "Zelle",
  cashapp: "Cash App",
  paypal: "PayPal",
  interac: "Interac e-Transfer",
};

/** Which fields a method needs, and what to label them as -- shared by the owner's form and the admin payout display. */
export const PLATFORM_REFERRAL_PAYOUT_METHOD_FIELDS: Record<
  PlatformReferralPayoutMethod,
  { identifierLabel: string; identifier2Label: string | null }
> = {
  bank_uk: { identifierLabel: "Account number", identifier2Label: "Sort code" },
  iban: { identifierLabel: "IBAN", identifier2Label: "BIC / SWIFT" },
  zelle: { identifierLabel: "Zelle email or phone", identifier2Label: null },
  cashapp: { identifierLabel: "$Cashtag", identifier2Label: null },
  paypal: { identifierLabel: "PayPal email", identifier2Label: null },
  interac: { identifierLabel: "Interac e-Transfer email", identifier2Label: null },
};
