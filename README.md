# Vestaboard Quotes Sender

A Next.js + Prisma MVP that sends scheduled quotes to a Vestaboard.

## Features Implemented

- Web UI to configure:
  - Vestaboard credentials
  - quote source mode (`DAILYSCRIPT` or `RICK_MORTY`)
  - interval in minutes
  - timezone and active status
- API endpoints:
  - `GET/POST /api/settings`
  - `POST /api/test-send`
  - `POST /api/jobs/send-quotes`
  - `GET /api/logs`
  - `GET /api/health`
- Scheduler worker logic for due jobs.
- Delivery logging to database.
- Vercel cron schedule configured in `vercel.json`.

## Quote Modes

- `DAILYSCRIPT`
  - fetches and parses quote candidates from [dailyscript.com](https://www.dailyscript.com)
- `RICK_MORTY`
  - fetches quotes from [Rick and Morty JSON](https://raw.githubusercontent.com/AndrewReitz/rick-and-morty-quotes-json/master/rick-and-morty-quotes.json)

## Requirements

- Node.js 20+
- PostgreSQL database
- Vestaboard Read/Write API key

## Local Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Fill `.env.local` values.

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

5. Start app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Cron

`vercel.json` runs cron every minute:

- path: `/api/jobs/send-quotes`
- schedule: `* * * * *`

In production, include header `x-cron-secret` matching `CRON_SECRET`.

## Notes

- The sender currently uses Vestaboard Read/Write endpoint (`https://rw.vestaboard.com/`).
- `ENCRYPTION_KEY` encrypts credentials at rest.
- DailyScript parsing relies on page structure and may need selector updates over time.
