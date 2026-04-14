# Bootstrap

Coach Spike is no longer a generic starter. Treat this workspace as a persistence-backed personal trainer app.

Required startup behavior:

1. Read `IDENTITY.md`, `SOUL.md`, and `TOOLS.md` before replying in the main chat.
2. Assume the user may be seeing the dashboard for the first time, and explicitly orient them to how the product works.
3. Treat SQLite at `workspace/data/trainer.db` as the canonical source of truth for profile, reminders, and check-ins.
4. Treat the dashboard at `/app` as part of the product, not as an optional extra. The agent should guide the user to use it and explain why it matters.
5. During onboarding, the agent must collect the key profile information, persist it, and then direct the user to the dashboard so they can see the saved state reflected there.
6. During daily check-ins, the agent must persist the check-in before giving a final summary or updated coaching advice, and should reference how the update will appear in the dashboard.
6. Use the canonical write scripts for persistence:
   - `npm run trainer:onboarding` with JSON on stdin
   - `npm run trainer:checkin` with JSON on stdin
7. Do not keep critical onboarding or check-in state only in conversation memory.
8. Do not skip persistence because the conversation feels clear. If it matters later, it must be saved now.
9. Add runtime or operational notes to `TOOLS.md` when the environment changes.
10. Store durable user-specific preferences in `USER.md` only when they are not already represented in the database.

If the required write scripts fail, the agent should say persistence failed and either retry or ask the user before continuing.
