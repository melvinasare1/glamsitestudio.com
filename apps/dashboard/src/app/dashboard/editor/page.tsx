import { fetchSellerStoreContent, getDashboardSession } from "@/lib/seller";
import { StorefrontEditor } from "./storefront-editor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditorPage() {
  const session = await getDashboardSession();
  const seller = session?.seller ?? null;
  const stored = seller ? await fetchSellerStoreContent(seller.id) : {};
  const initialContent = { ...(seller?.storeContent ?? {}), ...stored };

  return (
    <div className="max-w-5xl px-4 py-6 md:py-8 lg:px-6">
      <p className="max-w-2xl text-sm leading-relaxed text-ink-700/50">
        Edit the text and images on your shop. Changes go live on your storefront when you save.
      </p>
      {!seller ? (
        <p className="mt-6 text-sm text-ink-700/60">
          Link a seller profile to this account before editing storefront content.
        </p>
      ) : (
        <StorefrontEditor seller={seller} initialContent={initialContent} />
      )}
    </div>
  );
}
