function getEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return fallback;
  return value;
}

export function hasValidPostgresProtocol(value: string): boolean {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

export const env = {
  databaseUrl: getEnv("DATABASE_URL"),
  neonPrismaUrl: getEnv("vestadtb_POSTGRES_PRISMA_URL"),
  cronSecret: getEnv("CRON_SECRET"),
  encryptionKey: getEnv("ENCRYPTION_KEY"),
  appSingleUserSecret: getEnv("APP_SINGLE_USER_SECRET")
};

export function getEffectiveDatabaseUrl(): string {
  if (hasValidPostgresProtocol(env.databaseUrl)) return env.databaseUrl;
  if (hasValidPostgresProtocol(env.neonPrismaUrl)) return env.neonPrismaUrl;
  return env.databaseUrl || env.neonPrismaUrl;
}

export function requireEnv(value: string, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
