import { readFileSync } from "node:fs";

import { saveOnboarding } from "../lib/trainer.js";

function readJsonInput() {
  const raw = readFileSync(0, "utf8").trim();

  if (!raw) {
    throw new Error("No onboarding JSON provided on stdin.");
  }

  return JSON.parse(raw);
}

try {
  const payload = readJsonInput();
  const dashboard = saveOnboarding(payload);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        profile: dashboard.profile,
        reminders: dashboard.reminders
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("save-onboarding failed:", error.message);
  process.exit(1);
}
