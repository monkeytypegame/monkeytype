import {
  createSignal,
  createEffect,
  createMemo,
  createResource,
} from "solid-js";
import { Challenge } from "@monkeytype/schemas/challenges";
import { getConfig } from "../config/store";

import { canQuickRestart } from "../utils/quick-restart";
import { getData as getCustomTextData } from "../test/custom-text";
import { getActivePage, getCustomTextIndicator } from "./core";
import { QuoteWithTextSplit } from "../types/quotes";
import { CompletedEvent, IncompleteTest } from "@monkeytype/schemas/results";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { getLayout } from "../utils/json-data";
import { replaceUnderscoresWithSpaces } from "../utils/strings";

export const [wordsHaveNewline, setWordsHaveNewline] = createSignal(false);
export const [wordsHaveTab, setWordsHaveTab] = createSignal(false);

export const [getLoadedChallenge, setLoadedChallenge] =
  createSignal<Challenge | null>(null);
export const [getResultVisible, setResultVisible] = createSignal(false);
export const [getFocus, setFocus] = createSignal(false);
export const [isTestInvalid, setIsTestInvalid] = createSignal(false);
export const [isLongTest, setIsLongTest] = createSignal(false);
export const [getLastResult, setLastResult] = createSignal<Omit<
  CompletedEvent,
  "hash" | "uid"
> | null>(null);
export const [
  getIncompleteTests,
  { push: pushIncompleteTest, reset: resetIncompleteTests },
] = createSignalWithSetters<IncompleteTest[]>([])({
  push: (set, val: IncompleteTest) => set((arr) => [...arr, val]),
  reset: (set) => set([]),
});
export const getRestartCount = createMemo(() => getIncompleteTests().length);
export const getIncompleteSeconds = createMemo(() =>
  getIncompleteTests().reduce((sum, test) => sum + test.seconds, 0),
);

export const [isRepeated, setIsRepeated] = createSignal(false);
export const [isPaceRepeat, setIsPaceRepeat] = createSignal(false);
export const [getPaceCaretWpm, setPaceCaretWpm] = createSignal<
  number | undefined
>(undefined);
export const [getCurrentQuote, setCurrentQuote] =
  createSignal<QuoteWithTextSplit | null>(null);

createEffect(() => {
  getActivePage(); // depend on active page
  setIsLongTest(
    !canQuickRestart(
      getConfig.mode,
      getConfig.words,
      getConfig.time,
      getCustomTextData(),
      getCustomTextIndicator()?.isLong ?? false,
    ),
  );
});

export const getKeymapLayout = createMemo<{
  layout: string;
  layoutNameDisplayString: string;
}>(() => {
  const isOverride = getConfig.keymapLayout === "overrideSync";
  const raw = isOverride ? getConfig.layout : getConfig.keymapLayout;

  const layout = raw === "default" ? "qwerty" : raw;
  const layoutNameDisplayString = replaceUnderscoresWithSpaces(raw);

  return { layout: layout, layoutNameDisplayString };
});

export const [keymapLayoutObject] = createResource(
  getKeymapLayout,
  async (layout) => structuredClone(await getLayout(layout.layout)),
);
