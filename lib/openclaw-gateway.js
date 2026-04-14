import { randomUUID } from "node:crypto";

import WebSocket from "ws";

import { getOpenClawConfig } from "./openclaw.js";

const PROTOCOL_VERSION = 3;
const CONNECT_TIMEOUT_MS = 5_000;
const REQUEST_TIMEOUT_MS = 20_000;
const MAIN_WEBCHAT_SESSION_KEY = "agent:main:main";

function toWebSocketUrl(urlValue) {
  const parsed = new URL(urlValue);

  if (parsed.protocol === "http:") {
    parsed.protocol = "ws:";
  } else if (parsed.protocol === "https:") {
    parsed.protocol = "wss:";
  }

  return parsed.toString();
}

function createGatewayError(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  return error;
}

export function getOpenClawGatewayWsUrl() {
  if (process.env.OPENCLAW_GATEWAY_WS_URL) {
    return process.env.OPENCLAW_GATEWAY_WS_URL;
  }

  const { gatewayUrl } = getOpenClawConfig();
  return toWebSocketUrl(gatewayUrl);
}

export async function stageMainChatMessage(message, options = {}) {
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

  if (!gatewayToken) {
    throw createGatewayError("OPENCLAW_GATEWAY_TOKEN is not configured.");
  }

  const url = getOpenClawGatewayWsUrl();
  const idempotencyKey = options.idempotencyKey || randomUUID();

  return new Promise((resolve, reject) => {
    let settled = false;
    let connectRequestId = null;
    let chatRequestId = null;
    let ackPayload = null;

    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${gatewayToken}`
      },
      origin: options.origin
    });

    const connectTimer = setTimeout(() => {
      fail(createGatewayError("Gateway connect timed out.", { url }));
    }, CONNECT_TIMEOUT_MS);

    const requestTimer = setTimeout(() => {
      fail(
        createGatewayError("chat.send timed out.", {
          url,
          sessionKey: options.sessionKey || MAIN_WEBCHAT_SESSION_KEY
        })
      );
    }, REQUEST_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(connectTimer);
      clearTimeout(requestTimer);

      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close(1000, "coach-spike-complete");
      }
    }

    function succeed(payload) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(payload);
    }

    function fail(error) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    ws.on("error", (error) => {
      fail(createGatewayError(error.message, { url }));
    });

    ws.on("message", (raw) => {
      let frame;

      try {
        frame = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (frame?.type === "event" && frame.event === "connect.challenge") {
        connectRequestId = randomUUID();
        ws.send(
          JSON.stringify({
            type: "req",
            id: connectRequestId,
            method: "connect",
            params: {
              minProtocol: PROTOCOL_VERSION,
              maxProtocol: PROTOCOL_VERSION,
              client: {
                id: "openclaw-control-ui",
                version: "coach-spike-dashboard",
                platform: process.platform,
                mode: "webchat"
              },
              role: "operator",
              scopes: ["operator.admin"],
              auth: {
                token: gatewayToken
              }
            }
          })
        );
        return;
      }

      if (frame?.type === "res" && frame.id === connectRequestId) {
        if (frame.ok !== true) {
          fail(
            createGatewayError("Gateway connect failed.", {
              url,
              error: frame.error || null
            })
          );
          return;
        }

        chatRequestId = randomUUID();
        ws.send(
          JSON.stringify({
            type: "req",
            id: chatRequestId,
            method: "chat.send",
            params: {
              sessionKey: options.sessionKey || MAIN_WEBCHAT_SESSION_KEY,
              message,
              idempotencyKey
            }
          })
        );
        return;
      }

      if (frame?.type === "res" && frame.id === chatRequestId) {
        if (frame.ok !== true) {
          fail(
            createGatewayError("chat.send failed.", {
              url,
              error: frame.error || null
            })
          );
          return;
        }

        ackPayload = frame.payload || null;

        if (!ackPayload || ackPayload.status !== "accepted") {
          succeed({
            ok: true,
            url,
            sessionKey: options.sessionKey || MAIN_WEBCHAT_SESSION_KEY,
            idempotencyKey,
            ack: ackPayload
          });
        }

        return;
      }

      if (
        frame?.type === "event" &&
        frame.event === "chat" &&
        ackPayload?.runId &&
        frame.payload?.runId === ackPayload.runId
      ) {
        succeed({
          ok: true,
          url,
          sessionKey: options.sessionKey || MAIN_WEBCHAT_SESSION_KEY,
          idempotencyKey,
          ack: ackPayload,
          event: frame.payload || null
        });
      }
    });

    ws.on("close", (code, reason) => {
      if (!settled) {
        fail(
          createGatewayError("Gateway socket closed before chat staging completed.", {
            url,
            code,
            reason: reason?.toString() || ""
          })
        );
      }
    });
  });
}

export { MAIN_WEBCHAT_SESSION_KEY };
