import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { decryptText, encryptText } from "@/lib/security/crypto";
import type { QuoteMode } from "@/types/quotes";
import type { PublicSettings, RuntimeBoardConfig, UpsertSettingsInput } from "@/types/settings";

type ConfigWithBoard = {
  board: { name: string; vestaboardApiKeyEnc: string; vestaboardApiSecretEnc: string | null; active: boolean };
  mode: QuoteMode;
  intervalMinutes: number;
  timezone: string;
  active: boolean;
};

function maskValue(value: string): string {
  if (value.length <= 6) return "*".repeat(value.length);
  return `${value.slice(0, 3)}${"*".repeat(Math.max(value.length - 5, 3))}${value.slice(-2)}`;
}

function toPublicSettings(record: ConfigWithBoard): PublicSettings {
  const apiKey = decryptText(record.board.vestaboardApiKeyEnc);

  return {
    boardName: record.board.name,
    mode: record.mode,
    intervalMinutes: record.intervalMinutes,
    timezone: record.timezone,
    active: record.active && record.board.active,
    hasApiSecret: Boolean(record.board.vestaboardApiSecretEnc),
    apiKeyMasked: maskValue(apiKey)
  };
}

export async function getPublicSettings(): Promise<PublicSettings | null> {
  const config = await prisma.quoteConfig.findFirst({
    include: {
      board: true
    },
    orderBy: { createdAt: "asc" }
  });

  if (!config) return null;
  return toPublicSettings(config);
}

export async function getRuntimeBoardConfigByBoardId(boardId: string): Promise<RuntimeBoardConfig | null> {
  const config = await prisma.quoteConfig.findUnique({
    where: { boardId },
    include: { board: true }
  });

  if (!config) return null;

  return {
    boardId: config.boardId,
    boardName: config.board.name,
    mode: config.mode,
    intervalMinutes: config.intervalMinutes,
    timezone: config.timezone,
    lastSentAt: config.lastSentAt,
    lastQuoteRef: config.lastQuoteRef,
    credentials: {
      apiKey: decryptText(config.board.vestaboardApiKeyEnc),
      apiSecret: config.board.vestaboardApiSecretEnc
        ? decryptText(config.board.vestaboardApiSecretEnc)
        : undefined
    }
  };
}

export async function getAllActiveRuntimeConfigs(): Promise<RuntimeBoardConfig[]> {
  const configs = await prisma.quoteConfig.findMany({
    where: {
      active: true,
      board: { active: true }
    },
    include: { board: true }
  });

  return configs.map((config) => ({
    boardId: config.boardId,
    boardName: config.board.name,
    mode: config.mode,
    intervalMinutes: config.intervalMinutes,
    timezone: config.timezone,
    lastSentAt: config.lastSentAt,
    lastQuoteRef: config.lastQuoteRef,
    credentials: {
      apiKey: decryptText(config.board.vestaboardApiKeyEnc),
      apiSecret: config.board.vestaboardApiSecretEnc
        ? decryptText(config.board.vestaboardApiSecretEnc)
        : undefined
    }
  }));
}

export async function upsertSettings(input: UpsertSettingsInput): Promise<PublicSettings> {
  const existing = await prisma.quoteConfig.findFirst({
    include: { board: true },
    orderBy: { createdAt: "asc" }
  });

  if (!existing && !input.apiKey) {
    throw new Error("A Vestaboard API key is required for initial setup.");
  }

  const boardName = input.boardName || "My Vestaboard";

  const result = await prisma.$transaction(
    async (tx) => {
      const board = existing
        ? await tx.board.update({
            where: { id: existing.boardId },
            data: {
              name: boardName,
              active: input.active,
              ...(input.apiKey ? { vestaboardApiKeyEnc: encryptText(input.apiKey) } : {}),
              ...(input.apiSecret
                ? { vestaboardApiSecretEnc: encryptText(input.apiSecret) }
                : input.apiSecret === ""
                  ? { vestaboardApiSecretEnc: null }
                  : {})
            }
          })
        : await tx.board.create({
            data: {
              name: boardName,
              active: input.active,
              vestaboardApiKeyEnc: encryptText(input.apiKey ?? ""),
              vestaboardApiSecretEnc: input.apiSecret ? encryptText(input.apiSecret) : null
            }
          });

      const config = existing
        ? await tx.quoteConfig.update({
            where: { id: existing.id },
            data: {
              mode: input.mode,
              intervalMinutes: input.intervalMinutes,
              timezone: input.timezone,
              active: input.active
            },
            include: { board: true }
          })
        : await tx.quoteConfig.create({
            data: {
              boardId: board.id,
              mode: input.mode,
              intervalMinutes: input.intervalMinutes,
              timezone: input.timezone,
              active: input.active
            },
            include: { board: true }
          });

      return config;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  return toPublicSettings(result);
}

export async function updateLastSendState(boardId: string, lastSentAt: Date, lastQuoteRef?: string) {
  await prisma.quoteConfig.update({
    where: { boardId },
    data: {
      lastSentAt,
      lastQuoteRef: lastQuoteRef ?? null
    }
  });
}

export async function listDeliveryLogs(limit = 50) {
  return prisma.deliveryLog.findMany({
    include: { board: { select: { name: true } } },
    orderBy: { sentAt: "desc" },
    take: limit
  });
}

export async function insertDeliveryLog(input: {
  boardId: string;
  mode: QuoteMode;
  quoteText: string;
  quoteRef?: string;
  status: "SUCCESS" | "FAILURE";
  error?: string;
}) {
  await prisma.deliveryLog.create({
    data: {
      boardId: input.boardId,
      mode: input.mode,
      quoteText: input.quoteText,
      quoteRef: input.quoteRef,
      status: input.status,
      error: input.error
    }
  });
}
