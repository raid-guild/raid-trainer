import fs from "node:fs";
import path from "node:path";

export function getBuildInfo() {
  const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");

  if (!fs.existsSync(buildIdPath)) {
    return {
      hasBuild: false,
      buildId: null
    };
  }

  return {
    hasBuild: true,
    buildId: fs.readFileSync(buildIdPath, "utf8").trim() || null
  };
}
