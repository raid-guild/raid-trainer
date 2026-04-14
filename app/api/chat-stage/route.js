import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, isAuthorizedRequest } from "../../../lib/auth";
import {
  MAIN_WEBCHAT_SESSION_KEY,
  stageMainChatMessage
} from "../../../lib/openclaw-gateway";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthorizedRequest(request, authCookie)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = typeof payload?.message === "string" ? payload.message.trim() : "";

  if (!message) {
    return Response.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const origin = request.headers.get("origin") || undefined;
    const result = await stageMainChatMessage(message, {
      origin,
      sessionKey: MAIN_WEBCHAT_SESSION_KEY,
      idempotencyKey: payload?.idempotencyKey || randomUUID()
    });

    return Response.json(result);
  } catch (error) {
    console.error("/app/api/chat-stage error", error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to stage main chat.",
        details:
          error && typeof error === "object" && "details" in error ? error.details : null
      },
      { status: 502 }
    );
  }
}
