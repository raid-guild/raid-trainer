# Coach Spike Dashboard

This repo is a chat-first personal trainer app for the Pinata Agents hosting platform.

It gives you:

- a valid `manifest.json` with one public hosted route
- a Next.js app mounted at `/app`
- a SQLite-backed trainer dashboard data model using App Router routes
- a workspace-served avatar asset exposed through the API
- a PM2-managed runtime so the hosted app can restart without turning the agent into its own watchdog
- a `workspace/` folder with the coaching identity and behavior docs

The product split is intentional:

- the main `/chat` session is the primary interaction surface for onboarding, daily updates, and plan changes
- `/app` is a read-only dashboard for progress, current plan, and recent coaching context

## Project structure

- `manifest.json` defines the Pinata agent metadata, lifecycle scripts, and `/app` route
- `app/` contains the App Router UI plus `app/api/*` route handlers
- `lib/trainer.js` manages the trainer SQLite file at `workspace/data/trainer.db`
- `server.js` runs a tiny custom Next server and exposes a health endpoint
- `ecosystem.config.cjs` tells PM2 how to run the app
- `workspace/` holds the editable coaching identity and behavior docs

## Tailwind note

This template uses Tailwind v4 with explicit `@source` directives in `app/globals.css`.

That is intentional. On Pinata-hosted template deploys, the platform can inject a restrictive `.gitignore` that interferes with Tailwind's automatic source detection. To avoid missing production CSS, this repo uses:

```css
@import "tailwindcss" source(none);
```

and then explicitly lists the folders Tailwind should scan.

If you add Tailwind classes in new directories later, you must also add those directories to the `@source` list in `app/globals.css`, for example `src/`, `features/`, or any MDX content folders.

## Current routes

- `GET /app/api/dashboard`
- `GET /app/api/avatar`
- `POST /app/api/chat-stage`
- `GET /app/api/status`
- `POST /app/api/responses`
- `POST /app/api/auth/login`
- `POST /app/api/auth/logout`
- `POST /app/api/admin/rebuild`
- `GET /app/api/admin/rebuild/status`
- `GET /app/api/admin/rebuild/log`

## Current data model

- `profile`
- `plan_blocks`
- `daily_snapshots`
- `weekly_summaries`
- `activity_entries`
- `nutrition_trends`
- `coach_notes`
- `reminder_preferences`

The database seeds a starter state on first run so the dashboard renders immediately.

## Lightweight auth

The dashboard now uses simple password auth backed by an environment variable.

- `APP_PASSWORD`: optional, defaults to `changeme`
- `/app` always renders a client shell, and the dashboard unlocks after a successful password check
- unauthenticated requests to protected API routes return `401`

Protected routes:

- `GET /app`
- `GET /app/api/dashboard`
- `GET /app/api/status`
- `POST /app/api/chat-stage`
- `POST /app/api/responses`
- `POST /app/api/admin/rebuild`
- `GET /app/api/admin/rebuild/status`

This is intentionally lightweight starter auth, not a full user system. Change the default password in any real deployment.

For manual admin calls, protected API routes also accept the direct header:

- `x-app-password: <APP_PASSWORD>`

This is useful for rebuild and status checks when cookie-based auth is unreliable through the hosted proxy.

The dashboard itself now uses `x-app-password` for client-side API requests, which avoids relying on hosted cookie behavior.

## Rebuild hook

Pinata does not automatically rebuild the Next app just because files changed in the workspace. PM2 will restart processes, but it will not regenerate the Next production build for you.

The app now includes an authenticated rebuild hook:

- `POST /app/api/admin/rebuild`
- `GET /app/api/admin/rebuild/status`
- `GET /app/api/admin/rebuild/log`

What it does:

- runs `npm run build`
- then runs `npx pm2 restart full-stack-agent-starter --update-env`
- writes status to `workspace/data/rebuild-status.json`
- writes logs to `workspace/data/rebuild.log`

This is better than a cron for normal app edits because rebuilds happen on demand rather than on a fixed schedule. If you still want automation, a Pinata Task can call this route or prompt the agent to trigger it after code changes.

Rebuild debugging:

- rebuild status writes are now atomic to avoid partial JSON reads
- `GET /app/api/admin/rebuild/log` returns the current rebuild log
- rebuild success is reported after the build completes and the PM2 restart request succeeds

Startup behavior:

- `npm start` now runs a fresh `next build` before launching PM2
- `/app/health` includes the current Next `BUILD_ID`

This makes it easier to confirm whether the hosted app actually booted from a fresh production build.

## Next implementation steps

- replace seeded rows with agent-written records from chat
- add write routes for onboarding updates, daily check-ins, workout logs, and plan refreshes
- write reminder preferences from onboarding and later chat updates into `reminder_preferences`
- remove or replace the starter avatar asset if you want a trainer-specific brand
- add reminder preferences and message delivery later if you connect Telegram, Discord, email, or SMS

## OpenClaw gateway

The app includes two server-side gateway routes:

- `POST /app/api/chat-stage`
  Stages a message into the live main webchat session over the OpenClaw Gateway WebSocket using `chat.send`.
- `POST /app/api/responses`
  Forwards a raw Responses API request to the protected OpenClaw gateway HTTP endpoint.

Expected environment variables:

- `APP_PASSWORD`: dashboard password, defaults to `changeme`
- `OPENCLAW_GATEWAY_TOKEN`: required bearer token for the gateway
- `OPENCLAW_GATEWAY_URL`: optional override, defaults to `http://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_WS_URL`: optional override for the gateway WebSocket URL; if unset, the app derives it from `OPENCLAW_GATEWAY_URL`

Example chat-stage request:

```bash
curl -X POST http://localhost:3011/app/api/chat-stage \
  -H "Content-Type: application/json" \
  -H "x-app-password: changeme" \
  -d '{"message":"The user opened the Coach Spike dashboard. Start with a concise coaching check-in and ask for today'\''s update."}'
```

`/app/api/chat-stage` connects to the gateway over WebSocket, completes the gateway handshake, then sends `chat.send` into the live main webchat session key `agent:main:main` so the user lands in the real main chat flow.

Example Responses proxy request:

```bash
curl -X POST http://localhost:3011/app/api/responses \
  -H "Content-Type: application/json" \
  -H "x-app-password: changeme" \
  -d '{"model":"openclaw","input":"Start a new onboarding session for a personal trainer app."}'
```

`/app/api/responses` forwards the JSON body to `${OPENCLAW_GATEWAY_URL}/v1/responses` and returns the upstream status and body. Keep the token in environment or Pinata secrets, not in source.

Config checks:

- `GET /app/api/status`
- `GET /app/health`

Both return whether the gateway token is configured, without exposing the token value.

## Local usage

```bash
npm install
npm run build
npm start
```

Open `http://localhost:3000/app`.

If you do not set `APP_PASSWORD`, the login password is `changeme`.

If you need a different local port:

```bash
APP_PASSWORD=changeme PORT=3011 npm run build && APP_PASSWORD=changeme PORT=3011 npm start
```

For local daemon mode:

```bash
PORT=3011 npm run start:daemon
```

## Pinata hosting notes

The manifest is configured so Pinata can:

- install dependencies and run `next build`
- run `npm start` on agent boot through `pm2-runtime`
- expose port `3000` at `/app`

If you replace the tutorial with another frontend or API shape, keep the server bound to `0.0.0.0` and make sure it can serve behind the `/app` path prefix.
