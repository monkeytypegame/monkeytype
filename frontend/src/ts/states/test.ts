import {
  createEffect,
  createMemo,
  createSignal,
  on,
  createRoot,
} from "solid-js";
import { z } from "zod";
import { getConfig } from "../config/store";
import { useLocalStorage } from "../hooks/useLocalStorage";

import { Challenge } from "@monkeytype/challenges";
import { FunboxName } from "@monkeytype/schemas/configs";
import { LayoutObject } from "@monkeytype/schemas/layouts";
import { getTestPhase } from "../test/engine/state";
import { CompletedEvent, IncompleteTest } from "@monkeytype/schemas/results";
import { createStore } from "solid-js/store";
import { createTrigger } from "../hooks/createTrigger";
import { createSignalWithSetters } from "../hooks/createSignalWithSetters";
import * as CustomText from "../test/custom-text";
import { requestDebouncedAnimationFrame } from "../utils/debounced-animation-frame";
import { isTestPageMounted } from "../test/test-page-bridge";
import { QuoteWithTextSplit } from "../types/quotes";
import { getLayout } from "../utils/json-data";
import type { Direction } from "../utils/strings";
import { mirrorLayoutKeys } from "../utils/key-converter";
import { canQuickRestart } from "../utils/quick-restart";
import { replaceUnderscoresWithSpaces } from "../utils/strings";
import { getCustomTextIndicator } from "./core";
import { useResourceWithPromise } from "../hooks/useResourceWithPromise";
import { clearTimeouts } from "../utils/misc";

// UI state of the test. Engine state (phase, words, active word index, timer,
// live stats, EventLog) lives in test/engine.

export const [getLoadedChallenge, setLoadedChallenge] =
  createSignal<Challenge | null>(null);
// What's on screen during a restart: set by TestPage only, around its fades.
// The engine's phase is already "restarting" (then "idle") meanwhile.
/** True while a restart fades the result out. */
export const [isResultLeaving, setResultLeaving] = createSignal(false);
/**
 * True from a restart's fade-out until the new test has faded in. Input waits
 * for it; other restart requests are dropped meanwhile.
 */
export const [isRestartAnimating, setRestartAnimating] = createSignal(false);

/**
 * From finish (the finish keystroke) until a restart has faded the result
 * out. Whether the result is rendered: isResultShown()
 */
export function isResultScreen(): boolean {
  return getTestPhase() === "finished" || isResultLeaving();
}

// focus mode: everything but the test hidden while typing, until the mouse
// moves (FocusModeExit). Not the same as testFocusState (out of focus).
const [isFocusMode, setFocusModeNow] = createSignal(false);
export { isFocusMode };

// value of a setFocusMode() call still waiting for its animation frame
let pendingFocusMode: boolean | undefined;

/**
 * Applied on the next animation frame so input handlers never render
 * synchronously. The last call before the frame wins.
 */
export function setFocusMode(value: boolean): void {
  // compare against the pending value too, otherwise set(false) right after
  // set(true) is ignored and the pending set(true) still applies
  if (value === (pendingFocusMode ?? isFocusMode())) return;
  pendingFocusMode = value;
  requestDebouncedAnimationFrame("focusMode", () => {
    pendingFocusMode = undefined;
    setFocusModeNow(value);
  });
}
// read by Words (#words blur), the composition display and OutOfFocusWarning.
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

export const showOutOfFocusWarning = createRoot(() =>
  createMemo(
    () => getConfig.showOutOfFocusWarning && testFocusState() !== "focused",
  ),
);

// max-height of the warning, kept in sync with the words wrapper by the words layout.
export const [outOfFocusMaxHeight, setOutOfFocusMaxHeight] = createSignal<
  number | undefined
>(undefined);

/** px, maxWidth in % of the words wrapper. undefined: the stylesheet's */
export type WordsInputPosition = {
  /** the input is centered vertically on it: the active word's letters */
  centerY: number;
  left: number;
  width?: number;
  maxWidth?: number;
};

// bound to #wordsInput by WordsInput, follows the active word
export const [wordsInputPosition, setWordsInputPosition] =
  createSignal<WordsInputPosition>({ centerY: 0, left: 0 });

// whether #wordsInput has focus, set by WordsInput on focus/blur: false while
// the window is out of focus. Words shows the caret while it's true
export const [isWordsInputFocused, setWordsInputFocused] = createSignal(false);

