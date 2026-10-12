import { NextRequest, NextResponse } from "next/server";
import { leadToInsert } from "@glamsite/shared/mappers";
import { createAdminClient } from "@glamsite/shared/supabase/admin";
import type { SignupLead } from "@glamsite/shared/types";
import { trackEvent } from "@/lib/vercel-track";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const lead: Omit<SignupLead, "id"> = {
      businessName: String(body.businessName ?? ""),
      contactName: String(body.contactName ?? ""),
      phone: String(body.phone ?? ""),
      email: String(body.email ?? ""),
      productCategory: String(body.productCategory ?? ""),
      estimatedMonthlyOrders: body.estimatedMonthlyOrders
        ? Number(body.estimatedMonthlyOrders)
        : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      createdAt: Date.now(),
    };

    if (!lead.businessName || !lead.phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .insert(leadToInsert(lead))
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to save lead", error);
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }

    trackEvent("lead_submitted", { productCategory: lead.productCategory });

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Failed to save lead", err);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
