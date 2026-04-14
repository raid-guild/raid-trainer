import { createWriteStream, mkdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const workspaceDir = process.cwd();
const dataDir = path.join(workspaceDir, "workspace", "data");
const statusPath = path.join(dataDir, "rebuild-status.json");
const tempStatusPath = path.join(dataDir, "rebuild-status.json.tmp");
const logPath = path.join(dataDir, "rebuild.log");

mkdirSync(dataDir, { recursive: true });

function writeStatus(status) {
  writeFileSync(
    tempStatusPath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        ...status
      },
      null,
      2
    )
  );
  renameSync(tempStatusPath, statusPath);
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

const logStream = createWriteStream(logPath, { flags: "w" });

child.stdout.on("data", (chunk) => {
  logStream.write(chunk);
});

child.stderr.on("data", (chunk) => {
  logStream.write(chunk);
});

child.on("close", (code) => {
  logStream.end();

  writeStatus({
    ok: code === 0,
    state: code === 0 ? "succeeded" : "failed",
    message: code === 0 ? "Rebuild completed." : "Rebuild failed.",
    exitCode: code,
    logPath
  });
});

child.on("error", (error) => {
  logStream.write(String(error));
  logStream.end();

  writeStatus({
    ok: false,
    state: "failed",
    message: "Rebuild process failed to start.",
    error: String(error),
    logPath
  });
});
