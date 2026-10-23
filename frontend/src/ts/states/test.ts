import { createEffect, createMemo, createSignal, on } from "solid-js";
import { z } from "zod";
import { getConfig } from "../config/store";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { EventLog } from "../test/events/types";

import { Challenge } from "@monkeytype/challenges";
import { LayoutObject } from "@monkeytype/schemas/layouts";
import { CompletedEvent, IncompleteTest } from "@monkeytype/schemas/results";
import { createStore } from "solid-js/store";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import * as CustomText from "../test/custom-text";
import { isTestPageMounted } from "../test/test-page-state";
import { QuoteWithTextSplit } from "../types/quotes";
import { getLayout } from "../utils/json-data";
import { mirrorLayoutKeys } from "../utils/key-converter";
import { canQuickRestart } from "../utils/quick-restart";
import { replaceUnderscoresWithSpaces } from "../utils/strings";
import { getCustomTextIndicator } from "./core";
import { useResourceWithPromise } from "../hooks/useResourceWithPromise";
import { clearTimeouts } from "../utils/misc";

export const [wordsHaveNewline, setWordsHaveNewline] = createSignal(false);
export const [wordsHaveTab, setWordsHaveTab] = createSignal(false);
export const [wordsHaveNumbers, setWordsHaveNumbers] = createSignal(false);

export const [getLoadedChallenge, setLoadedChallenge] =
  createSignal<Challenge | null>(null);
// True from TestLogic.finish() (before the result is built) until restart()
// fades the result out. Whether the result is on screen: isResultShown()
export const [isTestFinished, setTestFinished] = createSignal(false);
// True from the first line of TestLogic.finish() until the result is built, so
// it covers the words fade-out that isTestFinished() is still false during.
export const [isResultCalculating, setResultCalculating] = createSignal(false);
// Set when the user bails out of a test early; reset by TestLogic.restart().
export const [getBailedOut, setBailedOut] = createSignal(false);
export const [getFocus, setFocus] = createSignal(false);
// read by TestPage (#words blur), the composition display and OutOfFocusWarning.
const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];
type TestFocusState = "focused" | "unfocused" | "unfocusedWindow";
export const [testFocusState, { setTestFocusState }] =
  createSignalWithSetters<TestFocusState>("focused")({
    setTestFocusState: (set, val: TestFocusState) => {
      if (val === "focused") {
        clearTimeouts(outOfFocusTimeouts);
        set(val);
      } else {
        outOfFocusTimeouts.push(
          setTimeout(() => {
            set(val);
          }, 1000),
        );
      }
    },
  });

export const showOutOfFocusWarning = createMemo(
  () => getConfig.showOutOfFocusWarning && testFocusState() !== "focused",
);

// max-height of the warning, kept in sync with the words wrapper by test-ui.
export const [outOfFocusMaxHeight, setOutOfFocusMaxHeight] = createSignal<
  number | undefined
>(undefined);

/** px, maxWidth in % of the words wrapper. undefined: the stylesheet's */
export type WordsInputPosition = {
  top: number;
  left: number;
  width?: number;
  maxWidth?: number;
};

// bound to #wordsInput by WordsInput, follows the active word
export const [wordsInputPosition, setWordsInputPosition] =
  createSignal<WordsInputPosition>({ top: 0, left: 0 });

// dev options: shows #wordsInput below the words
export const [isRealWordsInputShown, setRealWordsInputShown] =
  createSignal(false);

// bound to #words / #wordsWrapper by TestPage.
// Other modules write here instead of touching the DOM directly.
export const [isWordsHidden, setWordsHidden] = createSignal(false);
export const [isWordsWrapperHidden, setWordsWrapperHidden] =
  createSignal(false);
export const [isReadAheadDisabled, setReadAheadDisabled] = createSignal(false);
export const [isErrorBorderDisabled, setErrorBorderDisabled] =
  createSignal(false);
// hidden between the words fading out and the next restart
export const [isTypingTestHidden, setTypingTestHidden] = createSignal(false);
// script with no spaces between words (or custom/zen) - words may wrap mid-word
export const [isJoiningScript, setJoiningScript] = createSignal(false);

// memory funbox countdown in seconds, null when off. MemoryFunboxTimer runs it.
// equals: false so restarting with the same duration restarts the countdown.
export const [getMemoryTimerDuration, setMemoryTimerDuration] = createSignal<
  number | null
