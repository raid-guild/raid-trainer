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

## Current routes

- `GET /app/login`
- `GET /app/api/dashboard`
- `GET /app/api/avatar`
- `GET /app/api/status`
- `POST /app/api/responses`
- `POST /app/api/auth/login`
- `POST /app/api/auth/logout`
- `POST /app/api/admin/rebuild`
- `GET /app/api/admin/rebuild/status`

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
- unauthenticated requests to `/app` redirect to `/app/login`
- unauthenticated requests to protected API routes return `401`

Protected routes:

- `GET /app`
- `GET /app/api/dashboard`
- `GET /app/api/status`
- `POST /app/api/responses`
- `POST /app/api/admin/rebuild`
- `GET /app/api/admin/rebuild/status`

This is intentionally lightweight starter auth, not a full user system. Change the default password in any real deployment.

## Rebuild hook

Pinata does not automatically rebuild the Next app just because files changed in the workspace. PM2 will restart processes, but it will not regenerate the Next production build for you.

The app now includes an authenticated rebuild hook:

- `POST /app/api/admin/rebuild`
- `GET /app/api/admin/rebuild/status`

What it does:

- runs `npm run build`
- then runs `pm2 reload ecosystem.config.cjs --update-env`
- writes status to `workspace/data/rebuild-status.json`
- writes logs to `workspace/data/rebuild.log`

This is better than a cron for normal app edits because rebuilds happen on demand rather than on a fixed schedule. If you still want automation, a Pinata Task can call this route or prompt the agent to trigger it after code changes.

## Next implementation steps

- replace seeded rows with agent-written records from chat
- add write routes for onboarding updates, daily check-ins, workout logs, and plan refreshes
- write reminder preferences from onboarding and later chat updates into `reminder_preferences`
- remove or replace the starter avatar asset if you want a trainer-specific brand
- add reminder preferences and message delivery later if you connect Telegram, Discord, email, or SMS

## OpenClaw proxy

The app includes a server-side proxy at `POST /app/api/responses` that forwards requests to the protected OpenClaw gateway.

Expected environment variables:

- `APP_PASSWORD`: dashboard password, defaults to `changeme`
- `OPENCLAW_GATEWAY_TOKEN`: required bearer token for the gateway
- `OPENCLAW_GATEWAY_URL`: optional override, defaults to `http://127.0.0.1:18789`

Example request:

```bash
curl -X POST http://localhost:3011/app/api/responses \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw","input":"Start a new onboarding session for a personal trainer app."}'
```

The route forwards the JSON body to `${OPENCLAW_GATEWAY_URL}/v1/responses` and returns the upstream status and body. Keep the token in environment or Pinata secrets, not in source.

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
