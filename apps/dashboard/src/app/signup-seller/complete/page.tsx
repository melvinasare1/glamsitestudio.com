import { redirect } from "next/navigation";
import CompleteSellerProfileForm from "@/app/signup-seller/complete/complete-form";
import { fetchSellerForAuthUser } from "@/lib/seller";
import { createClient } from "@glamsite/shared/supabase/server";

export default async function CompleteSellerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const seller = await fetchSellerForAuthUser(supabase, user.id);
  if (seller) {
    redirect("/dashboard");
  }

  return <CompleteSellerProfileForm />;
}
