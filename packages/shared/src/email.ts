/**
 * Booking emails, sent through Resend's HTTP API (no SDK, so both apps can use
 * it). Server only: it reads RESEND_API_KEY.
 *
 * Sending is best effort. A booking is never refused because an email failed;
 * failures are logged and the booking stands.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "Glam Site Studios <hello@glamsitestudio.com>" → "hello@glamsitestudio.com" */
function addressOf(from: string): string {
  const match = /<([^>]+)>/.exec(from);
  return (match ? match[1] : from).trim();
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Shown as the sender's name, e.g. the salon's name. */
  fromName?: string;
  replyTo?: string;
};

export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    console.warn("[email] Resend isn't configured; skipped", { subject: email.subject });
    return false;
  }
  if (!email.to.trim()) return false;

  // Keep our verified sending address, but show the salon's name.
  const safeName = email.fromName?.replace(/[<>"\r\n]/g, "").trim();
  const sender = safeName ? `${safeName} <${addressOf(from)}>` : from;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: [email.to.trim()],
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo?.trim() || undefined,
      }),
    });
    if (!response.ok) {
      console.error("[email] Resend refused", { status: response.status, body: await response.text() });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send failed", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Auth templates
// ---------------------------------------------------------------------------

/**
 * Sent instead of redeeming a sign-in token ourselves: the recipient has to
 * open this from their own inbox before anyone gets a session, which is what
 * proves they actually own the address (see signup/actions.ts startSignup()).
 */
export function signInLinkEmail(href: string): Rendered {
  return {
    subject: "Your Glam Site Studios sign-in link",
    html: layout(
      "Sign in to Glam Site Studios",
      "Use the button below to sign in. The link works once and expires soon.",
      "",
      { label: "Sign in", href },
      "If you didn't request this, you can ignore this email."
    ),
    text: `Sign in to Glam Site Studios\n\n${href}\n\nIf you didn't request this, you can ignore this email.`,
  };
}

/**
 * Sent instead of relying on Supabase Auth's own password-recovery email
 * (which needs SMTP configured by hand in the Supabase dashboard and is easy
 * to leave misconfigured — see docs/infrastructure.md). We generate the
 * recovery link ourselves (admin.auth.admin.generateLink) and send it
 * through the same Resend path as every other email, same as sign-up's
 * signInLinkEmail.
 */
export function passwordResetEmail(href: string): Rendered {
  return {
    subject: "Reset your Glam Site Studios password",
    html: layout(
      "Reset your password",
      "Use the button below to choose a new password. The link works once and expires soon.",
      "",
      { label: "Choose a new password", href },
      "If you didn't request this, you can ignore this email — your password won't change."
    ),
    text: `Reset your Glam Site Studios password\n\n${href}\n\nIf you didn't request this, you can ignore this email.`,
  };
}

// ---------------------------------------------------------------------------
// Booking templates
// ---------------------------------------------------------------------------

export type BookingEmailDetails = {
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  serviceName: string;
  /** Already formatted in the business's time zone, e.g. "Tuesday 4 November, 2:30pm". */
  when: string;
  staffName: string | null;
  priceText: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string;
  status: "pending" | "confirmed" | "cancelled";
  /** The client's private link to view or cancel. */
  manageUrl: string;
  cancellationNoticeHours: number;
};

type Rendered = { subject: string; html: string; text: string };

function rows(pairs: [string, string | null | undefined][]): { html: string; text: string } {
  const kept = pairs.filter((pair): pair is [string, string] => Boolean(pair[1]?.trim()));
  return {
    html: kept
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 16px 6px 0;color:#7a6f74;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#2b1631;">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`
      )
      .join(""),
    text: kept.map(([label, value]) => `${label}: ${value}`).join("\n"),
  };
}

function layout(heading: string, intro: string, table: string, button?: { label: string; href: string }, footer?: string): string {
  const action = button
    ? `<p style="margin:28px 0 8px;"><a href="${escapeHtml(button.href)}" style="display:inline-block;background:#2b1631;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;">${escapeHtml(button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#faf7f8;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:32px 20px;">
<div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #f0e6ea;">
<h1 style="margin:0 0 8px;font-size:22px;color:#2b1631;">${escapeHtml(heading)}</h1>
<p style="margin:0 0 20px;color:#4a3f45;line-height:1.5;">${intro}</p>
<table style="border-collapse:collapse;font-size:15px;">${table}</table>
${action}
${footer ? `<p style="margin:20px 0 0;color:#7a6f74;font-size:13px;line-height:1.5;">${footer}</p>` : ""}
</div>
<p style="margin:16px 0 0;text-align:center;color:#a99ca3;font-size:12px;">Sent by Glam Site Studios on behalf of the salon.</p>
</div></body></html>`;
}

