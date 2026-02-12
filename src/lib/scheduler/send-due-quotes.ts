import { getQuoteProvider } from "@/lib/providers";
import {
  getAllActiveRuntimeConfigs,
  insertDeliveryLog,
  updateLastSendState
} from "@/lib/settings/service";
import { sendVestaboardMessage } from "@/lib/vestaboard/client";

export type SendDueQuotesResult = {
  scanned: number;
  due: number;
  sent: number;
  failed: number;
};

function isDue(lastSentAt: Date | null, intervalMinutes: number, now: Date): boolean {
  if (!lastSentAt) return true;
  const elapsedMs = now.getTime() - lastSentAt.getTime();
  return elapsedMs >= intervalMinutes * 60 * 1000;
}

export async function sendDueQuotes(): Promise<SendDueQuotesResult> {
  const configs = await getAllActiveRuntimeConfigs();
  const now = new Date();

  let due = 0;
  let sent = 0;
  let failed = 0;

  for (const config of configs) {
    if (!isDue(config.lastSentAt, config.intervalMinutes, now)) {
      continue;
    }

    due += 1;

    try {
      const provider = getQuoteProvider(config.mode);
      const quote = await provider.getNextQuote(config.lastQuoteRef ?? undefined);

      await sendVestaboardMessage(config.credentials, quote.text);
      await updateLastSendState(config.boardId, now, quote.ref);

      await insertDeliveryLog({
        boardId: config.boardId,
        mode: config.mode,
        quoteText: quote.text,
        quoteRef: quote.ref,
        status: "SUCCESS"
      });

      sent += 1;
    } catch (error) {
      failed += 1;

      await insertDeliveryLog({
        boardId: config.boardId,
        mode: config.mode,
        quoteText: "",
        status: "FAILURE",
        error: (error as Error).message
      });
    }
  }

  return {
    scanned: configs.length,
    due,
    sent,
    failed
  };
}
