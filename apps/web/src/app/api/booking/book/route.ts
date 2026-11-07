import { NextRequest, NextResponse } from "next/server";
import { requestIp, tooManyRequests, withinRateLimit } from "@glamsite/shared/rate-limit";
import { createBooking, loadBookingSite, parseBookingRequest } from "@/lib/booking";

/** POST /api/booking/book: a client books an appointment on a live site. */
export async function POST(req: NextRequest) {
  const ip = requestIp(req.headers);
  if (!(await withinRateLimit(`booking:book:${ip}`, 60, 8))) {
    return tooManyRequests("Too many booking attempts. Please wait a moment and try again.");
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseBookingRequest(raw);
  if (!parsed.ok) {
    // Bots get a quiet success so they don't retry.
    return parsed.bot
      ? NextResponse.json({ ok: true }, { status: 201 })
      : NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const loaded = await loadBookingSite(parsed.data.slug);
  if (!loaded.ok) {
    return NextResponse.json(
      { error: "Online booking isn't available for this site." },
      { status: loaded.reason === "unavailable" ? 503 : 404 }
    );
  }

  const outcome = await createBooking(loaded.site, parsed.data);
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error, code: outcome.code }, { status: outcome.status });
  }
  if ("checkoutUrl" in outcome) {
    return NextResponse.json({ ok: true, checkoutUrl: outcome.checkoutUrl }, { status: 200 });
  }
  return NextResponse.json({ ok: true, token: outcome.token, status: outcome.status }, { status: 201 });
}
