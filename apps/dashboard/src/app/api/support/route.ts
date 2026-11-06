import { NextRequest, NextResponse } from "next/server";
import { escapeHtml, sendEmail } from "@glamsite/shared/email";
import { tooManyRequests, withinRateLimit } from "@glamsite/shared/rate-limit";
import { getDashboardSession } from "@/lib/business";
import { isSupportSubject, supportSubjectLabel } from "@/lib/support";

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
    // Keyed by the signed-in user, not IP: this is authenticated, so an IP
    // key would let one office network's owners rate-limit each other.
    if (!(await withinRateLimit(`support:${session.user.id}`, 60, 5))) {
      return tooManyRequests("Too many support messages. Please wait a moment and try again.");
    }

    const inboxEmail = process.env.SUPPORT_INBOX_EMAIL;
    if (!inboxEmail) {
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
    const businessName = session.business?.name || name;
    const slug = session.business?.slug || "Not set";
    const businessId = session.business?.id || "None";

    const html = `
      <div style="font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.5; color: #0b0e14;">
        <h2 style="margin: 0 0 16px;">New support ticket</h2>
        <p><strong>Subject:</strong> ${escapeHtml(subjectLabel)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <hr style="border: none; border-top: 1px solid #e4e1d8; margin: 20px 0;" />
        <p style="margin: 0 0 8px;"><strong>Business</strong></p>
        <p style="margin: 0;">Business: ${escapeHtml(businessName)}</p>
        <p style="margin: 0;">Site: ${escapeHtml(slug)}</p>
        <p style="margin: 0 0 16px;">Business ID: ${escapeHtml(businessId)}</p>
        <hr style="border: none; border-top: 1px solid #e4e1d8; margin: 20px 0;" />
        <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
      </div>
    `;

    const text = [
      `Subject: ${subjectLabel}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      "",
      `Business: ${businessName}`,
      `Site: ${slug}`,
      `Business ID: ${businessId}`,
      "",
      message,
    ].join("\n");

    const sent = await sendEmail({
      to: inboxEmail,
      replyTo: email,
      subject: `[Support] ${subjectLabel}: ${businessName}`,
      html,
      text,
    });

    if (!sent) {
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
