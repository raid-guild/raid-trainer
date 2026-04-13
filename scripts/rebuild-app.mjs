import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const workspaceDir = process.cwd();
const dataDir = path.join(workspaceDir, "workspace", "data");
const statusPath = path.join(dataDir, "rebuild-status.json");
const logPath = path.join(dataDir, "rebuild.log");

mkdirSync(dataDir, { recursive: true });

function writeStatus(status) {
  writeFileSync(
    statusPath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        ...status
      },
      null,
      2
    )
  );
}

writeStatus({
  ok: true,
  state: "running",
  message: "Rebuild started."
});

const command = "npm run build && npx pm2 reload ecosystem.config.cjs --update-env";
const child = spawn("bash", ["-lc", command], {
  cwd: workspaceDir,
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";

child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});

child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

child.on("close", (code) => {
  writeFileSync(logPath, output, "utf8");

  writeStatus({
    ok: code === 0,
    state: code === 0 ? "succeeded" : "failed",
    message: code === 0 ? "Rebuild completed." : "Rebuild failed.",
    exitCode: code,
    logPath
  });
});

child.on("error", (error) => {
  writeFileSync(logPath, String(error), "utf8");

  writeStatus({
    ok: false,
    state: "failed",
    message: "Rebuild process failed to start.",
    error: String(error),
    logPath
  });
});
