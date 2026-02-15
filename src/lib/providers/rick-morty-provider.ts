import type { QuoteItem, QuoteProvider } from "@/types/quotes";

const RICK_MORTY_QUOTES_URL =
  "https://raw.githubusercontent.com/AndrewReitz/rick-and-morty-quotes-json/master/rick-and-morty-quotes.json";

type RickMortyRecord = {
  quote: string;
  character?: string;
};

const LOCAL_FALLBACK_QUOTES = [
  "Wubba Lubba Dub Dub! -Rick",
  "Sometimes science is more art than science. -Rick",
  "Nobody exists on purpose. Nobody belongs anywhere. Everybody's gonna die. -Morty"
];

function pickNonRepeatingIndex(length: number, lastQuoteRef?: string): number {
  if (length <= 1) return 0;
  const previous = Number(lastQuoteRef?.replace("rm-", ""));

  let next = Math.floor(Math.random() * length);
  if (Number.isInteger(previous) && next === previous) {
    next = (next + 1) % length;
  }

  return next;
}

function normalizeRecord(input: unknown): string | null {
  if (typeof input === "string") {
    const text = input.trim();
    return text.length > 0 ? text : null;
  }

  if (input && typeof input === "object") {
    const record = input as RickMortyRecord;
    if (typeof record.quote === "string" && record.quote.trim().length > 0) {
      const quote = record.quote.trim();
      return record.character ? `${quote} -${record.character.trim()}` : quote;
    }
  }

  return null;
}

function normalizePayload(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeRecord).filter((value): value is string => value !== null);
}

export class RickMortyProvider implements QuoteProvider {
  mode: QuoteProvider["mode"] = "RICK_MORTY";

  async getNextQuote(lastQuoteRef?: string): Promise<QuoteItem> {
    try {
      const res = await fetch(RICK_MORTY_QUOTES_URL, { cache: "no-store" });
      const payload = res.ok ? await res.json() : LOCAL_FALLBACK_QUOTES;
      const quotes = normalizePayload(payload);
      const data = quotes.length > 0 ? quotes : LOCAL_FALLBACK_QUOTES;

      const idx = pickNonRepeatingIndex(data.length, lastQuoteRef);
      const item = data[idx];

      return {
        text: item,
        ref: `rm-${idx}`
      };
    } catch {
      const idx = pickNonRepeatingIndex(LOCAL_FALLBACK_QUOTES.length, lastQuoteRef);
      return {
        text: LOCAL_FALLBACK_QUOTES[idx],
        ref: `rm-${idx}`
      };
    }
  }
}