// Words scrolls the window to the active word on each request (during a test)
export const [trackScrollWindowToActiveWord, triggerScrollWindowToActiveWord] =
  createTrigger();

// dev options: shows #wordsInput below the words
export const [isRealWordsInputShown, setRealWordsInputShown] =
  createSignal(false);

// bound to #words by Words, #wordsWrapper by TestPage.
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

// funboxes that passed activation, cleared when the result shows or the test
// page unmounts. Funbox component derives the test-only funbox document state.
export const [getAppliedFunboxes, setAppliedFunboxes] = createSignal<
  FunboxName[]
>([]);

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

// IME composition in progress and its data so far, pushed from the
// composition events. Read by the input handlers, the caret and the
// composition display.
export const [isComposing, setComposing] = createSignal(false);
export const [getCompositionData, setCompositionData] = createSignal("");

createRoot(() =>
  createEffect(
    on(
      () => getConfig.showOutOfFocusWarning,
      (show) => {
        if (!show) setTestFocusState("focused");
      },
      { defer: true },
    ),
  ),
);
export const [isLongTest, setIsLongTest] = createSignal(false);
// a finished test's result, before the server adds hash and uid
export type CompletedResult = Omit<CompletedEvent, "hash" | "uid">;

export const [
  getIncompleteTests,
  { push: pushIncompleteTest, reset: resetIncompleteTests },
] = createSignalWithSetters<IncompleteTest[]>([])({
  push: (set, val: IncompleteTest) => set((arr) => [...arr, val]),
  reset: (set) => set([]),
});
export const getRestartCount = createRoot(() =>
  createMemo(() => getIncompleteTests().length),
);
export const getIncompleteSeconds = createRoot(() =>
  createMemo(() =>
    getIncompleteTests().reduce((sum, test) => sum + test.seconds, 0),
  ),
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

createRoot(() =>
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
  }),
);

export const getKeymapLayout = createRoot(() =>
  createMemo<{
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
  }),
);

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

const getInputLayout = createRoot(() =>
  createMemo<{
    layout: string;
    isMirrored: boolean;
  }>(() => {
    return {
      layout: getConfig.layout === "default" ? "qwerty" : getConfig.layout,
      isMirrored: getConfig.funbox.includes("layout_mirror"),
    };
  }),
);

const [inputLayoutObject, inputLayoutPromise] = createRoot(() =>
  useResourceWithPromise(getInputLayout, async (layout) => {
    const result = await getLayout(layout.layout);
    if (layout.isMirrored) {
      return mirrorLayoutKeys(result);
    }
    return result;
  }),
);

const [keymapLayoutObject, keymapLayoutPromise] = createRoot(() =>
  useResourceWithPromise(getKeymapLayout, async (layout) => {
    const result = await getLayout(layout.layout);
    if (layout.isMirrored) {
      return mirrorLayoutKeys(result);
    }
    return result;
  }),
);
export { keymapLayoutObject };

/** The keymap layout, once loaded. Throws if loading failed. */
export async function loadKeymapLayout(): Promise<LayoutObject> {
  await keymapLayoutPromise.promise;
  const result = keymapLayoutObject();
  if (result === undefined) {
    throw new Error("Failed to load keymap layout");
  }
  return result;
}

/** The layout typed with, once loaded. Throws if loading failed. */
export async function loadInputLayout(): Promise<LayoutObject> {
  await inputLayoutPromise.promise;
  const result = inputLayoutObject();
  if (result === undefined) {
    throw new Error("Failed to load input layout");
  }
  return result;
}

export const [getSelectedQuoteId, setSelectedQuoteId] = createRoot(() =>
  useLocalStorage({
    key: "selectedQuoteId",
    schema: z.number().int().min(1),
    fallback: 1,
  }),
);

export const [isLanguageRightToLeft, setIsLanguageRightToLeft] =
  createSignal(false);
export const [isDirectionReversed, setIsDirectionReversed] =
  createSignal(false);

/** Whether the test reads right to left: the language, unless reversed. */
export function isTestRightToLeft(): boolean {
  return isDirectionReversed()
    ? !isLanguageRightToLeft()
    : isLanguageRightToLeft();
}

export function getTestDirection(): Direction {
  return isTestRightToLeft() ? "rtl" : "ltr";
}
