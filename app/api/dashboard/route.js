import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, isAuthorizedRequest } from "../../../lib/auth";
import { getDashboardData } from "../../../lib/trainer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthorizedRequest(request, authCookie)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return Response.json({ dashboard: getDashboardData() });
}
