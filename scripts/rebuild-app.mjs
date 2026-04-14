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

const logStream = createWriteStream(logPath, { flags: "w" });

function runCommand(label, command, { timeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    logStream.write(`=== ${label} ===\n`);

    const child = spawn("bash", ["-lc", command], {
      cwd: workspaceDir,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let timeoutId = null;

    if (timeoutMs) {
      timeoutId = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }

    child.stdout.on("data", (chunk) => {
      logStream.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      logStream.write(chunk);
    });

    child.on("error", (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      reject(error);
    });

    child.on("close", (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code}`));
    });
  });
}

async function main() {
  try {
    await runCommand("next build", "npm run build", { timeoutMs: 10 * 60 * 1000 });

    writeStatus({
      ok: true,
      state: "restarting",
      message: "Build completed. Requesting PM2 restart."
    });

    await runCommand(
      "pm2 restart",
      "npx pm2 restart full-stack-agent-starter --update-env",
      { timeoutMs: 30 * 1000 }
    );

    writeStatus({
      ok: true,
      state: "succeeded",
      message: "Rebuild completed and PM2 restart requested.",
      logPath
    });
    logStream.end();
  } catch (error) {
    logStream.write(`\nERROR: ${String(error.message || error)}\n`);
    logStream.end();

    writeStatus({
      ok: false,
      state: "failed",
      message: "Rebuild failed.",
      error: String(error.message || error),
      logPath
    });
    process.exit(1);
  }
}

main();
