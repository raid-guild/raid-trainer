# Tools

Document runtime details, external services, and operational constraints here.

Current runtime:

- Node.js app started with PM2 via `npm start`
- Public route exposed at `/app`
- Health check exposed at `/app/health`
- Next.js App Router for UI and API routes
- SQLite persistence stored under `workspace/data`
- Workspace-served assets available through API routes
