import { createServer } from "node:http";
import next from "next";

import { getBuildInfo } from "./lib/build-info.js";
import { getOpenClawConfigStatus } from "./lib/openclaw.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    if (req.url === "/health" || req.url === "/app/health") {
      const build = getBuildInfo();

      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          ok: true,
          route: "/app",
          openclaw: getOpenClawConfigStatus(),
          build
        })
      );
      return;
    }

    handle(req, res);
  }).listen(port, host, () => {
    const openclaw = getOpenClawConfigStatus();
    const build = getBuildInfo();

    console.log(`full-stack-agent-starter listening on ${host}:${port}`);
    console.log(
      `openclaw config: url=${openclaw.gatewayUrl} token=${openclaw.hasGatewayToken ? "present" : "missing"}`
    );
    console.log(`next build: ${build.hasBuild ? build.buildId : "missing"}`);
  });
});
