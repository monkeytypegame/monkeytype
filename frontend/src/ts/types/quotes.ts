import { Language } from "@monkeytype/schemas/languages";
import { QuoteDataQuote } from "@monkeytype/schemas/quotes";
import { RequiredProperties } from "../utils/misc";

export type Quote = QuoteDataQuote & {
  group: number;
  language: Language;
  textSplit?: string[];
};

export type QuoteWithTextSplit = RequiredProperties<Quote, "textSplit">;
