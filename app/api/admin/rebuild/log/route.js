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

  const logPath = path.join(process.cwd(), "workspace", "data", "rebuild.log");

  if (!existsSync(logPath)) {
    return new Response("No rebuild log yet.\n", {
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  return new Response(readFileSync(logPath, "utf8"), {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
