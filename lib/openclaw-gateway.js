import crypto, { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import WebSocket from "ws";

import { getOpenClawConfig } from "./openclaw.js";

const PROTOCOL_VERSION = 3;
const CONNECT_TIMEOUT_MS = 5_000;
const REQUEST_TIMEOUT_MS = 20_000;
const MAIN_WEBCHAT_SESSION_KEY = "agent:main:main";
const DEFAULT_CLIENT_ID = "gateway-client";
const DEFAULT_CLIENT_MODE = "backend";
const DEFAULT_CLIENT_VERSION = "coach-spike-dashboard";
const DEFAULT_ROLE = "operator";
const DEFAULT_SCOPES = ["operator.admin"];
const DEFAULT_DEVICE_FAMILY = "server";
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

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

function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

function derivePublicKeyRaw(publicKeyPem) {
  const key = crypto.createPublicKey(publicKeyPem);
  const spki = key.export({ type: "spki", format: "der" });

  if (
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
  ) {
    return spki.subarray(ED25519_SPKI_PREFIX.length);
  }

  return spki;
}

function signDevicePayload(privateKeyPem, payload) {
  const key = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(null, Buffer.from(payload, "utf8"), key);
  return base64UrlEncode(signature);
}

function buildDeviceAuthPayloadV3({
  deviceId,
  clientId,
  clientMode,
  role,
  scopes,
  signedAtMs,
  token,
  nonce,
  platform,
  deviceFamily
}) {
  return [
    "v3",
    deviceId,
    clientId,
    clientMode,
    role,
    scopes.join(","),
    String(signedAtMs),
    token || "",
    nonce,
    (platform || "").trim(),
    (deviceFamily || "").trim()
  ].join("|");
}

function getOpenClawHome() {
  return process.env.OPENCLAW_HOME || path.join(os.homedir(), ".openclaw");
}

function resolveDeviceIdentity() {
  const configuredPrivateKey = firstNonEmptyString(
    process.env.OPENCLAW_DEVICE_PRIVATE_KEY_PEM,
    process.env.OPENCLAW_GATEWAY_DEVICE_PRIVATE_KEY_PEM
  );

  if (configuredPrivateKey) {
    const privateKey = crypto.createPrivateKey(configuredPrivateKey);
    const publicKeyPem = crypto
      .createPublicKey(privateKey)
      .export({ type: "spki", format: "pem" })
      .toString();
    const raw = derivePublicKeyRaw(publicKeyPem);

    return {
      deviceId:
        firstNonEmptyString(
          process.env.OPENCLAW_DEVICE_ID,
          process.env.OPENCLAW_GATEWAY_DEVICE_ID
        ) || crypto.createHash("sha256").update(raw).digest("hex"),
      publicKeyRawBase64Url:
        firstNonEmptyString(
          process.env.OPENCLAW_DEVICE_PUBLIC_KEY,
          process.env.OPENCLAW_GATEWAY_DEVICE_PUBLIC_KEY
        ) || base64UrlEncode(raw),
      privateKeyPem: configuredPrivateKey
    };
  }

  const devicePath = firstNonEmptyString(
    process.env.OPENCLAW_DEVICE_JSON_PATH,
    process.env.OPENCLAW_GATEWAY_DEVICE_JSON_PATH
  ) || path.join(getOpenClawHome(), "identity", "device.json");
  const deviceJson = readJsonIfPresent(devicePath);

  if (!deviceJson) {
    throw createGatewayError("Unable to load OpenClaw device identity.", {
      devicePath
    });
  }

  const privateKeyPem = firstNonEmptyString(
    deviceJson.privateKeyPem,
    deviceJson.privateKey,
    deviceJson.private_key,
    deviceJson.keys?.privateKeyPem,
    deviceJson.keys?.privateKey,
    deviceJson.keys?.private_key
  );

  if (!privateKeyPem) {
    throw createGatewayError("OpenClaw device identity is missing a private key.", {
      devicePath
    });
  }

  const publicKeyPem = crypto
    .createPublicKey(crypto.createPrivateKey(privateKeyPem))
    .export({ type: "spki", format: "pem" })
    .toString();
  const raw = derivePublicKeyRaw(publicKeyPem);

  return {
    deviceId:
      firstNonEmptyString(
        deviceJson.deviceId,
        deviceJson.device_id,
        deviceJson.id
      ) || crypto.createHash("sha256").update(raw).digest("hex"),
    publicKeyRawBase64Url:
      firstNonEmptyString(
        deviceJson.publicKey,
        deviceJson.public_key,
        deviceJson.publicKeyRawBase64Url,
        deviceJson.public_key_raw_base64url
      ) || base64UrlEncode(raw),
    privateKeyPem
  };
}

function resolvePairedDeviceToken(deviceId) {
  const configuredToken = firstNonEmptyString(
    process.env.OPENCLAW_DEVICE_TOKEN,
    process.env.OPENCLAW_GATEWAY_DEVICE_TOKEN
  );

  if (configuredToken) {
    return configuredToken;
  }

  const pairedPath = firstNonEmptyString(
    process.env.OPENCLAW_PAIRED_JSON_PATH,
    process.env.OPENCLAW_GATEWAY_PAIRED_JSON_PATH
  ) || path.join(getOpenClawHome(), "devices", "paired.json");
  const pairedJson = readJsonIfPresent(pairedPath);

  if (!pairedJson) {
    throw createGatewayError("Unable to load OpenClaw paired device metadata.", {
      pairedPath
    });
  }

  const candidates = Array.isArray(pairedJson)
    ? pairedJson
    : [
        ...(Array.isArray(pairedJson.paired) ? pairedJson.paired : []),
        ...(Array.isArray(pairedJson.devices) ? pairedJson.devices : []),
        ...(Array.isArray(pairedJson.items) ? pairedJson.items : []),
        pairedJson
      ];

  const matching =
    candidates.find((item) => {
      const itemDeviceId = firstNonEmptyString(
        item?.deviceId,
        item?.device_id,
        item?.id
      );
      return itemDeviceId && itemDeviceId === deviceId;
    }) || candidates[0];

  const deviceToken = firstNonEmptyString(
    matching?.deviceToken,
    matching?.device_token,
    matching?.token
  );

  if (!deviceToken) {
    throw createGatewayError("OpenClaw paired device metadata is missing deviceToken.", {
      pairedPath,
      deviceId
    });
  }

  return deviceToken;
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

  const deviceIdentity = resolveDeviceIdentity();
  const deviceToken = resolvePairedDeviceToken(deviceIdentity.deviceId);
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
      origin: options.origin,
      maxPayload: 25 * 1024 * 1024
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

      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
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
        const nonce = firstNonEmptyString(frame.payload?.nonce);

        if (!nonce) {
          fail(createGatewayError("Gateway challenge did not include a nonce.", { url }));
          return;
        }

        const clientId = DEFAULT_CLIENT_ID;
        const clientMode = DEFAULT_CLIENT_MODE;
        const role = DEFAULT_ROLE;
        const scopes = DEFAULT_SCOPES;
        const signedAtMs = Date.now();
        const payload = buildDeviceAuthPayloadV3({
          deviceId: deviceIdentity.deviceId,
          clientId,
          clientMode,
          role,
          scopes,
          signedAtMs,
          token: gatewayToken,
          nonce,
          platform: process.platform,
          deviceFamily: DEFAULT_DEVICE_FAMILY
        });

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
                id: clientId,
                version: DEFAULT_CLIENT_VERSION,
                platform: process.platform,
                mode: clientMode,
                deviceFamily: DEFAULT_DEVICE_FAMILY
              },
              role,
              scopes,
              auth: {
                token: gatewayToken,
                deviceToken
              },
              device: {
                id: deviceIdentity.deviceId,
                publicKey: deviceIdentity.publicKeyRawBase64Url,
                signature: signDevicePayload(deviceIdentity.privateKeyPem, payload),
                signedAt: signedAtMs,
                nonce
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
