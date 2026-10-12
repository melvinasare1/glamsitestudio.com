import type { Metadata } from "next";
import { NotFoundHeader } from "@/components/NotFoundHeader";
import { NotFoundView } from "@/components/NotFoundView";

export const metadata: Metadata = {
  title: "404 Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-black">
      <NotFoundHeader />
      <NotFoundView homeHref="/" />
    </div>
  );
}