function appointmentRows(d: BookingEmailDetails) {
  return rows([
    ["When", d.when],
    ["Service", d.serviceName],
    ["With", d.staffName],
    ["Price", d.priceText],
    ["Where", d.businessAddress],
  ]);
}

/** To the client, right after they book online (or the owner confirms a request). */
export function clientBookingEmail(d: BookingEmailDetails): Rendered {
  const pending = d.status === "pending";
  const first = d.clientName.split(" ")[0] || "there";
  const heading = pending ? "Booking request received" : "You're booked in";
  const intro = pending
    ? `Hi ${escapeHtml(first)}, thanks for your request with <strong>${escapeHtml(d.businessName)}</strong>. They'll confirm it shortly and you'll get another email when they do.`
    : `Hi ${escapeHtml(first)}, your appointment with <strong>${escapeHtml(d.businessName)}</strong> is confirmed.`;
  const table = appointmentRows(d);
  const policy =
    d.cancellationNoticeHours > 0
      ? `Need to cancel? Use the link above up to ${d.cancellationNoticeHours} hours before your appointment.`
      : "Need to cancel? Use the link above.";
  const call = d.businessPhone ? ` After that, call ${escapeHtml(d.businessPhone)}.` : "";
  return {
    subject: pending ? `Booking request: ${d.serviceName}, ${d.when}` : `Booked: ${d.serviceName}, ${d.when}`,
    html: layout(heading, intro, table.html, { label: "View or cancel booking", href: d.manageUrl }, policy + call),
    text: `${heading}\n\n${table.text}\n\nView or cancel: ${d.manageUrl}\n\n${policy}${d.businessPhone ? ` After that, call ${d.businessPhone}.` : ""}`,
  };
}

/** To the owner, when a client books online. */
export function ownerNewBookingEmail(d: BookingEmailDetails, dashboardUrl: string): Rendered {
  const pending = d.status === "pending";
  const table = rows([
    ["When", d.when],
    ["Service", d.serviceName],
    ["With", d.staffName ?? "Anyone"],
    ["Client", d.clientName],
    ["Email", d.clientEmail],
    ["Phone", d.clientPhone],
    ["Notes", d.clientNotes],
  ]);
  const heading = pending ? "New booking request" : "New booking";
  const intro = pending
    ? "A client has asked for an appointment. Confirm it in your dashboard so they know it's going ahead."
    : "A client has booked online. It's already in your appointments.";
  return {
    subject: `${heading}: ${d.clientName}, ${d.when}`,
    html: layout(heading, intro, table.html, { label: pending ? "Review request" : "Open appointments", href: dashboardUrl }),
    text: `${heading}\n\n${table.text}\n\n${dashboardUrl}`,
  };
}

