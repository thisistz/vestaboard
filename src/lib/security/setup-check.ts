import { NextResponse } from "next/server";
import { env } from "@/lib/security/env";

const REQUIRED_SERVER_ENV_KEYS = [
  { name: "DATABASE_URL", value: env.databaseUrl },
  { name: "ENCRYPTION_KEY", value: env.encryptionKey }
];

const REQUIRED_CRON_ENV_KEYS = [{ name: "CRON_SECRET", value: env.cronSecret }];

function isMissing(value: string): boolean {
  return value.trim().length === 0;
}

function hasValidPostgresProtocol(value: string): boolean {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

export function getMissingServerEnvVars(): string[] {
  const issues: string[] = [];

  for (const item of REQUIRED_SERVER_ENV_KEYS) {
    if (isMissing(item.value)) {
      issues.push(item.name);
      continue;
    }

    if (item.name === "DATABASE_URL" && !hasValidPostgresProtocol(item.value)) {
      issues.push("DATABASE_URL must start with postgresql:// or postgres://");
    }
  }

  return issues;
}

export function getMissingCronEnvVars(): string[] {
  return REQUIRED_CRON_ENV_KEYS.filter((item) => isMissing(item.value)).map((item) => item.name);
}

export function getSetupResponse(missing: string[]) {
  return NextResponse.json(
    {
      ok: false,
      setupRequired: true,
      error:
        "Server setup is incomplete. Add missing or fix invalid environment variables in Vercel project settings and redeploy.",
      missing
    },
    { status: 503 }
  );
}
