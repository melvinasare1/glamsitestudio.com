import { NextRequest, NextResponse } from "next/server";
import { requestIp, tooManyRequests, withinRateLimit } from "@glamsite/shared/rate-limit";
import { getSlots, isUuid, loadBookingSite } from "@/lib/booking";

export const dynamic = "force-dynamic";

/** GET /api/booking/slots?site=bella&service=…&staff=…|any&from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(req: NextRequest) {
  const ip = requestIp(req.headers);
  // Higher budget than the write endpoints: legitimately hit once per date
  // page the client clicks through while choosing a time.
  if (!(await withinRateLimit(`booking:slots:${ip}`, 60, 60))) {
    return tooManyRequests();
  }

  const params = req.nextUrl.searchParams;
  const slug = params.get("site")?.trim() ?? "";
  const serviceId = params.get("service")?.trim() ?? "";
  const staffParam = params.get("staff")?.trim() ?? "any";
  const from = params.get("from")?.trim() ?? "";
  const to = params.get("to")?.trim() ?? from;

  if (!slug || !isUuid(serviceId)) return NextResponse.json({ error: "Choose a service." }, { status: 400 });
  const staffId = staffParam === "any" || !staffParam ? null : staffParam;
  if (staffId && !isUuid(staffId)) return NextResponse.json({ error: "Unknown team member." }, { status: 400 });

  const loaded = await loadBookingSite(slug);
  if (!loaded.ok) {
    return NextResponse.json(
      { error: "Online booking isn't available for this site." },
      { status: loaded.reason === "unavailable" ? 503 : 404 }
    );
  }

  const result = await getSlots(loaded.site, serviceId, staffId, from, to);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(
    { slots: result.slots, first: result.first, last: result.last },
    { headers: { "Cache-Control": "no-store" } }
  );
}
