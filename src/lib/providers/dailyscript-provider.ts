import type { QuoteItem, QuoteProvider } from "@/types/quotes";

const DAILY_SCRIPT_URL = "https://www.dailyscript.com/";

type ParsedQuote = {
  text: string;
  ref: string;
};

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, " "));
}

function parseQuotesFromHtml(html: string): ParsedQuote[] {
  const candidates = new Set<string>();

  const blockquoteMatches = html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi);
  for (const match of blockquoteMatches) {
    const text = stripHtml(match[1]);
    if (text.length > 25 && text.length < 280) candidates.add(text);
  }

  const quotedMatches = html.matchAll(/[“\"]([^“”\"\n]{20,240})[”\"]/g);
  for (const match of quotedMatches) {
    const text = decodeHtmlEntities(match[1]);
    if (text.length > 25 && text.length < 280) candidates.add(text);
  }

  return Array.from(candidates).map((text, idx) => ({ text, ref: `ds-${idx}` }));
}

function pickQuote(quotes: ParsedQuote[], lastQuoteRef?: string): ParsedQuote {
  if (quotes.length === 0) {
    return {
      text: "No quote found on DailyScript right now.",
      ref: "ds-fallback"
    };
  }

  if (quotes.length === 1 || !lastQuoteRef) {
    const idx = Math.floor(Math.random() * quotes.length);
    return quotes[idx];
  }

  const options = quotes.filter((quote) => quote.ref !== lastQuoteRef);
  const pool = options.length > 0 ? options : quotes;
  return pool[Math.floor(Math.random() * pool.length)];
}

export class DailyScriptProvider implements QuoteProvider {
  mode: QuoteProvider["mode"] = "DAILYSCRIPT";

  async getNextQuote(lastQuoteRef?: string): Promise<QuoteItem> {
    try {
      const res = await fetch(DAILY_SCRIPT_URL, {
        cache: "no-store",
        headers: {
          "user-agent": "Mozilla/5.0 VestaboardQuoteBot/1.0"
        }
      });

      if (!res.ok) {
        return {
          text: `DailyScript request failed with status ${res.status}.`,
          ref: "ds-http-failure"
        };
      }

      const html = await res.text();
      const quotes = parseQuotesFromHtml(html);
      return pickQuote(quotes, lastQuoteRef);
    } catch {
      return {
        text: "DailyScript is temporarily unavailable.",
        ref: "ds-fetch-failure"
      };
    }
  }
}
