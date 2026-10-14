import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-neutral-900">
      <p className="text-sm uppercase tracking-widest text-neutral-500">404</p>
      <h1 className="mt-3 text-3xl font-semibold">This page isn&apos;t here</h1>
      <p className="mt-3 max-w-sm text-neutral-600">
        The site may not be published yet, or the address might be mistyped.
      </p>
    </main>
  );
}
