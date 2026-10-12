"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  uploadVerificationDocument,
  validateVerificationDocument,
  VERIFICATION_DOCUMENT_ACCEPT,
  type VerificationDocType,
} from "@glamsite/shared/id-verification";
import { createClient } from "@glamsite/shared/supabase/client";
import { useSeller } from "@/lib/seller-context";
import { createVerificationDocumentPreviewUrl } from "./actions";

type DocSlot = {
  docType: VerificationDocType;
  column: "id_document_url" | "profile_photo_url" | "business_registration_url";
  label: string;
  hint: string;
  required: boolean;
};

const SLOTS: DocSlot[] = [
  {
    docType: "id-document",
    column: "id_document_url",
    label: "ID document",
    hint: "Photo of a national ID, passport, or similar. Required to publish.",
    required: true,
  },
  {
    docType: "profile-photo",
    column: "profile_photo_url",
    label: "Profile photo",
    hint: "A clear photo of your face. Required to publish.",
    required: true,
  },
  {
    docType: "business-registration",
    column: "business_registration_url",
    label: "Business registration",
    hint: "Optional. Upload if you have a registered business.",
    required: false,
  },
];

type SlotUi = {
  path: string | null;
  uploading: boolean;
  previewing: boolean;
  previewUrl: string | null;
  error: string | null;
};

function initialSlots(
  paths: Record<VerificationDocType, string | null>
): Record<VerificationDocType, SlotUi> {
  return {
    "id-document": {
      path: paths["id-document"],
      uploading: false,
      previewing: false,
      previewUrl: null,
      error: null,
    },
    "profile-photo": {
      path: paths["profile-photo"],
      uploading: false,
      previewing: false,
      previewUrl: null,
      error: null,
    },
    "business-registration": {
      path: paths["business-registration"],
      uploading: false,
      previewing: false,
      previewUrl: null,
      error: null,
    },
  };
}

export function VerificationDocuments() {
  const router = useRouter();
  const { seller } = useSeller();
  const [slots, setSlots] = useState<Record<VerificationDocType, SlotUi>>(() =>
    initialSlots({
      "id-document": seller?.idDocumentUrl ?? null,
      "profile-photo": seller?.profilePhotoUrl ?? null,
      "business-registration": seller?.businessRegistrationUrl ?? null,
    })
  );

  function patch(docType: VerificationDocType, next: Partial<SlotUi>) {
    setSlots((prev) => ({ ...prev, [docType]: { ...prev[docType], ...next } }));
  }

  async function onFileChange(slot: DocSlot, file: File | undefined) {
    if (!file || !seller) return;

    const validationError = validateVerificationDocument(file);
    if (validationError) {
      patch(slot.docType, { error: validationError });
      return;
    }

    patch(slot.docType, { uploading: true, error: null, previewUrl: null });
    try {
      const path = await uploadVerificationDocument(seller.id, file, slot.docType);
      const supabase = createClient();
      const update: Record<string, string | boolean> = { [slot.column]: path };
      if (slot.docType === "business-registration") {
        update.has_business_registration = true;
      }
      const { error } = await supabase.from("sellers").update(update).eq("id", seller.id);

      if (error) throw error;
      patch(slot.docType, { uploading: false, path, error: null });
      router.refresh();
    } catch (err) {
      patch(slot.docType, {
        uploading: false,
        error: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  async function onPreview(docType: VerificationDocType) {
    const path = slots[docType].path;
    if (!path) return;

    patch(docType, { previewing: true, error: null });
    const result = await createVerificationDocumentPreviewUrl(path);
    if ("error" in result) {
      patch(docType, { previewing: false, error: result.error });
      return;
    }
    patch(docType, { previewing: false, previewUrl: result.url, error: null });
  }

  if (!seller) {
    return (
      <p className="mt-4 text-sm text-ink-700/60">
        Link a seller profile to this account before uploading identity documents.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {SLOTS.map((slot) => {
        const ui = slots[slot.docType];
        const inputId = `verification-${slot.docType}`;
        return (
          <div key={slot.docType} className="border-b border-wire pb-6 last:border-0 last:pb-0">
            <label htmlFor={inputId} className="text-sm font-medium text-ink-950">
              {slot.label}
              {slot.required ? (
                <span className="ml-1 text-xs font-normal text-ink-700/50">Required</span>
              ) : (
                <span className="ml-1 text-xs font-normal text-ink-700/50">Optional</span>
              )}
            </label>
            <p className="mt-0.5 text-xs text-ink-700/40">{slot.hint}</p>

            <input
              id={inputId}
              type="file"
              accept={VERIFICATION_DOCUMENT_ACCEPT}
              disabled={ui.uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void onFileChange(slot, file);
              }}
              className="mt-3 block w-full text-sm text-ink-700 file:mr-3 file:rounded-lg file:border file:border-wire file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-950"
            />

            {ui.uploading ? (
              <p className="mt-2 text-xs text-ink-700/60">Uploading…</p>
            ) : null}
            {ui.path && !ui.uploading ? (
              <p className="mt-2 text-xs text-ink-700/60">
                Uploaded. Choose a new file to replace it.
              </p>
            ) : null}
            {ui.error ? <p className="mt-2 text-xs text-destructive">{ui.error}</p> : null}

            <button
              type="button"
              disabled={!ui.path || ui.uploading || ui.previewing}
              onClick={() => void onPreview(slot.docType)}
              className="mt-3 rounded-lg border border-wire px-3 py-1.5 text-sm font-medium text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ui.previewing ? "Loading preview…" : ui.path ? "Preview" : "Nothing to preview"}
            </button>

            {ui.previewUrl ? (
              // Signed URLs expire and include query params; a plain img is the right fit.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ui.previewUrl}
                alt={`${slot.label} preview`}
                className="mt-4 max-h-64 w-full rounded-lg border border-wire object-contain bg-mist"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
