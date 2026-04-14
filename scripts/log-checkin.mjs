import { readFileSync } from "node:fs";

import { logCheckIn } from "../lib/trainer.js";

function readJsonInput() {
  const raw = readFileSync(0, "utf8").trim();

  if (!raw) {
    throw new Error("No check-in JSON provided on stdin.");
  }

  return JSON.parse(raw);
}

try {
  const payload = readJsonInput();
  const dashboard = logCheckIn(payload);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        today: dashboard.today
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("log-checkin failed:", error.message);
  process.exit(1);
}
