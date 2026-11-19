import { getLocalPB, getUserData } from "../queries/user";
import {
  getRememberLazyMode,
  setRememberLazyMode,
  getPrefersArabicLazyMode,
  setPrefersArabicLazyMode,
} from "../states/lazy-mode";
import { isOnline, showOfflineBanner } from "../states/connection";
import Ape from "../ape";
import {
  batch,
  createEffect,
  createMemo,
  createRoot,
  on,
  untrack,
} from "solid-js";
import * as Strings from "../utils/strings";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Numbers from "@monkeytype/util/numbers";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
  removeNotification,
} from "../states/notifications";
import * as CustomText from "./custom-text";
import * as PractiseWords from "./practise-words";
import * as Funbox from "./funbox/funbox";
import * as PaceCaret from "./pace-caret";
import * as TestTimer from "./engine/test-timer";
import { saveLocalResult, SaveLocalResultData } from "../collections/results";
import * as Replay from "../components/pages/test/result/replay";
import { getActiveTags } from "../queries/tags";
import * as TodayTracker from "./today-tracker";
import * as ChallengeContoller from "../controllers/challenge-controller";
import { clearQuoteStats } from "../states/quote-rate";
import {
  getPbEligibility,
  getResultTags,
  showErrorCrownIfNeeded,
  updateCrown,
} from "./result-pb";
import { showConfetti } from "../elements/confetti";
import * as AdController from "../controllers/ad-controller";
import * as Arrays from "../utils/arrays";
import { getGlarsesMode } from "../states/glarses-mode";
import { getSarcasticResultMessage } from "../states/sarcastic-result-message";
import { closeResultWords, toggleResultWords } from "./words-history";
import { getCustomTextIndicator, isAuthenticated } from "../states/core";
import {
  setIsDirectionReversed,
  setIsLanguageRightToLeft,
  getCurrentQuote,
  getIncompleteSeconds,
  getIncompleteTests,
  getRestartCount,
  isPaceRepeat,
  isRepeated,
  pushIncompleteTest,
  resetIncompleteTests,
  setIsPaceRepeat,
  setIsRepeated,
  setLastResult,
  isResultCalculating,
  setLastSignedOutResult,
  setResultCalculating,
  isResultScreen,
  isRestartShowing,
  CompletedResult,
  setResultLoading,
  setTestInitError,
  setTestInitFailed,
  setJoiningScript,
  setTypingTestHidden,
  setComposing,
  setCompositionData,
  highlightKeymapKey,
  setFocusMode,
  setLayoutfluidTimerVisible,
  setTestFocusState,
  setWordsInputPosition,
} from "../states/test";
import {
  clearLiveStats,
  getActiveWordIndex,
  getTestEnd,
  getTestPhase,
  isTestActive,
  publishFrozenLog,
  setWordsInfo,
  type RestartOptions,
  type TestEnd,
} from "./engine/state";
import * as Engine from "./engine/commands";
import { TEST_SETTINGS_KEYS, getTestSettings } from "./engine/test-settings";
import { changeRequiresRestart } from "../config/metadata";
import "./timer-effects";
import * as TestWords from "./engine/test-words";
import * as WordsGenerator from "./words-generator";
import {
  fadeOutForFinish,
  focusWordsEvent,
  isTestPageMounted,
  testRestartedEvent,
} from "./test-page-bridge";
import { configEvent } from "../events/config";
import { canStartTest } from "../states/router";
import objectHash from "object-hash";
import * as AnalyticsController from "../controllers/analytics-controller";
import { getAuthenticatedUser } from "../firebase";
import { Mode } from "@monkeytype/schemas/shared";
import {
  CompletedEvent,
  CompletedEventCustomText,
} from "@monkeytype/schemas/results";
import {
  findSingleActiveFunboxWithFunction,
  getActiveFunboxes,
  getActiveFunboxesWithFunction,
  getActiveFunboxNames,
  isFunboxActive,
  isFunboxActiveWithProperty,
} from "./funbox/list";
import { getFunbox } from "@monkeytype/funbox";
import type { NormalizedLocalResult } from "../collections/results";
import { WordGenError } from "../utils/word-gen-error";
import { tryCatch } from "@monkeytype/util/trycatch";
import * as Sentry from "../sentry";
import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
import { canQuickRestart } from "../utils/quick-restart";
import {
  ResultDetails,
  setResultShown,
  resultState,
  setResultState,
  setCrownType,
} from "../states/result";
import { blurInputElement, setInputElementValue } from "../input/input-element";
import { debounce } from "throttle-debounce";
import { setAccountButtonSpinner } from "../states/header";
import { Config, getConfig } from "../config/store";
import { setQuoteLengthAll, toggleFunbox, setConfig } from "../config/setters";
import { buildEventLog } from "./engine/events/data";
import {
  getKeypressDurations,
  getChars,
  getBurstHistory,
  getLastKeypressToEndMs,
  getStartToFirstKeypressMs,
  getTestDurationMs,
  getAccuracy,
  getKeypressOverlap,
  getErrorCountHistory,
  getWpmHistory,
  getAfkDuration,
  getIncompleteTestSeconds,
  getDateBasedTestDurationMs,
  getInputHistory,
  getKeypressesPerSecond,
  getKeypressSpacing,
} from "./engine/events/stats";
import { getLiveCachedAccuracy } from "./engine/events/live-cache";
import { calculateWpm } from "../utils/numbers";
import { EventLog } from "./engine/events/types";
import { resetModifierState } from "../states/modifiers";
import { nthElementFromArray } from "../utils/arrays";
import {
  appendRenderedWord,
  replaceWords,
  resetWordsRender,
} from "../states/words-render";

let slowTimerNotificationIds: number[] = [];

