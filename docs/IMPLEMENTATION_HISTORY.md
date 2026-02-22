# Implementation History

This document summarizes what has been implemented and fixed across the project lifecycle.

## Delivered Scope

- Next.js + TypeScript application with API routes and dashboard UI.
- Prisma + PostgreSQL data model for boards, quote config, and delivery logs.
- Vestaboard message send client with retry behavior.
- Quote source providers:
  - DailyScript parser-based provider
  - Rick & Morty JSON provider
- Scheduler worker that evaluates due jobs using `lastSentAt` and `intervalMinutes`.

## Key Operational Changes

1. Deployment and scheduler strategy
- Vercel Hobby cron was constrained, so Vercel cron was set to daily.
- GitHub Actions workflow was added to trigger `/api/jobs/send-quotes` on a recurring schedule.
- Workflow cadence was tuned to `*/5 * * * *` for practical free-tier behavior.

2. Environment safety and setup checks
- Added API-side setup guards for missing env vars.
- Added DB URL protocol validation and clearer setup messages.
- Added runtime DB URL fallback to Neon integration variable:
  - primary: `DATABASE_URL`
  - fallback: `vestadtb_POSTGRES_PRISMA_URL`

3. Validation and payload handling fixes
- Fixed settings schema so blank optional credentials no longer fail payload validation.

4. Rick & Morty quote delivery fixes
- Corrected parser for the source JSON shape (array of strings).
- Removed placeholder fallback behavior for normal operation.
- Added max-length-safe quote selection for Vestaboard (<=132 chars).

5. Secret and scheduler synchronization
- Synchronized `CRON_SECRET` between Vercel and GitHub Actions.
- Fixed whitespace-related secret issue that caused scheduler auth failures.

6. Database activation
- Applied Prisma schema to Neon so required tables exist (`Board`, `QuoteConfig`, `DeliveryLog`).

## Current Runtime Behavior

- Scheduler trigger source: GitHub Actions every 5 minutes.
- App interval check: `intervalMinutes` in DB.
- Effective cadence is bounded by workflow frequency and GitHub scheduler jitter.

## Notable Commits

- `2af4759`: setup checks for missing env vars
- `9528e51`: blank optional credential validation fix
- `8a61c7d`: DB URL protocol validation messaging
- `e84d3b9`: DB URL fallback to Neon Prisma URL
- `ed7b83a`: Rick & Morty JSON parsing fix
- `b80757e`: initial GitHub Actions scheduler
- `65f7bf8`: scheduler cadence adjusted to 5 minutes
- `4d00122`: skip overlong quotes and re-pick

## Remaining Improvements

- Add authentication for settings mutation endpoints.
- Add distributed lock/idempotency for multi-trigger safety.
- Add automated tests for providers, scheduler, and routes.
