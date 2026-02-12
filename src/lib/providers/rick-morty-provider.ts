import type { QuoteItem, QuoteProvider } from "@/types/quotes";

const RICK_MORTY_QUOTES_URL =
  "https://raw.githubusercontent.com/AndrewReitz/rick-and-morty-quotes-json/master/rick-and-morty-quotes.json";

type RickMortyRecord = {
  quote: string;
  character?: string;
};

function pickNonRepeatingIndex(length: number, lastQuoteRef?: string): number {
  if (length <= 1) return 0;
  const previous = Number(lastQuoteRef?.replace("rm-", ""));

  let next = Math.floor(Math.random() * length);
  if (Number.isInteger(previous) && next === previous) {
    next = (next + 1) % length;
  }

  return next;
}

export class RickMortyProvider implements QuoteProvider {
  mode: QuoteProvider["mode"] = "RICK_MORTY";

  async getNextQuote(lastQuoteRef?: string): Promise<QuoteItem> {
    const fallback = {
      text: "Wubba Lubba Dub Dub! (fallback)",
      ref: "rm-fallback"
    };

    try {
      const res = await fetch(RICK_MORTY_QUOTES_URL, { cache: "no-store" });
      if (!res.ok) return fallback;
      const data = (await res.json()) as RickMortyRecord[];
      if (!Array.isArray(data) || data.length === 0) return fallback;

      const idx = pickNonRepeatingIndex(data.length, lastQuoteRef);
      const item = data[idx];
      const text = item.character ? `${item.character}: ${item.quote}` : item.quote;

      return {
        text,
        ref: `rm-${idx}`
      };
    } catch {
      return fallback;
    }
  }
}
