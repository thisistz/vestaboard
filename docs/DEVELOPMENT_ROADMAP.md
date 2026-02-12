# Development Roadmap

This file tracks the MVP roadmap and current status.

## Phase 0: Foundation

- Status: Complete
- Outcomes:
  - Next.js + TypeScript scaffold
  - Prisma schema and DB client
  - environment template and runtime config helpers

## Phase 1: Vestaboard Core

- Status: Complete (MVP)
- Outcomes:
  - Vestaboard sender with retries/backoff
  - `POST /api/test-send`
  - encrypted credential storage

## Phase 2: Quote Providers

- Status: Complete (MVP)
- Outcomes:
  - provider abstraction
  - DailyScript provider with HTML parsing fallback
  - Rick & Morty provider with de-duplication against prior quote

## Phase 3: Scheduling

- Status: Complete (MVP)
- Outcomes:
  - due-check logic based on `intervalMinutes` and `lastSentAt`
  - scheduled sender service
  - cron route wired for Vercel

## Phase 4: Web App Interface

- Status: Complete (MVP)
- Outcomes:
  - settings UI for mode, interval, timezone, active toggle, credentials
  - test-send action
  - delivery logs panel

## Phase 5: Hardening

- Status: Partial
- Completed:
  - cron secret gate
  - encrypted credentials at rest
  - error capture in delivery logs
- Remaining:
  - stronger auth for settings endpoints
  - rate limiting
  - distributed idempotency lock (Redis or DB lock table)

## Phase 6: Vercel Deployment

- Status: Ready for deploy
- Outcomes:
  - repository structure and `vercel.json` cron
  - environment variable contract documented

## Next Iteration Priorities

1. Add proper authentication for settings UI and mutable API routes.
2. Add distributed lock/idempotency to prevent duplicate cron processing.
3. Improve DailyScript parsing resilience with source-specific selectors and monitoring.
4. Add automated tests for scheduler, providers, and API routes.
