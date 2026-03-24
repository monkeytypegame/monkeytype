import { Challenge } from "@monkeytype/schemas/challenges";
import { createSignal } from "solid-js";
import { QuoteWithTextSplit } from "../controllers/quotes-controller";

export const [getLoadedChallenge, setLoadedChallenge] =
  createSignal<Challenge | null>(null);

export const [getCurrentQuote, setCurrentQuote] =
  createSignal<QuoteWithTextSplit | null>(null);
