# Vestaboard Quotes Sender

A Next.js + Prisma app that sends scheduled quotes to a Vestaboard.

## Current Status

- Quote sources implemented:
  - `RICK_MORTY` (from the AndrewReitz JSON dataset)
  - `DAILYSCRIPT` (HTML parsing based)
- Web app settings are live for:
  - board credentials
  - mode selection
  - interval minutes
  - active toggle
- Delivery logging is enabled (`SUCCESS` / `FAILURE`).
- Database schema is Postgres via Prisma.

## Live Scheduling Model

This project currently uses a hybrid scheduler because of Vercel Hobby limitations.

- Vercel cron (`vercel.json`): `0 0 * * *` (daily)
- GitHub Actions scheduler (`.github/workflows/trigger-quote-job.yml`): `*/5 * * * *`

The GitHub workflow calls:

- `POST /api/jobs/send-quotes`
- with header `x-cron-secret: $CRON_SECRET`

### Effective Interval Rule

The app only evaluates due jobs when the scheduler runs.

- If app interval is 1 minute but workflow runs every 5 minutes, effective cadence is roughly 5+ minutes.
- For reliable behavior, set `intervalMinutes` >= 5 on this free-tier setup.

## Environment Variables

Required in Vercel (`Production`, `Preview`, and optionally `Development`):

- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `CRON_SECRET`
- `APP_SINGLE_USER_SECRET`

Neon integration variables are also present. Runtime fallback supports:

- `DATABASE_URL`
- `vestadtb_POSTGRES_PRISMA_URL` (fallback when `DATABASE_URL` is missing or malformed)

## GitHub Secrets

Required in GitHub repo secrets for scheduler workflow:

- `CRON_SECRET` (must exactly match Vercel `CRON_SECRET`)
- `QUOTE_CRON_URL` (optional, defaults to production endpoint)

## Vestaboard Constraints

Vestaboard rejects messages longer than 132 characters.

- Rick & Morty provider now skips overlong quotes and re-picks random quotes until one fits.

## API Endpoints

- `GET /api/health`
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/test-send`
- `POST /api/jobs/send-quotes`
- `GET /api/logs`

## Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Ensure env vars are set in Vercel.

3. Apply DB schema once against production DB:

```bash
npx prisma db push
```

4. Deploy latest `main`.

5. Confirm health and settings endpoints.

## Troubleshooting

### `Invalid settings payload`

If `apiSecret` blank triggers validation, deploy latest code (fix included).

### `QuoteConfig does not exist`

Database schema not applied yet. Run Prisma schema push/migration.

### `Unauthorized` on scheduler endpoint

`CRON_SECRET` mismatch between GitHub and Vercel, or stale deployment not using latest env.

### No sends at expected cadence

Check:

- settings `active=true`
- `intervalMinutes`
- GitHub Actions run history (scheduled runs)
- `/api/logs` for failures (especially overlong quote errors)

## Documentation

- Architecture: `docs/ARCHITECTURE.md`
- Roadmap: `docs/DEVELOPMENT_ROADMAP.md`
- MVP status: `docs/MVP_STATUS.md`
- Implementation history: `docs/IMPLEMENTATION_HISTORY.md`
