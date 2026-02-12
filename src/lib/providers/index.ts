import type { QuoteMode, QuoteProvider } from "@/types/quotes";
import { DailyScriptProvider } from "@/lib/providers/dailyscript-provider";
import { RickMortyProvider } from "@/lib/providers/rick-morty-provider";

export function getQuoteProvider(mode: QuoteMode): QuoteProvider {
  if (mode === "DAILYSCRIPT") return new DailyScriptProvider();
  return new RickMortyProvider();
}
