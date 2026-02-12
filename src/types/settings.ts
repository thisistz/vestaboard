import type { QuoteMode } from "@/types/quotes";

export type PublicSettings = {
  boardName: string;
  mode: QuoteMode;
  intervalMinutes: number;
  timezone: string;
  active: boolean;
  hasApiSecret: boolean;
  apiKeyMasked: string;
};

export type UpsertSettingsInput = {
  boardName: string;
  apiKey?: string;
  apiSecret?: string;
  mode: QuoteMode;
  intervalMinutes: number;
  timezone: string;
  active: boolean;
};

export type RuntimeBoardConfig = {
  boardId: string;
  boardName: string;
  mode: QuoteMode;
  intervalMinutes: number;
  timezone: string;
  lastSentAt: Date | null;
  lastQuoteRef: string | null;
  credentials: {
    apiKey: string;
    apiSecret?: string;
  };
};
