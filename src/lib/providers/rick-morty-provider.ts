import type { QuoteItem, QuoteProvider } from "@/types/quotes";

const RICK_MORTY_QUOTES_URL =
  "https://raw.githubusercontent.com/AndrewReitz/rick-and-morty-quotes-json/master/rick-and-morty-quotes.json";
const VESTABOARD_MAX_TEXT_LENGTH = 132;

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

function isVestaboardSafe(text: string): boolean {
  return text.length <= VESTABOARD_MAX_TEXT_LENGTH;
}

function pickRandomSafeQuote(quotes: string[], lastQuoteRef?: string): { text: string; idx: number } | null {
  if (quotes.length === 0) return null;

  const previous = Number(lastQuoteRef?.replace("rm-", ""));
  const candidateIndexes = quotes
    .map((quote, idx) => ({ quote, idx }))
    .filter((item) => isVestaboardSafe(item.quote))
    .map((item) => item.idx);

  if (candidateIndexes.length === 0) return null;

  const nonRepeating = Number.isInteger(previous)
    ? candidateIndexes.filter((idx) => idx !== previous)
    : candidateIndexes;

  const pool = nonRepeating.length > 0 ? nonRepeating : candidateIndexes;
  const idx = pool[Math.floor(Math.random() * pool.length)];
  return { text: quotes[idx], idx };
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
      const picked = pickRandomSafeQuote(data, lastQuoteRef);
      if (!picked) {
        const idx = pickNonRepeatingIndex(LOCAL_FALLBACK_QUOTES.length, lastQuoteRef);
        return {
          text: LOCAL_FALLBACK_QUOTES[idx].slice(0, VESTABOARD_MAX_TEXT_LENGTH),
          ref: `rm-${idx}`
        };
      }

      return {
        text: picked.text,
        ref: `rm-${picked.idx}`
      };
    } catch {
      const picked = pickRandomSafeQuote(LOCAL_FALLBACK_QUOTES, lastQuoteRef);
      if (picked) {
        return {
          text: picked.text,
          ref: `rm-${picked.idx}`
        };
      }

      const idx = pickNonRepeatingIndex(LOCAL_FALLBACK_QUOTES.length, lastQuoteRef ?? "rm-0");
      return {
        text: LOCAL_FALLBACK_QUOTES[idx].slice(0, VESTABOARD_MAX_TEXT_LENGTH),
        ref: `rm-${idx}`
      };
    }
  }
}
