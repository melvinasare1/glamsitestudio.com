import { redirect } from "next/navigation";
import { getDashboardSession } from "@/lib/seller";
import { templateHasBlog } from "@/lib/storefront-templates";
import BlogList from "./blog-list";

export default async function BlogPage() {
  const session = await getDashboardSession();
  if (!templateHasBlog(session?.seller?.template)) {
    redirect("/dashboard");
  }
  return <BlogList />;
}