/** To the client, when their appointment is cancelled (by them or the salon). */
export function clientCancelledEmail(d: BookingEmailDetails, byBusiness: boolean, bookAgainUrl: string): Rendered {
  const first = d.clientName.split(" ")[0] || "there";
  const intro = byBusiness
    ? `Hi ${escapeHtml(first)}, <strong>${escapeHtml(d.businessName)}</strong> has cancelled this appointment.${d.businessPhone ? ` Questions? Call ${escapeHtml(d.businessPhone)}.` : ""}`
    : `Hi ${escapeHtml(first)}, your appointment with <strong>${escapeHtml(d.businessName)}</strong> has been cancelled as you asked.`;
  const table = appointmentRows(d);
  return {
    subject: `Cancelled: ${d.serviceName}, ${d.when}`,
    html: layout("Appointment cancelled", intro, table.html, { label: "Book another time", href: bookAgainUrl }),
    text: `Appointment cancelled\n\n${table.text}\n\nBook another time: ${bookAgainUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Referral templates
// ---------------------------------------------------------------------------

/** To a referrer, once the friend they referred completes their first appointment. */
export function referralRewardEmail(
  businessName: string,
  referrerName: string,
  referredName: string,
  code: string,
  amountOffText: string,
  bookAgainUrl: string
): Rendered {
  const first = referrerName.split(" ")[0] || "there";
  const intro = `Hi ${escapeHtml(first)}, ${escapeHtml(referredName)} just had their first appointment with <strong>${escapeHtml(businessName)}</strong> thanks to you. Here's ${escapeHtml(amountOffText)} off your next visit.`;
  const table = `<tr><td style="padding:6px 16px 6px 0;color:#7a6f74;vertical-align:top;white-space:nowrap;">Your code</td><td style="padding:6px 0;color:#2b1631;font-weight:600;letter-spacing:0.5px;">${escapeHtml(code)}</td></tr>`;
  return {
    subject: `You earned ${amountOffText} off at ${businessName}`,
    html: layout("You earned a reward", intro, table, { label: "Book your next visit", href: bookAgainUrl }, "Enter this code at checkout. One-time use."),
    text: `You earned a reward\n\n${intro.replace(/<[^>]+>/g, "")}\n\nCode: ${code}\n\nBook: ${bookAgainUrl}`,
  };
}

/** To the owner, when a client cancels online. */
export function ownerClientCancelledEmail(d: BookingEmailDetails, dashboardUrl: string): Rendered {
  const table = rows([
    ["When", d.when],
    ["Service", d.serviceName],
    ["With", d.staffName],
    ["Client", d.clientName],
    ["Phone", d.clientPhone],
  ]);
  return {
    subject: `Cancelled by client: ${d.clientName}, ${d.when}`,
    html: layout("A client cancelled", "This time is free again and can be booked online.", table.html, {
      label: "Open appointments",
      href: dashboardUrl,
    }),
    text: `A client cancelled\n\n${table.text}\n\n${dashboardUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Platform referral ("Earn") templates
// ---------------------------------------------------------------------------

export type PlatformReferralDetails = {
  referrerBusinessName: string;
  referredBusinessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

/** To our support inbox, when an owner submits a new "Earn" referral. */
export function platformReferralStaffNotifyEmail(d: PlatformReferralDetails): Rendered {
  const table = rows([
    ["Referred by", d.referrerBusinessName],
    ["Business", d.referredBusinessName],
    ["Contact", d.contactName],
    ["Email", d.contactEmail],
    ["Phone", d.contactPhone],
  ]);
  return {
    subject: `Earn referral: ${d.referredBusinessName}`,
    html: layout(
      "New Earn referral",
      `<strong>${escapeHtml(d.referrerBusinessName)}</strong> referred a business. Reach out, then update its status in the admin.`,
      table.html
    ),
    text: `New Earn referral\n\n${table.text}`,
  };
}

// ---------------------------------------------------------------------------
// Connect payout templates
// ---------------------------------------------------------------------------

export type PayoutFailedDetails = {
  businessName: string;
  /** Already formatted, e.g. "£42.00". */
  amount: string;
  reason: string;
};

/** To the salon owner, when Stripe's payout to their bank bounces. */
export function payoutFailedEmail(d: PayoutFailedDetails, billingUrl: string): Rendered {
  const intro = `Stripe tried to pay out ${escapeHtml(d.amount)} to your bank account and it failed: ${escapeHtml(
    d.reason
  )}. Update your bank details to get paid.`;
  return {
    subject: "A payout to your bank failed",
    html: layout("A payout failed", intro, "", { label: "Fix in Billing", href: billingUrl }),
    text: `A payout failed\n\nStripe tried to pay out ${d.amount} to your bank account and it failed: ${d.reason}. Update your bank details to get paid.\n\n${billingUrl}`,
  };
}

/** To our support inbox, for visibility when a salon's payout bounces. */
export function payoutFailedStaffNotifyEmail(d: PayoutFailedDetails): Rendered {
  const table = rows([
    ["Business", d.businessName],
    ["Amount", d.amount],
    ["Reason", d.reason],
  ]);
  return {
    subject: `Payout failed: ${d.businessName}`,
    html: layout("Connect payout failed", "A salon's Stripe payout to their bank bounced.", table.html),
    text: `Connect payout failed\n\n${table.text}`,
  };
}

// ---------------------------------------------------------------------------
// Done-for-you lead templates
// ---------------------------------------------------------------------------

export type DoneForYouCallDetails = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  message: string;
  /** Already formatted in UK time, e.g. "Tuesday 4 November, 2:30pm". */
  when: string;
};

/** To our support inbox, when someone picks a done-for-you launch call time. */
export function doneForYouCallEmail(d: DoneForYouCallDetails): Rendered {
  const table = rows([
    ["When", d.when],
    ["Name", d.name],
    ["Business", d.businessName],
    ["Email", d.email],
    ["Phone", d.phone],
    ["Notes", d.message],
  ]);
  return {
    subject: `Done-for-you call booked: ${d.businessName}, ${d.when}`,
    html: layout(
      "Done-for-you call booked",
      "Someone picked a time for their launch call. Add it to the calendar and call them then.",
      table.html
    ),
    text: `Done-for-you call booked\n\n${table.text}`,
  };
}
