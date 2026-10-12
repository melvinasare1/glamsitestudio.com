import type { Metadata } from "next";
import { NewProductForm } from "./new-product-form";

export const metadata: Metadata = {
  title: "Add new product",
};

export default function NewProductPage() {
  return <NewProductForm />;
}
