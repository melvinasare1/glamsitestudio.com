import { RideCartView } from "@/components/store/motorbike-template/cart-view";
import { rideLiveStoreSlug } from "@/components/store/motorbike-template/catalog";

export default function MotorbikeTemplateCartPage() {
  return <RideCartView storeSlug={rideLiveStoreSlug() || "motorbike-template"} />;
}
