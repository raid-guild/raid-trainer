import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  createSessionCookieValue,
  getAppPassword,
  getAuthCookieOptions
} from "../../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if ((payload?.password || "") !== getAppPassword()) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, createSessionCookieValue(), getAuthCookieOptions());

  return Response.json({ ok: true });
}
