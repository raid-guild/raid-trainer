import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const assetPath = path.join(process.cwd(), "workspace", "assets", "raidguild-agent-avatar.svg");

export async function GET() {
  try {
    const file = await fs.readFile(assetPath);
    return new Response(file, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  } catch {
    return Response.json({ error: "Avatar not found." }, { status: 404 });
  }
}
