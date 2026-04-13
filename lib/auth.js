import { createHash, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "coach_spike_auth";

export function getAppPassword() {
  return process.env.APP_PASSWORD || "changeme";
}

function getSessionDigest() {
  return createHash("sha256").update(`coach-spike:${getAppPassword()}`).digest("hex");
}

export function createSessionCookieValue() {
  return getSessionDigest();
}

export function isAuthenticatedValue(value) {
  if (!value) {
    return false;
  }

  const expected = Buffer.from(getSessionDigest());
  const provided = Buffer.from(value);

  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  };
}
