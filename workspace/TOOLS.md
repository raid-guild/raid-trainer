# Tools

Document runtime details, external services, and operational constraints here.

Current runtime:

- Node.js app started with PM2 via `npm start`
- Public route exposed at `/app`
- Health check exposed at `/app/health`
- Next.js App Router for UI and API routes
- SQLite persistence stored under `workspace/data`
- Canonical trainer database stored at `workspace/data/trainer.db`
- Workspace-served assets available through API routes
- OpenClaw gateway expected on `OPENCLAW_GATEWAY_URL` or local default `http://127.0.0.1:18789`
- Gateway access token provided through `OPENCLAW_GATEWAY_TOKEN`
- Server-side proxy route exposed at `POST /app/api/responses`

Canonical persistence commands:

- `npm run trainer:onboarding`
  Expects onboarding JSON on stdin and upserts profile plus reminder preferences.
- `npm run trainer:checkin`
  Expects check-in JSON on stdin and inserts a historical check-in event plus updates the daily snapshot.

Persistence expectation:

- The agent should treat these commands as required for onboarding completion and daily check-ins.
- The dashboard depends on these writes. If they are skipped, the user experience degrades because `/app` will not reflect the conversation accurately.

Suggested usage:

```bash
cat <<'EOF' | npm run trainer:onboarding
{
  "athleteName": "Alex",
  "goal": "Lean muscle + consistency",
  "scheduleSummary": "Early mornings, 45-60 min windows",
  "setupSummary": "Commercial gym with hotel dumbbells as backup",
  "motivationStyle": "Cheeky accountability, not drill-sergeant",
  "reminders": {
    "enabled": true,
    "timezone": "America/Denver",
    "cadence": "daily",
    "preferredWindowLabel": "Weekday mornings",
    "preferredTimeLocal": "07:15",
    "daysOfWeek": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "tone": "cheeky",
    "channel": "in-app"
  }
}
EOF
```

```bash
cat <<'EOF' | npm run trainer:checkin
{
  "eventDate": "2026-04-14",
  "energyLevel": 7,
  "sleepHours": 7.5,
  "mood": "Focused",
  "soreness": "Mild legs",
  "workoutStatus": "planned",
  "nutritionStatus": "on-track",
  "summary": "Ready to train, legs slightly heavy from the last lower session.",
  "workoutLabel": "Upper Push + Pull",
  "workoutTime": "6:30 AM",
  "checkInStatus": "complete",
  "readinessScore": 74,
  "proteinGrams": 155,
  "proteinTargetGrams": 180,
  "streakDays": 13,
  "coachPrompt": "Push the main lifts, keep accessory volume honest, and stop one rep before form slips."
}
EOF
```