export function startTest(now: number): boolean {
  if (!canStartTest()) return false;

  if (isAuthenticated()) {
    void AnalyticsController.log("testStarted");
  } else {
    void AnalyticsController.log("testStartedNoLogin");
  }

  Engine.start();
  for (const id of slowTimerNotificationIds) {
    removeNotification(id, "clear");
  }
  slowTimerNotificationIds = [];

  for (const fb of getActiveFunboxesWithFunction("start")) {
    fb.functions.start();
  }

  try {
    if (Config.paceCaret !== "off" || (Config.repeatedPace && isPaceRepeat())) {
      PaceCaret.start();
    }
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  void TestTimer.start(now, {
    onFinish: () => void finish(),
    onFail: fail,
  });
  setFocusMode(true);
  return true;
}

function recordIncompleteTest(): void {
  if (!Config.resultSaving) return;
  // Finalize the abandoned test before measuring it: logging the timer
  // "end" event gives getAfkDuration its interval boundaries, so idle time
  // is actually subtracted. Without it AFK is always 0 and the full
  // wall-clock lifetime (incl. unbounded idle) leaks into the result.
  TestTimer.clear(true);
  const liveEventLog = buildEventLog();
  const tt = getIncompleteTestSeconds(liveEventLog);
  const acc = Numbers.roundTo2(getLiveCachedAccuracy() ?? 100);
  pushIncompleteTest({ acc, seconds: tt });
}

function resetTestState(): void {
  Engine.reset();
  resetModifierState();
  Replay.pauseReplay();
  PaceCaret.reset();
  clearQuoteStats();
  setComposing(false);
  setCompositionData("");
  testReinitCount = 0;
}

/**
 * Stops the current test without generating a new one (e.g. when leaving the
 * test page). Ignores the no_quit funbox.
 */
export function stop(): void {
  if (getTestPhase() === "restarting" || isResultCalculating()) return;

  if (isTestActive()) recordIncompleteTest();
  resetTestState();
}

/** Ends the test when leaving the test page. Keystrokes after this don't reach the test. */
export function leaveTestPage(): void {
  stop();
  blurInputElement();
}

type RestartRequestOptions = Partial<RestartOptions> & {
  nosave?: boolean;
  event?: KeyboardEvent;
  isQuickRestart?: boolean;
  /** A test setting changed: queues a restart even after the settings were taken. */
  settingsChanged?: boolean;
};

/**
 * Requests a restart. Starts one: closes out the current test, and generates
 * the new one at once (prepareRestart) while TestPage fades the old one out.
 * During a restart, or while it's still on screen, only a settings change
 * counts: it supersedes the generation in progress (or restarts the new test
 * fading in). Other requests are dropped: the test they ask for is coming.
 */
// true while a request runs: config it reverts (practise words) restarts
// with it, not again
let requesting = false;

export async function restartTest(
  options = {} as RestartRequestOptions,
): Promise<void> {
  // not on the test page - TestPage restarts on mount
  if (!untrack(isTestPageMounted)) return;
  if (requesting) return;
  requesting = true;
  try {
    requestRestart(options);
  } finally {
    requesting = false;
  }
}

function requestRestart(options: RestartRequestOptions): void {
  const restarting = getTestPhase() === "restarting";
  if (restarting || untrack(isRestartShowing)) {
    options.event?.preventDefault();
    if (!(options.settingsChanged ?? false)) return;
    if (restarting) {
      void prepareRestart(Engine.requestRestart({}));
      return;
    }
  }

  const noQuit = isFunboxActive("no_quit");
  if (isTestActive() && noQuit) {
    showNoticeNotification(
      "No quit funbox is active. Please finish the test.",
      {
        important: true,
      },
    );
    options.event?.preventDefault();
    return;
  }

  if (isResultCalculating()) {
    options.event?.preventDefault();
    return;
  }

  let withSameWordset = options.withSameWordset ?? false;

  if (isTestActive()) {
    if (options.isQuickRestart) {
      if (getTestSettings().mode !== "zen") options.event?.preventDefault();
      if (
        !canQuickRestart(
          getTestSettings().mode,
          getTestSettings().words,
          getTestSettings().time,
          getTestSettings().customText,
          getCustomTextIndicator()?.isLong ?? false,
        )
      ) {
        let message = "Use your mouse to confirm.";
        if (Config.quickRestart === "tab") {
          message = "Press shift + tab or use your mouse to confirm.";
        } else if (Config.quickRestart === "esc") {
          message = "Press shift + escape or use your mouse to confirm.";
        } else if (Config.quickRestart === "enter") {
          message = "Press shift + enter or use your mouse to confirm.";
        }
        showNoticeNotification(
          `Quick restart disabled in long tests. ${message}`,
          {
            durationMs: 4000,
            important: true,
          },
        );
        return;
      }
    }

    // close out the abandoned test

    if (isRepeated()) {
      withSameWordset = true;
    }

    recordIncompleteTest();
  }

  const currentQuote = getCurrentQuote();
  if (
    getTestSettings().mode === "quote" &&
    currentQuote !== null &&
    getTestSettings().language.startsWith(currentQuote.language) &&
    Config.repeatQuotes === "typing" &&
    (isTestActive() || getTestEnd()?.type === "failed")
  ) {
    withSameWordset = true;
  }

  if (
    PractiseWords.before.mode !== null &&
    !withSameWordset &&
    !(options.practiseMissed ?? false)
  ) {
    showNoticeNotification("Reverting to previous settings.");
    if (PractiseWords.before.punctuation !== null) {
      setConfig("punctuation", PractiseWords.before.punctuation);
    }
    if (PractiseWords.before.numbers !== null) {
      setConfig("numbers", PractiseWords.before.numbers);
    }

    if (PractiseWords.before.customText) {
      CustomText.setText(PractiseWords.before.customText.text);
      CustomText.setLimitMode(PractiseWords.before.customText.limit.mode);
      CustomText.setLimitValue(PractiseWords.before.customText.limit.value);
      CustomText.setPipeDelimiter(
        PractiseWords.before.customText.pipeDelimiter,
      );
    }

    setConfig("mode", PractiseWords.before.mode);
    PractiseWords.resetBefore();
  }

  resetTestState();

  void prepareRestart(
    Engine.requestRestart({
      withSameWordset,
      practiseMissed: options.practiseMissed,
      noAnim: options.noAnim,
    }),
  );
}

// whether the last committed restart generated a test (init didn't give up)
let restartGenerated = false;

/**
 * Generates the new test for the restart holding `token`, while TestPage
 * fades the old one out. Gives up at the next step once superseded.
 */
async function prepareRestart(token: number): Promise<void> {
  testReinitCount = 0;

  await Funbox.rememberSettings();
  if (!Engine.isCurrentRestart(token)) return;

  const initResult = await init(token);
  if (initResult === "superseded") return;

  if (initResult === "ok") {
    await PaceCaret.init();
    if (!Engine.isCurrentRestart(token)) return;
    for (const fb of getActiveFunboxesWithFunction("restart")) {
      fb.functions.restart();
    }
  }

  restartGenerated = initResult === "ok";
  // TestPage swaps it in (showRestartedTest) once the old test faded out
  Engine.commitRestart(token);
}

/**
 * TestPage, once the old test has faded out and the restart committed: shows
 * the new test while hidden. Outside effects and batches: replaceWords
 * measures the new words as they render.
 */
export function showRestartedTest(source: "testPage" | "resultPage"): void {
  if (!restartGenerated) return;
  setInputElementValue("");
  setResultShown(false);
  setTypingTestHidden(false);
  setWordsInputPosition((position) => ({ ...position, left: 0 }));
  setFocusMode(false);
  clearLiveStats();
  setLayoutfluidTimerVisible(false);
  setTestInitFailed(false);
  setTestInitError(null);
  // while hidden: focusing restarts the caret's blink. Input waits for the
  // fade-in (isRestartShowing)
  focusWordsEvent.dispatch({ force: true });
  if (!isOnline()) {
    showOfflineBanner();
  }
  testRestartedEvent.dispatch(source);
  replaceWords(
    getTestSettings().mode === "zen"
      ? [{ display: "" }]
      : TestWords.words.get(),
    {
      activeWordIndex: getActiveWordIndex(),
      zen: getTestSettings().mode === "zen",
    },
  );
}

// Changing a test setting restarts the test: one restart, however many
// change (a preset applies them in one batch). T7: moves into the engine with
// the request steps above.
createRoot(() => {
  for (const key of TEST_SETTINGS_KEYS) {
    // serialized, so changes inside arrays (funbox, quote length) count
    const value = createMemo(() => JSON.stringify(getConfig[key]));
    createEffect(
      on(
        value,
        () => {
          if (!changeRequiresRestart(key, Config)) return;
          void restartTest({ settingsChanged: true });
        },
        { defer: true },
      ),
    );
  }
});

let lastInitError: Error | null = null;
let showedLazyModeNotification: boolean = false;
let testReinitCount = 0;

/** Generates the test's words. "superseded": a newer restart took over. */
async function init(token: number): Promise<"ok" | "failed" | "superseded"> {
  console.debug("Initializing test");
  testReinitCount++;
  if (testReinitCount > 3) {
    if (lastInitError) {
      void Sentry.captureException(lastInitError);
      setTestInitError(`${lastInitError.name}: ${lastInitError.message}`);
    }
    setTestInitFailed(true);
    return "failed";
  }

  TestWords.resetWords();

  showLoaderBar();
  const { data: language, error } = await tryCatch(
    JSONData.getLanguage(Config.language),
  );
  hideLoaderBar();
  if (!Engine.isCurrentRestart(token)) return "superseded";

  if (error) {
    showErrorNotification("Failed to load language", { error });
  }

  if (!language || language.name !== Config.language) {
    return await init(token);
  }

  // the page may have unmounted while loading the language
  if (untrack(isTestPageMounted)) {
    await Funbox.activate();
    if (!Engine.isCurrentRestart(token)) return "superseded";
  }

  if (Config.mode === "quote") {
    if (Config.quoteLength.includes(-3) && !isAuthenticated()) {
      setQuoteLengthAll();
    }
  }

  const allowLazyMode = !language.noLazyMode || Config.mode === "custom";

  // polyglot mode, check to enable lazy mode if any support it
  if (getActiveFunboxNames().includes("polyglot")) {
    const polyglotLanguages = Config.customPolyglot;
    const languagePromises = polyglotLanguages.map(async (langName) => {
      const { data: lang, error } = await tryCatch(
        JSONData.getLanguage(langName),
      );
      if (error) {
        showErrorNotification(`Failed to load language: ${langName}`, {
          error,
        });
      }
      return lang;
    });

    const anySupportsLazyMode = (await Promise.all(languagePromises))
      .filter((lang) => lang !== null)
      .some((lang) => !lang.noLazyMode);
    if (!Engine.isCurrentRestart(token)) return "superseded";

    if (Config.lazyMode && !anySupportsLazyMode) {
      setRememberLazyMode(true);
      if (!showedLazyModeNotification) {
        showNoticeNotification(
          "None of the selected polyglot languages support lazy mode.",
          {
            important: true,
          },
        );
        showedLazyModeNotification = true;
      }
      setConfig("lazyMode", false);
    } else if (getRememberLazyMode() && anySupportsLazyMode) {
      setConfig("lazyMode", true);
      setRememberLazyMode(false);
      showedLazyModeNotification = false;
    }
  } else {
    // normal mode
    if (Config.lazyMode && !allowLazyMode) {
      setRememberLazyMode(true);
      if (!showedLazyModeNotification) {
        showNoticeNotification("This language does not support lazy mode.", {
          important: true,
        });
        showedLazyModeNotification = true;
      }
      setConfig("lazyMode", false);
    } else if (getRememberLazyMode() && allowLazyMode) {
      setConfig("lazyMode", true);
      setRememberLazyMode(false);
      showedLazyModeNotification = false;
    }
  }

  if (!Config.lazyMode && !language.noLazyMode) {
    setRememberLazyMode(false);
  }

  if (Config.mode === "custom") {
    console.debug("Custom text", CustomText.getData());
  }

  console.log("Inializing test", {
    language: {
      ...language,
      words: `${language.words.length} words`,
    },
    customText: {
      ...CustomText.getData(),
      text: `${CustomText.getText().length} words`,
    },
    mode: Config.mode,
    mode2: Misc.getMode2(Config, null),
    funbox: Config.funbox,
    currentQuote: getCurrentQuote(),
  });

  // words resolve their direction from these as they're pushed
  setIsLanguageRightToLeft(language.rightToLeft ?? false);
  setIsDirectionReversed(isFunboxActiveWithProperty("reverseDirection"));

  // the words are generated from the settings as they are now: a settings
  // change from here on supersedes this generation
  const { withSameWordset } = Engine.takeTestSettingsForRestart(
    CustomText.getData(),
  );
  setIsRepeated(withSameWordset);
  setIsPaceRepeat(Config.repeatedPace && withSameWordset);

  let wordsHaveTab = false;
  let wordsHaveNewline = false;
  let wordsHaveNumbers = false;
  let wordsKoreanStatus = false;
  let allJoiningScript: boolean | undefined = undefined;
  let generatedWords: string[] = [];
  let generatedSectionIndexes: number[] = [];
  try {
    const gen = await WordsGenerator.generateWords(language);
    if (!Engine.isCurrentRestart(token)) return "superseded";
    generatedWords = gen.words;
    generatedSectionIndexes = gen.sectionIndexes;
    wordsHaveTab = gen.hasTab;
    wordsHaveNewline = gen.hasNewline;
    wordsHaveNumbers = gen.hasNumbers;
    wordsKoreanStatus = gen.hasKorean;
    ({ allJoiningScript } = gen);
  } catch (e) {
    hideLoaderBar();
    if (e instanceof WordGenError || e instanceof Error) {
      lastInitError = e;
    }
    console.error(e);
    if (e instanceof WordGenError) {
      if (e.message.length > 0) {
        showNoticeNotification(e.message, {
          important: true,
        });
      }
    } else {
      showErrorNotification("Failed to generate words", {
        error: e,
        important: true,
      });
    }

    return await init(token);
  }

  setWordsInfo({
    hasNumbers: wordsHaveNumbers,
    hasTab: wordsHaveTab,
    hasNewline: wordsHaveNewline,
    hasKorean: wordsKoreanStatus,
  });

  for (let i = 0; i < generatedWords.length; i++) {
    TestWords.pushWord(
      generatedWords[i] as string,
      generatedSectionIndexes[i] as number,
    );
  }

  if (WordsGenerator.areAllWordsGenerated()) {
    TestWords.removeCommitCharFromLastWord();
  }

  if (Config.keymapMode === "next" && getTestSettings().mode !== "zen") {
    highlightKeymapKey(
      nthElementFromArray(
        // ignoring for now but this might need a different approach
        // oxlint-disable-next-line no-misused-spread
        [...(TestWords.words.getCurrent()?.text ?? "")],
        0,
      ) as string,
    );
  }

  Funbox.toggleScript(TestWords.words.getCurrent()?.text ?? "");
  setJoiningScript(
    (allJoiningScript ?? language.joiningScript ?? false) ||
      getTestSettings().mode === "custom" ||
      getTestSettings().mode === "zen",
  );

  console.debug("Test initialized with words", TestWords.words.get());
  console.debug(
    "Test initialized with section indexes",
    generatedSectionIndexes,
  );
  return "ok";
}

//add word during the test
export async function addWord(): Promise<void> {
  if (getTestSettings().mode === "zen") {
    appendRenderedWord({ display: "" });
    return;
  }

  let bound = 100; // how many extra words to aim for AFTER the current word

  const funboxToPush =
    getActiveFunboxes()
      .flatMap((fb) => fb.properties ?? [])
      .find((prop) => prop.startsWith("toPush:")) ?? "";

  const toPushCount = funboxToPush?.split(":")[1];
  if (toPushCount !== undefined) bound = +toPushCount - 1;

  if (TestWords.words.length - (getActiveWordIndex() + 1) > bound) {
    console.debug("Not adding word, enough words already");
    return;
  }
  if (WordsGenerator.areAllWordsGenerated()) {
    console.debug("Not adding word, all words generated");
    return;
  }
  const sectionFunbox = findSingleActiveFunboxWithFunction("pullSection");
  if (sectionFunbox) {
    if (TestWords.words.length - getActiveWordIndex() < 20) {
      const section = await sectionFunbox.functions.pullSection(
        getTestSettings().language,
      );

      if (section === false) {
        showErrorNotification(
          "Error while getting section. Please try again later",
        );
        toggleFunbox(sectionFunbox.name);
        void restartTest();
        return;
      }

      if (section === undefined) return;

      let wordCount = 0;
      for (let i = 0; i < section.words.length; i++) {
        const word = section.words[i] as string;
        if (
          wordCount >= getTestSettings().words &&
          getTestSettings().mode === "words"
        ) {
          break;
        }
        wordCount++;
        const newWord = TestWords.pushWord(
          WordsGenerator.appendCommitCharacter(word),
          i,
        );
        appendRenderedWord(newWord);
      }
    }
  }

  try {
    const randomWord = await WordsGenerator.getNextWord(
      TestWords.words.length,
      bound,
      TestWords.words.get(TestWords.words.length - 1)?.text ?? "",
      TestWords.words.get(TestWords.words.length - 2)?.text,
    );

    const newWord = TestWords.pushWord(
      randomWord.word,
      randomWord.sectionIndex,
    );
    appendRenderedWord(newWord);
  } catch (e) {
    fail("word generation error");
    showErrorNotification(
      "Error while getting next word. Please try again later",
      {
        error: e,
        important: true,
      },
    );
  }

  // strip the trailing commit separator once the final word has been generated
  // (covers the section and lazy paths)
  if (WordsGenerator.areAllWordsGenerated()) {
    TestWords.removeCommitCharFromLastWord();
  }
}

let retrySavingEvent: CompletedEvent | null = null;

export async function retrySavingResult(): Promise<void> {
  const completedEvent = retrySavingEvent;

  if (completedEvent === null) {
    showNoticeNotification(
      "Could not retry saving the result as the result no longer exists.",
      {
        durationMs: 5000,
        important: true,
      },
    );

    return;
  }

  if (!resultState.canRetrySaving) {
    return;
  }

  setResultState("canRetrySaving", false);

  showNoticeNotification("Retrying to save...");

  await saveResult(completedEvent, true);
}

function buildCompletedEvent(eventLog: EventLog): CompletedResult {
  const chars = getChars(eventLog);

  //tags
  const activeTagsIds: string[] = getActiveTags().map((tag) => tag._id);

  let language = getTestSettings().language;
  if (getTestSettings().mode === "quote") {
    language = Strings.removeLanguageSize(getTestSettings().language);
  }

  let customText: CompletedEventCustomText | undefined = undefined;
  if (getTestSettings().mode === "custom") {
    const temp = getTestSettings().customText;
    customText = {
      textLen: temp.text.length,
      mode: temp.mode,
      pipeDelimiter: temp.pipeDelimiter,
      limit: { ...temp.limit },
    };
  }

  let duration = getTestDurationMs(eventLog) / 1000;

  const rawPerSecond = getBurstHistory(eventLog);
  const afkDuration = getAfkDuration(eventLog);
  const stddev = Numbers.stdDev(rawPerSecond);
  const avg = Numbers.mean(rawPerSecond);
  let consistency = Numbers.roundTo2(Numbers.kogasa(stddev / avg));
  if (!consistency || isNaN(consistency)) {
    consistency = 0;
  }

  const keypressSpacing = getKeypressSpacing(eventLog);

  let keyConsistencyArray = [...keypressSpacing];
  if (keypressSpacing.length > 0) {
    keyConsistencyArray = keyConsistencyArray.slice(
      0,
      keyConsistencyArray.length - 1,
    );
  }
  const keyStddev = Numbers.stdDev(keyConsistencyArray);
  const keyAvg = Numbers.mean(keyConsistencyArray);
  let keyConsistency = Numbers.roundTo2(Numbers.kogasa(keyStddev / keyAvg));
  if (!keyConsistency || isNaN(keyConsistency)) {
    keyConsistency = 0;
  }

  const wpmHistory = getWpmHistory(eventLog);
  const wpmCons = Numbers.roundTo2(
    Numbers.kogasa(Numbers.stdDev(wpmHistory) / Numbers.mean(wpmHistory)),
  );
  const wpmConsistency = isNaN(wpmCons) ? 0 : wpmCons;

  const chartData = {
    wpm: wpmHistory,
    burst: rawPerSecond,
    err: getErrorCountHistory(eventLog),
  };

  const currentQuote = getCurrentQuote();
  const completedEvent: CompletedResult = {
    wpm: Numbers.roundTo2(calculateWpm(chars.correctWord, duration)),
    rawWpm: Numbers.roundTo2(
      calculateWpm(chars.allCorrect + chars.incorrect + chars.extra, duration),
    ),
    charStats: [chars.correctWord, chars.incorrect, chars.extra, chars.missed],
    charTotal: chars.allCorrect + chars.incorrect + chars.extra,
    acc: Numbers.roundTo2(getAccuracy(eventLog).percentage ?? 0),
    language: language,
    testDuration: duration,
    lastKeyToEnd: getLastKeypressToEndMs(eventLog),
    startToFirstKey: getStartToFirstKeypressMs(eventLog),
    afkDuration: afkDuration,
    quoteLength: currentQuote?.group ?? -1,
    customText: customText,
    tags: activeTagsIds,
    punctuation: getTestSettings().punctuation,
    numbers: getTestSettings().numbers,
    lazyMode: getTestSettings().lazyMode,
    timestamp: Date.now(),
    mode: getTestSettings().mode,
    mode2: Misc.getMode2(getTestSettings(), currentQuote),
    bailedOut: getTestEnd()?.type === "bailedOut",
    funbox: [...getTestSettings().funbox],
    difficulty: getTestSettings().difficulty,
    blindMode: Config.blindMode,
    stopOnLetter: getTestSettings().stopOnError === "letter",
    restartCount: getRestartCount(),
    incompleteTests: getIncompleteTests(),
    incompleteTestSeconds:
      getIncompleteSeconds() < 0 ? 0 : Numbers.roundTo2(getIncompleteSeconds()),

    consistency: consistency,
    wpmConsistency: wpmConsistency,
    keyConsistency: keyConsistency,
    chartData: chartData,

    keySpacing: keypressSpacing,
    keyDuration: getKeypressDurations(eventLog),
    keyOverlap: getKeypressOverlap(eventLog),
  };

  if (completedEvent.mode !== "custom") delete completedEvent.customText;
  if (completedEvent.mode !== "quote") delete completedEvent.quoteLength;

  return completedEvent;
}

/** Ends the test: completed by default, or bailed out / failed (see fail()). */
export async function finish(
  end: TestEnd = { type: "completed" },
): Promise<void> {
  if (!isTestActive()) return;
  Engine.recordEnd(end);
  const bailedOut = end.type === "bailedOut";
  const failReason = end.type === "failed" ? end.reason : null;
  setResultCalculating(true);
  const now = performance.now();
  TestTimer.clear(true, now);

  // fade out the test and show loading
  // because the css animation has a delay,
  // if the test calculation is fast the loading will not show
  await fadeOutForFinish();
  setTypingTestHidden(true);
  setResultLoading(true);
  await Misc.sleep(0); //allow ui update

  setTestFocusState("focused");

  if (isRepeated() && getTestSettings().mode === "quote") {
    setIsRepeated(false);
  }

  const eventLog = Engine.finish();
  const difficultyFailed = failReason !== null;
  const ce = buildCompletedEvent(eventLog);
  PaceCaret.setLastTestWpm(ce.wpm);

  console.debug("Completed event object", ce);

  function countUndefined(input: unknown): number {
    if (typeof input === "number") {
      return isNaN(input) ? 1 : 0;
    } else if (typeof input === "undefined") {
      return 1;
    } else if (typeof input === "object" && input !== null) {
      return Object.values(input).reduce(
        (a, b) => (a + countUndefined(b)) as number,
        0,
      ) as number;
    } else {
      return 0;
    }
  }

  let dontSave = false;
  // T6c: the engine returns validity with its result
  let invalid = false;

  if (countUndefined(ce) > 0) {
    console.log(ce);
    showErrorNotification(
      "Failed to build result object: One of the fields is undefined or NaN",
    );
    dontSave = true;
  }

  const completedEvent = structuredClone(ce) as CompletedEvent;

  batch(() => {
    publishFrozenLog();
    setLastResult(structuredClone(completedEvent));
  });

  ///////// completed event ready

  //afk check
  let afkDetected = getKeypressesPerSecond(eventLog)
    .slice(-5)
    .every((kps) => kps === 0);
  if (bailedOut) afkDetected = false;

  const mode2Number = parseInt(completedEvent.mode2);

  let tooShort = false;
  //fail checks
  const dateDur = getDateBasedTestDurationMs(eventLog) / 1000;
  if (
    getTestSettings().mode === "time" &&
    !bailedOut &&
    (ce.testDuration < dateDur - 0.1 || ce.testDuration > dateDur + 0.1) &&
    ce.testDuration <= 120
  ) {
    showNoticeNotification("Test invalid - inconsistent test duration");
    console.error("Test duration inconsistent", ce.testDuration, dateDur);
    invalid = true;
    dontSave = true;
  } else if (difficultyFailed) {
    showNoticeNotification(`Test failed - ${failReason}`, {
      durationMs: 1000,
    });
    dontSave = true;
  } else if (
    completedEvent.testDuration < 1 ||
    (getTestSettings().mode === "time" &&
      mode2Number < 15 &&
      mode2Number > 0) ||
    (getTestSettings().mode === "time" &&
      mode2Number === 0 &&
      completedEvent.testDuration < 15) ||
    (getTestSettings().mode === "words" &&
      mode2Number < 10 &&
      mode2Number > 0) ||
    (getTestSettings().mode === "words" &&
      mode2Number === 0 &&
      completedEvent.testDuration < 15) ||
    (getTestSettings().mode === "custom" &&
      (getTestSettings().customText.limit.mode === "word" ||
        getTestSettings().customText.limit.mode === "section") &&
      getTestSettings().customText.limit.value < 10) ||
    (getTestSettings().mode === "custom" &&
      getTestSettings().customText.limit.mode === "time" &&
      getTestSettings().customText.limit.value < 15) ||
    (getTestSettings().mode === "zen" && completedEvent.testDuration < 15)
  ) {
    showNoticeNotification("Test invalid - too short");
    invalid = true;
    tooShort = true;
    dontSave = true;
  } else if (afkDetected) {
    showNoticeNotification("Test invalid - AFK detected");
    invalid = true;
    dontSave = true;
  } else if (isRepeated()) {
    showNoticeNotification("Test invalid - repeated");
    invalid = true;
    dontSave = true;
  } else if (
    completedEvent.wpm < 0 ||
    (completedEvent.wpm > 350 &&
      completedEvent.mode !== "words" &&
      completedEvent.mode2 !== "10") ||
    (completedEvent.wpm > 420 &&
      completedEvent.mode === "words" &&
      completedEvent.mode2 === "10")
  ) {
    showNoticeNotification("Test invalid - wpm");
    invalid = true;
    dontSave = true;
  } else if (
    completedEvent.rawWpm < 0 ||
    (completedEvent.rawWpm > 350 &&
      completedEvent.mode !== "words" &&
      completedEvent.mode2 !== "10") ||
    (completedEvent.rawWpm > 420 &&
      completedEvent.mode === "words" &&
      completedEvent.mode2 === "10")
  ) {
    showNoticeNotification("Test invalid - raw");
    invalid = true;
    dontSave = true;
  } else if (
    (!getUserData()?.lbOptOut &&
      (completedEvent.acc < 75 || completedEvent.acc > 100)) ||
    (getUserData()?.lbOptOut === true &&
      (completedEvent.acc < 50 || completedEvent.acc > 100))
  ) {
    showNoticeNotification("Test invalid - accuracy");
    invalid = true;
    dontSave = true;
  }

  // test is valid

  if (isRepeated() || difficultyFailed) {
    if (Config.resultSaving) {
      pushIncompleteTest({
        acc: completedEvent.acc,
        seconds: getIncompleteTestSeconds(eventLog),
      });
    }
  }

  const customTextName = getCustomTextIndicator()?.name ?? "";
  const isLong = getCustomTextIndicator()?.isLong === true;
  if (getTestSettings().mode === "custom" && customTextName !== "" && isLong) {
    // Let's update the custom text progress
    if (
      bailedOut ||
      getInputHistory(eventLog).length < TestWords.words.length
    ) {
      // They bailed out

      const history = getInputHistory(eventLog);
      let historyLength = history?.length;
      const wordIndex = historyLength - 1;

      const lastWordInputLength = history[wordIndex]?.length ?? 0;

      // compare against display.length (not textWithCommit.length): the input
      // history holds the typed letters, not the committing space separator, so
      // a space word is "complete" at text.length. display includes a newline
      // commit, which is a required typed char.
      if (
        lastWordInputLength <
        (TestWords.words.get(wordIndex)?.display.length ?? 0)
      ) {
        historyLength--;
      }

      const newProgress =
        CustomText.getCustomTextLongProgress(customTextName) + historyLength;
      CustomText.setCustomTextLongProgress(customTextName, newProgress);
      showSuccessNotification("Long custom text progress saved", {
        durationMs: 5000,
        important: true,
      });

      let newText = CustomText.getCustomText(customTextName, true);
      newText = newText.slice(newProgress);
      CustomText.setText(newText);
    } else {
      // They finished the test
      CustomText.setCustomTextLongProgress(customTextName, 0);
      const text = CustomText.getCustomText(customTextName, true);
      CustomText.setText(text);
      showSuccessNotification("Long custom text completed", {
        durationMs: 5000,
        important: true,
      });
    }
  }

  TodayTracker.addSeconds(
    completedEvent.testDuration - completedEvent.afkDuration,
  );
  setResultState("timeToday", TodayTracker.getString());

  let savingResultPromise: ReturnType<typeof saveResult> =
    Promise.resolve(null);
  const user = getAuthenticatedUser();
  if (user !== null) {
    // logged in
    if (dontSave) {
      void AnalyticsController.log("testCompletedInvalid");
    } else {
      resetIncompleteTests();

      if (!completedEvent.bailedOut) {
        const challenge = ChallengeContoller.verify(completedEvent);
        if (challenge !== null) completedEvent.challenge = challenge;
      }

      completedEvent.uid = user.uid;

      savingResultPromise = saveResult(completedEvent, false);
      void savingResultPromise.then((response) => {
        if (response?.status === 200) {
          void AnalyticsController.log("testCompleted");
        }
      });
    }
  } else {
    // logged out
    void AnalyticsController.log("testCompletedNoLogin");
    if (!dontSave) {
      // if its valid save it for later
      setLastSignedOutResult(completedEvent);
    }
    dontSave = true;
  }

  const resultUpdatePromise = showResult(completedEvent, dontSave, {
    difficultyFailed,
    failReason: failReason ?? "",
    afkDetected,
    isRepeated: isRepeated(),
    tooShort,
    invalid,
    stopOnError: getTestSettings().stopOnError,
    deleteOnError: Config.deleteOnError,
    quote: getTestSettings().mode === "quote" ? getCurrentQuote() : null,
  });

  await Promise.all([savingResultPromise, resultUpdatePromise]);
}

const sarcasticMessages = [
  "Congratulations. You just wasted {time} seconds of your life by typing nothing. Be proud of yourself.",
  "Bravo! You've managed to waste {time} seconds and accomplish exactly zero. A true productivity icon.",
  "That was {time} seconds of absolutely legendary idleness. History will remember this moment.",
  "Wow, {time} seconds of typing... nothing. Bold. Mysterious. Completely useless.",
  "Thank you for those {time} seconds of utter nothingness. The keyboard needed the break.",
  "A breathtaking display of inactivity. {time} seconds of absolutely nothing. Powerful.",
  "You just gave {time} seconds of your life to the void. And the void says thanks.",
  "Stunning. {time} seconds of intense... whatever that wasn't. Keep it up, champ.",
  "Is it performance art? A protest? Or just {time} seconds of glorious nothing? We may never know.",
  "You typed nothing for {time} seconds. And in that moment, you became legend.",
];

async function showResult(
  result: CompletedEvent,
  dontSave: boolean,
  details: ResultDetails,
): Promise<void> {
  closeResultWords();
  Replay.resetReplay();
  blurInputElement();

  if (!isOnline()) {
    showOfflineBanner();
  }

  const pbEligibility = getPbEligibility(result, dontSave);
  updateCrown(result, pbEligibility);
  setResultState({
    details,
    tags: getResultTags(result, pbEligibility),
    resultId: "",
    dailyLeaderboardRank: undefined,
    canRetrySaving: false,
  });

  if (getGlarsesMode()) {
    console.log(
      `Test Completed: ${result.wpm} wpm ${result.acc}% acc ${result.rawWpm} raw ${result.consistency}% consistency`,
    );
  }

  if (
    result.wpm === 0 &&
    !details.difficultyFailed &&
    result.testDuration >= 5 &&
    getSarcasticResultMessage()
  ) {
    const message = Arrays.randomElementFromArray(sarcasticMessages).replace(
      "{time}",
      Math.round(result.testDuration).toString(),
    );
    showConfetti();
    showNoticeNotification(message, {
      customTitle: "Nice",
      durationMs: 15000,
      important: true,
    });
  }

  setFocusMode(false);

  const canQuickRestartTest = canQuickRestart(
    getTestSettings().mode,
    getTestSettings().words,
    getTestSettings().time,
    getTestSettings().customText,
    getCustomTextIndicator()?.isLong ?? false,
  );
  if (
    Config.alwaysShowWordsHistory &&
    canQuickRestartTest &&
    !getGlarsesMode()
  ) {
    toggleResultWords(true);
  }
  void Funbox.clear();

  setResultLoading(false);
  setResultShown(true);

  void AdController.renderResult();
  setResultCalculating(false);
  // the result is shown: free the test words DOM
  resetWordsRender();
}

async function saveResult(
  completedEvent: CompletedEvent,
  isRetrying: boolean,
): Promise<null | Awaited<ReturnType<typeof Ape.results.add>>> {
  if (!Config.resultSaving) {
    showErrorNotification("Result not saved: disabled by user", {
      durationMs: 3000,
      customTitle: "Notice",
      important: true,
    });
    return null;
  }

  const result = structuredClone(completedEvent);

  if (result.testDuration > 122) {
    result.chartData = "toolong";
    result.keySpacing = "toolong";
    result.keyDuration = "toolong";
  }
  //@ts-expect-error just in case this is repeated and already has a hash
  delete result.hash;
  result.hash = objectHash(result);

  setAccountButtonSpinner(true);

  const response = await Ape.results.add({ body: { result } });

  setAccountButtonSpinner(false);

  if (response.status !== 200) {
    //only allow retry if status is not in this list
    if (![460, 461, 463, 464, 465, 466].includes(response.status)) {
      setResultState("canRetrySaving", true);
      if (!isRetrying) {
        retrySavingEvent = result;
      }
    }
    console.log("Error saving result", result);
    if (response.body.message === "Old key data format") {
      response.body.message =
        "Old key data format. Please refresh the page to download the new update. If the problem persists, please contact support.";
    }
    if (
      /"result\..+" is (not allowed|required)/gi.test(response.body.message)
    ) {
      response.body.message =
        "Looks like your result data is using an incorrect schema. Please refresh the page to download the new update. If the problem persists, please contact support.";
    }
    showErrorNotification("Failed to save result", { response });
    return response;
  }

  const data = response.body.data;
  setResultState("resultId", data.insertedId);

  const localDataToSave: SaveLocalResultData = {};

  if (data.xp !== undefined) {
    localDataToSave.xp = data.xp;
    if (isResultScreen()) {
      localDataToSave.xpBreakdown = data.xpBreakdown;
    }
  }

  if (data.streak !== undefined) {
    localDataToSave.streak = data.streak;
  }

  if (data.insertedId !== undefined) {
    //TODO - this type cast was not needed before because we were using JSON cloning
    // but now with the stronger types it shows that we are forcing completed event
    // into a NormalizedLocalResult - might not cuase issues but worth investigating
    const userResult = structuredClone(
      result,
    ) as unknown as NormalizedLocalResult<Mode>;
    userResult._id = data.insertedId;
    if (data.isPb !== undefined && data.isPb) {
      userResult.isPb = true;
    }
    localDataToSave.result = userResult;
  }

  if (data.isPb !== undefined && data.isPb) {
    //new pb
    const localPb = getLocalPB(
      result.mode,
      result.mode2,
      result.punctuation,
      result.numbers,
      result.language,
      result.difficulty,
      result.lazyMode,
      getFunbox(result.funbox),
    );

    if (localPb !== undefined) {
      showConfetti();
    }
    setCrownType("normal");

    localDataToSave.isPb = true;
  } else {
    showErrorCrownIfNeeded();
  }

  setResultState({
    dailyLeaderboardRank: data.dailyLeaderboardRank,
    canRetrySaving: false,
  });
  if (isRetrying) {
    showSuccessNotification("Result saved", { important: true });
  }
  saveLocalResult(localDataToSave);
  return response;
}

export function fail(reason: string): void {
  if (reason === "slow timer") {
    showNoticeNotification(
      'This could be caused by "efficiency mode" on Microsoft Edge.',
    );
    slowTimerNotificationIds.push(
      showErrorNotification(
        "Stopping the test due to bad performance. This would cause test calculations to be incorrect. If this happens a lot, please report this.",
      ),
    );
  }
  void finish({ type: "failed", reason });
}

const debouncedZipfCheck = debounce(250, async () => {
  const supports = await JSONData.checkIfLanguageSupportsZipf(
    getTestSettings().language,
  );
  if (supports === "no") {
    showNoticeNotification(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(getTestSettings().language),
      )} does not support Zipf funbox, because the list is not ordered by frequency. Please try another word list.`,
      {
        durationMs: 7000,
      },
    );
  }
  if (supports === "unknown") {
    showNoticeNotification(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(getTestSettings().language),
      )} may not support Zipf funbox, because we don't know if it's ordered by frequency or not. If you would like to add this label, please contact us.`,
      {
        durationMs: 7000,
      },
    );
  }
});

