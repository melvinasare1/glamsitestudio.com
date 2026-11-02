import { NextRequest, NextResponse } from "next/server";
import { cancelByToken } from "@/lib/booking";

/** POST /api/booking/cancel { token }: the client cancels from their private link. */
export async function POST(req: NextRequest) {
  let token = "";
  try {
    const body = (await req.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await cancelByToken(token);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
