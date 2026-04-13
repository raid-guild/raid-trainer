import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, isAuthenticatedValue } from "../../../lib/auth";
import { getOpenClawConfigStatus } from "../../../lib/openclaw";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthenticatedValue(authCookie)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return Response.json({
    ok: true,
    route: "/app",
    openclaw: getOpenClawConfigStatus()
  });
}
