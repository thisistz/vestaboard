# Architecture

## Runtime Flow

1. User configures mode/interval in web app.
2. Settings are stored in PostgreSQL.
3. Vercel Cron calls `POST /api/jobs/send-quotes` every minute.
4. Scheduler checks which configs are due.
5. Scheduler fetches next quote from selected provider.
6. Vestaboard client sends quote.
7. Delivery result is recorded in `delivery_logs`.

## Components

- `src/lib/providers`
  - quote provider interface and implementations.
- `src/lib/scheduler`
  - due-job selection and execution.
- `src/lib/vestaboard`
  - API client for message delivery.
- `src/app/api`
  - HTTP endpoints for UI and cron.
- `prisma/schema.prisma`
  - persistence model.

## Deployment Topology

- Frontend and API routes on Vercel.
- Cron trigger on Vercel.
- PostgreSQL for persistent state.
- Optional Redis for lock/idempotency (future hardening).
