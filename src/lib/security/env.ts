function getEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return fallback;
  return value;
}

export const env = {
  databaseUrl: getEnv("DATABASE_URL"),
  cronSecret: getEnv("CRON_SECRET"),
  encryptionKey: getEnv("ENCRYPTION_KEY"),
  appSingleUserSecret: getEnv("APP_SINGLE_USER_SECRET")
};

export function requireEnv(value: string, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
