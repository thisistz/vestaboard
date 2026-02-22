# Contributing

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env.local
```

3. Set a valid Postgres `DATABASE_URL`.

4. Sync schema:

```bash
npm run db:push
```

5. Run app:

```bash
npm run dev
```

## Validation Before PR

Run these checks locally:

```bash
npm run build
```

## Pull Request Expectations

- Keep changes scoped and focused.
- Update docs when behavior changes.
- Avoid committing secrets or real `.env` files.
- Include brief rationale in commit messages.

## Security

If you find a security issue, avoid public disclosure in an issue. Contact the maintainer directly.
