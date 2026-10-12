import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getDashboardSession } from "@/lib/seller";
import {
  escapeHtml,
  isSupportSubject,
  supportSubjectLabel,
} from "@/lib/support";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_PHONE = 40;
const MAX_MESSAGE = 8000;

export async function POST(req: NextRequest) {
  try {
    const session = await getDashboardSession();
    if (!session) {
      return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const inboxEmail = process.env.SUPPORT_INBOX_EMAIL;
    if (!apiKey || !fromEmail || !inboxEmail) {
      return NextResponse.json(
        { error: "Support email isn't configured yet. Try again later." },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const raw = body as Record<string, unknown>;
    const name = String(raw.name ?? "").trim();
    const email = String(raw.email ?? "").trim();
    const phone = String(raw.phone ?? "").trim();
    const subjectValue = String(raw.subject ?? "").trim();
    const message = String(raw.message ?? "").trim();

    if (!name || name.length > MAX_NAME) {
      return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    }
    if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (!phone || phone.length > MAX_PHONE) {
      return NextResponse.json({ error: "Enter a contact number." }, { status: 400 });
    }
    if (!isSupportSubject(subjectValue)) {
      return NextResponse.json({ error: "Select a subject." }, { status: 400 });
    }
    if (!message || message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: "Tell us a bit more so we can help." },
        { status: 400 }
      );
    }

    const subjectLabel = supportSubjectLabel(subjectValue);
    const businessName = session.seller?.businessName || name;
    const storeSlug = session.seller?.storeSlug || "Not set";
    const sellerId = session.seller?.id || session.user.uid;

    const html = `
      <div style="font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.5; color: #0b0e14;">
        <h2 style="margin: 0 0 16px;">New support ticket</h2>
        <p><strong>Subject:</strong> ${escapeHtml(subjectLabel)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <hr style="border: none; border-top: 1px solid #e4e1d8; margin: 20px 0;" />
        <p style="margin: 0 0 8px;"><strong>Seller</strong></p>
        <p style="margin: 0;">Business: ${escapeHtml(businessName)}</p>
        <p style="margin: 0;">Store: ${escapeHtml(storeSlug)}</p>
        <p style="margin: 0 0 16px;">Seller ID: ${escapeHtml(sellerId)}</p>
        <hr style="border: none; border-top: 1px solid #e4e1d8; margin: 20px 0;" />
        <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
      </div>
    `;

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: inboxEmail,
      replyTo: email,
      subject: `[Support] ${subjectLabel}: ${businessName}`,
      html,
    });

    if (error) {
      console.error("Failed to send support ticket", error);
      return NextResponse.json(
        { error: "Couldn't send your ticket. Try again in a moment." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to send support ticket", err);
    return NextResponse.json(
      { error: "Couldn't send your ticket. Try again in a moment." },
      { status: 500 }
    );
  }
}