>(null, { equals: false });
// layoutfluid banner above the words, driven by test-timer/funbox-functions.
// visibility is separate from text so the text stays during the exit animation.
export const [isLayoutfluidTimerVisible, setLayoutfluidTimerVisible] =
  createSignal(false);
export const [getLayoutfluidTimerText, setLayoutfluidTimerText] =
  createSignal("");

// set by TestLogic.init() after repeated init failures; cleared on restart.
export const [isTestInitFailed, setTestInitFailed] = createSignal(false);
export const [getTestInitError, setTestInitError] = createSignal<string | null>(
  null,
);

// shown between the words fading out and the result appearing.
export const [isResultLoading, setResultLoading] = createSignal(false);

// IME composition in progress and its data so far, pushed from the
// composition events. Read by the input handlers, the caret and the
// composition display.
export const [isComposing, setComposing] = createSignal(false);
export const [getCompositionData, setCompositionData] = createSignal("");

// the timer drifted too far: animations stay off until it's cleared on restart.
const [isSlowTimer, setIsSlowTimer] = createSignal(false);
export { isSlowTimer };

export function setSlowTimer(): void {
  if (isSlowTimer()) return;
  setIsSlowTimer(true);
  console.error("Slow timer, disabling animations");
}

export function clearSlowTimer(): void {
  setIsSlowTimer(false);
}

createEffect(
  on(
    () => getConfig.showOutOfFocusWarning,
    (show) => {
      if (!show) setTestFocusState("focused");
    },
    { defer: true },
  ),
);
export const [isTestInvalid, setIsTestInvalid] = createSignal(false);
export const [isLongTest, setIsLongTest] = createSignal(false);
// a finished test's result, before the server adds hash and uid
export type CompletedResult = Omit<CompletedEvent, "hash" | "uid">;

export const [getLastResult, setLastResult] =
  createSignal<CompletedResult | null>(null);
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

export const [
  getActiveWordIndex,
  {
    increase: increaseActiveWordIndex,
    decrease: decreaseActiveWordIndex,
    reset: resetActiveWordIndex,
  },
] = createSignalWithSetters<number>(0)({
  increase: (set) => set((n) => n + 1),
  decrease: (set) => set((n) => n - 1),
  reset: (set) => set(0),
});

/**
 * Live test stats, rendered by the Solid live stat displays (the mini and text
 * variants and the progress bar). The test engine is still vanilla, so it pushes
 * plain numbers in here as it goes; everything shown on screen is derived below.
 * `undefined` means "no data yet" and is what the displays fall back to defaults on.
 */
export const [currentLiveStats, setCurrentLiveStats] = createStore<{
  wpm?: number;
  acc?: number;
  raw?: number;
  burst?: number;
  seconds?: number;
}>({});

createEffect(() => {
  // custom text settings aren't reactive - re-read them when the test page mounts
  isTestPageMounted();
  setIsLongTest(
    !canQuickRestart(
      getConfig.mode,
      getConfig.words,
      getConfig.time,
      CustomText.getData(),
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

/** Highlights the next key to press on the keymap. */
export function highlightKeymapKey(key: string): void {
  setKeymapHighlightKey(key === "" ? " " : key);
}

/** Flashes the pressed key on the keymap, clearing the highlight. */
export function flashKeymapKey(key: string, correct?: boolean): void {
  setKeymapHighlightKey(undefined);
  if (getConfig.keymapMode !== "react") return;

  const mappedKey = key === "" ? " " : key;
  const existing = getKeymapFlashState[mappedKey];
  setKeymapFlashState(mappedKey, {
    tick: existing ? existing.tick + 1 : 1,
    correct: correct ?? true,
  });
}

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

export const [getSelectedQuoteId, setSelectedQuoteId] = useLocalStorage({
  key: "selectedQuoteId",
  schema: z.number().int().min(1),
  fallback: 1,
});

export const [isLanguageRightToLeft, setIsLanguageRightToLeft] =
  createSignal(false);
export const [isDirectionReversed, setIsDirectionReversed] =
  createSignal(false);

/** zen, custom and polyglot words can mix directions: check per letter */
export function isRtlCheckedByLetter(): boolean {
  return (
    getConfig.mode === "zen" ||
    getConfig.mode === "custom" ||
    getConfig.funbox.includes("polyglot")
  );
}

export const [isTestRestarting, setIsTestRestarting] = createSignal(false);
export const [getKoreanStatus, setKoreanStatus] = createSignal(false);
export const [getLastEventLog, setLastEventLog] = createSignal<EventLog | null>(
  null,
);