export function onRestartButtonClick(): void {
  if (isResultCalculating()) return;
  if (
    isTestActive() &&
    Config.repeatQuotes === "typing" &&
    getTestSettings().mode === "quote"
  ) {
    void restartTest({
      withSameWordset: true,
    });
  } else {
    void restartTest();
  }
}

export function repeatTest(): void {
  if (getTestSettings().mode === "zen") {
    showNoticeNotification("Repeat test disabled in zen mode");
    return;
  }
  void restartTest({
    withSameWordset: true,
  });
}

/**
 * Little roadblock for basic cheating - restarts an unstarted test.
 * TestPage calls this when the window regains focus or becomes visible.
 */
export function restartIfNotStarted(): void {
  if (
    !isTestActive() &&
    !isResultScreen() &&
    (getTestSettings().mode === "time" || getTestSettings().mode === "words")
  ) {
    void restartTest({
      noAnim: true,
    });
  }
}

// ===============================

configEvent.subscribe(({ key, newValue, nosave }) => {
  if (untrack(isTestPageMounted)) {
    if (key === "language") {
      //automatically enable lazy mode for arabic
      if (
        (newValue as string)?.startsWith("arabic") &&
        getPrefersArabicLazyMode()
      ) {
        setConfig("lazyMode", true, {
          nosave: true,
        });
      }
    }

    if (key === "keymapMode" && newValue === "next" && Config.mode !== "zen") {
      setTimeout(() => {
        highlightKeymapKey(
          nthElementFromArray(
            // ignoring for now but this might need a different approach
            // oxlint-disable-next-line no-misused-spread
            [...(TestWords.words.getCurrent()?.text ?? "")],
            0,
          ) as string,
        );
      }, 0);
    }
    if (
      (key === "language" || key === "funbox") &&
      Config.funbox.includes("zipf")
    ) {
      debouncedZipfCheck();
    }
  }
  if (key === "lazyMode" && !nosave) {
    if (Config.language.startsWith("arabic")) {
      setPrefersArabicLazyMode(newValue);
    }
  }
});
