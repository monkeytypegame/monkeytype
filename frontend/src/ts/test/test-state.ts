import { createSignal } from "solid-js";
import { z } from "zod";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { EventLog } from "./events/types";

export const [selectedQuoteId, setSelectedQuoteId] = useLocalStorage({
  key: "selectedQuoteId",
  schema: z.number(),
  fallback: 1,
});

export const [isLanguageRightToLeft, setIsLanguageRightToLeft] =
  createSignal(false);
export const [isDirectionReversed, setIsDirectionReversed] =
  createSignal(false);
export const [testRestarting, setTestRestarting] = createSignal(false);
export const [koreanStatus, setKoreanStatus] = createSignal(false);
export const [lastEventLog, setLastEventLog] = createSignal<EventLog | null>(
  null,
);
