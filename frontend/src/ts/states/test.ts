import { createEffect, createMemo, createSignal } from "solid-js";
import { getConfig } from "../config/store";

import { Challenge } from "@monkeytype/challenges";
import { LayoutObject } from "@monkeytype/schemas/layouts";
import { CompletedEvent, IncompleteTest } from "@monkeytype/schemas/results";
import { createStore } from "solid-js/store";
import { keymapEvent } from "../events/keymap";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import { getData as getCustomTextData } from "../test/custom-text";
import { QuoteWithTextSplit } from "../types/quotes";
import { getLayout } from "../utils/json-data";
import { mirrorLayoutKeys } from "../utils/key-converter";
import { canQuickRestart } from "../utils/quick-restart";
import { replaceUnderscoresWithSpaces } from "../utils/strings";
import { getActivePage, getCustomTextIndicator } from "./core";
import { useResourceWithPromise } from "../hooks/useResourceWithPromise";

export const [wordsHaveNewline, setWordsHaveNewline] = createSignal(false);
export const [wordsHaveTab, setWordsHaveTab] = createSignal(false);
export const [wordsHaveNumbers, setWordsHaveNumbers] = createSignal(false);

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

export const [getLastSignedOutResult, setLastSignedOutResult] =
  createSignal<CompletedEvent | null>(null);

export const [isTestActive, setTestActive] = createSignal(false);
export const [currentLiveStats, setCurrentLiveStats] = createStore<{
  wpm?: number;
  acc?: number;
  raw?: number;
}>({});
export const resetCurrentLiveStats = (): void =>
  setCurrentLiveStats({ wpm: undefined, acc: undefined, raw: undefined });

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
  isMirrored: boolean;
}>(() => {
  const isOverride = getConfig.keymapLayout === "overrideSync";
  const raw = isOverride ? getConfig.layout : getConfig.keymapLayout;

  const layout = raw === "default" ? "qwerty" : raw;
  const layoutNameDisplayString = replaceUnderscoresWithSpaces(raw);
  const isMirrored = getConfig.funbox.includes("layout_mirror");

  return { layout: layout, layoutNameDisplayString, isMirrored };
});

const [getKeymapHighlightKey, setKeymapHighlightKey] = createSignal<
  string | undefined
>(undefined);

export { getKeymapHighlightKey };

export type FlashEntry = { tick: number; correct: boolean };

const [getKeymapFlashState, setKeymapFlashState] = createStore<
  Record<string, FlashEntry | undefined>
>({});

export { getKeymapFlashState, setKeymapFlashState };

keymapEvent.useListener(({ mode, key, correct }) => {
  const mappedKey = key === "" ? " " : key;
  setKeymapHighlightKey(mode === "highlight" ? mappedKey : undefined);

  if (mode === "flash" && getConfig.keymapMode === "react") {
    const existing = getKeymapFlashState[mappedKey];
    setKeymapFlashState(mappedKey, {
      tick: existing ? existing.tick + 1 : 1,
      correct: correct ?? true,
    });
  }
});

const getInputLayout = createMemo<{
  layout: string;
  isMirrored: boolean;
}>(() => {
  return {
    layout: getConfig.layout === "default" ? "qwerty" : getConfig.layout,
    isMirrored: getConfig.funbox.includes("layout_mirror"),
  };
});

const [inputLayoutObject, inputLayoutPromise] = useResourceWithPromise(
  getInputLayout,
  async (layout) => {
    const result = await getLayout(layout.layout);
    if (layout.isMirrored) {
      return mirrorLayoutKeys(result);
    }
    return result;
  },
);

const [keymapLayoutObject, keymapLayoutPromise] = useResourceWithPromise(
  getKeymapLayout,
  async (layout) => {
    const result = await getLayout(layout.layout);
    if (layout.isMirrored) {
      return mirrorLayoutKeys(result);
    }
    return result;
  },
);
export { keymapLayoutObject };

/**
 * Used for non reactive access. Do not use in Solid components.
 */
export const __nonReactive = {
  getKeymapLayout: async (): Promise<LayoutObject> => {
    await keymapLayoutPromise.promise;
    const result = keymapLayoutObject();
    if (result === undefined) {
      throw new Error("Failed to load keymap layout");
    }
    return result;
  },
  getInputLayout: async (): Promise<LayoutObject> => {
    await inputLayoutPromise.promise;
    const result = inputLayoutObject();
    if (result === undefined) {
      throw new Error("Failed to load input layout");
    }
    return result;
  },
};
