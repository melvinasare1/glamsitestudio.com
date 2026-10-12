import { notFound } from "next/navigation";

/** Rewritten to from middleware when Host does not match a connected seller. */
export default function HostNotFoundPage() {
  notFound();
}
