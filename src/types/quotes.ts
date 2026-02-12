export type QuoteMode = "DAILYSCRIPT" | "RICK_MORTY";

export type QuoteItem = {
  text: string;
  ref?: string;
};

export type QuoteProvider = {
  mode: QuoteMode;
  getNextQuote(lastQuoteRef?: string): Promise<QuoteItem>;
};
