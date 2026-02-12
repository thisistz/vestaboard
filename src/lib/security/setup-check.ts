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

export function getMissingServerEnvVars(): string[] {
  return REQUIRED_SERVER_ENV_KEYS.filter((item) => isMissing(item.value)).map((item) => item.name);
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
        "Server setup is incomplete. Add required environment variables in Vercel project settings and redeploy.",
      missing
    },
    { status: 503 }
  );
}
