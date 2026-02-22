# Vestaboard Quotes Sender

Send movie and TV quotes to your Vestaboard on a recurring schedule.

This project provides:
- a web app to configure quote mode, interval, and board credentials
- a scheduler endpoint for automated dispatch
- delivery logs for success and failure visibility

## Quote Modes

- `RICK_MORTY`: random quotes from Andrew Reitz's Rick and Morty JSON dataset
- `DAILYSCRIPT`: quote scraping from DailyScript with parser fallback

## Stack

- Next.js (App Router)
- Prisma + PostgreSQL
- Vercel deployment target
- GitHub Actions scheduler (recommended for Vercel Hobby)

## 1. Clone and Install

```bash
git clone https://github.com/your-account/vestaboard.git
cd vestaboard
npm install
```

## 2. Configure Environment Variables

Copy template:

```bash
cp .env.example .env.local
```

Set values in `.env.local`:
- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `CRON_SECRET`
- `APP_SINGLE_USER_SECRET`

## 3. Initialize Database Schema

For first-time setup:

```bash
npm run db:push
```

For migration-based workflows:

```bash
npm run db:migrate
```

## 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Deploy to Vercel

Deploy with Vercel Git integration or CLI.

Set the same environment variables in Vercel Project Settings:
- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `CRON_SECRET`
- `APP_SINGLE_USER_SECRET`

### Neon Integration Fallback

If your Vercel Neon integration provides `vestadtb_POSTGRES_PRISMA_URL`, runtime fallback can use it when `DATABASE_URL` is missing or malformed.

## 6. Configure Scheduler (Free Tier Recommended)

### Why GitHub Actions Scheduler

Vercel Hobby cron has restrictive cadence. This repo uses:
- Vercel cron in `vercel.json`: daily
- GitHub Actions scheduler: every 5 minutes

### Required GitHub Secrets

In your GitHub repo settings, add:
- `CRON_SECRET` (must exactly match Vercel `CRON_SECRET`)
- `QUOTE_CRON_URL` (example: `https://your-project.vercel.app/api/jobs/send-quotes`)

Workflow file:
- `.github/workflows/trigger-quote-job.yml`

## Effective Interval Behavior

The app sends when both are true:
- scheduler trigger occurs
- `intervalMinutes` has elapsed since last send

Because scheduler cadence is `*/5`, practical minimum is about 5+ minutes.

## Vestaboard Message Constraints

Vestaboard rejects message text over 132 characters.

Current behavior for Rick and Morty mode:
- skip overlong quotes
- randomize again until a safe quote is selected

## API Routes

- `GET /api/health`
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/test-send`
- `POST /api/jobs/send-quotes`
- `GET /api/logs`

## CI

GitHub Actions CI workflow runs build checks on push/PR:
- `.github/workflows/ci.yml`

## Common Issues

### `Invalid settings payload`

Ensure you are on latest deployment and not sending invalid field values.

### `QuoteConfig does not exist`

Database schema not initialized yet. Run `db:push` or migrations.

### `Unauthorized` from `/api/jobs/send-quotes`

`CRON_SECRET` mismatch between GitHub and Vercel, or stale deployment after secret changes.

### No sends at expected cadence

Check:
- settings active state
- saved interval
- GitHub scheduled run history
- `/api/logs` for delivery errors

## Security Notes

- Never commit real `.env` files.
- Keep `.env.local` out of version control.
- Rotate secrets if leaked.

## Additional Docs

- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT_ROADMAP.md`
- `docs/MVP_STATUS.md`
- `docs/IMPLEMENTATION_HISTORY.md`
- `CONTRIBUTING.md`
