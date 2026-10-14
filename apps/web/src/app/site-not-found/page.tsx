import { notFound } from "next/navigation";

/** Middleware rewrites here when a host doesn't match a live site. */
export default function SiteNotFoundPage() {
  notFound();
}
