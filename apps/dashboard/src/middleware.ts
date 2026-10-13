import { type NextRequest } from "next/server";
import { updateSession } from "@glamsite/shared/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/auth/:path*",
  ],
};
