import { cookies } from "next/headers";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { AUTH_COOKIE_NAME, isAuthorizedRequest } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthorizedRequest(request, authCookie)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const statusPath = path.join(process.cwd(), "workspace", "data", "rebuild-status.json");

  if (!existsSync(statusPath)) {
    return Response.json({
      ok: true,
      state: "idle",
      message: "No rebuild has been run yet."
    });
  }

  try {
    const status = JSON.parse(readFileSync(statusPath, "utf8"));
    return Response.json(status);
  } catch {
    return Response.json(
      { ok: false, state: "unknown", message: "Unable to read rebuild status." },
      { status: 500 }
    );
  }
}
