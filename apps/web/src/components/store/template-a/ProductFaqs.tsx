"use client";

import { PdpFaqs } from "@/components/store/pdp/PdpFaqs";
import { STYLECO_CHROME } from "@/components/store/pdp/chrome";
import type { StoreFaq } from "@glamsite/shared/types";

export function ProductFaqs({ faqs }: { faqs: StoreFaq[] }) {
  return <PdpFaqs faqs={faqs} chrome={STYLECO_CHROME} />;
}
