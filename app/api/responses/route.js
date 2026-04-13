import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, isAuthenticatedValue } from "../../../lib/auth";
import { getOpenClawConfig } from "../../../lib/openclaw";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!isAuthenticatedValue(authCookie)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { gatewayUrl, hasGatewayToken } = getOpenClawConfig();
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

  if (!hasGatewayToken || !gatewayToken) {
    return Response.json(
      { error: "OPENCLAW_GATEWAY_TOKEN is not configured." },
      { status: 500 }
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const forwardHeaders = {
      "content-type": "application/json",
      authorization: `Bearer ${gatewayToken}`
    };

    const openClawAgentId = request.headers.get("x-openclaw-agent-id");
    const openClawSessionKey = request.headers.get("x-openclaw-session-key");
    const openClawModel = request.headers.get("x-openclaw-model");
    const openClawMessageChannel = request.headers.get("x-openclaw-message-channel");

    if (openClawAgentId) {
      forwardHeaders["x-openclaw-agent-id"] = openClawAgentId;
    }

    if (openClawSessionKey) {
      forwardHeaders["x-openclaw-session-key"] = openClawSessionKey;
    }

    if (openClawModel) {
      forwardHeaders["x-openclaw-model"] = openClawModel;
    }

    if (openClawMessageChannel) {
      forwardHeaders["x-openclaw-message-channel"] = openClawMessageChannel;
    }

    const response = await fetch(`${gatewayUrl}/v1/responses`, {
      method: "POST",
      headers: forwardHeaders,
      cache: "no-store",
      body: JSON.stringify(payload)
    });

    const bodyText = await response.text();
    const contentType = response.headers.get("content-type") || "text/plain; charset=utf-8";

    try {
      return Response.json(JSON.parse(bodyText), { status: response.status });
    } catch {
      return new Response(bodyText, {
        status: response.status,
        headers: {
          "content-type": contentType
        }
      });
    }
  } catch (error) {
    console.error("/app/api/responses proxy error", error);

    return Response.json(
      { error: "Failed to reach OpenClaw gateway." },
      { status: 502 }
    );
  }
}
