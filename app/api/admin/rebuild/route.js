import { cookies } from "next/headers";
import { spawn } from "node:child_process";
import path from "node:path";

import { AUTH_COOKIE_NAME, isAuthenticatedValue } from "../../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthenticatedValue(authCookie)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const scriptPath = path.join(process.cwd(), "scripts", "rebuild-app.mjs");

  const child = spawn(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore"
  });

  child.unref();

  return Response.json({
    ok: true,
    state: "queued",
    message: "Rebuild queued."
  });
}
