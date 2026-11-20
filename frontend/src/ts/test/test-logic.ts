import { getLocalPB } from "../queries/user";
import {
  getRememberLazyMode,
  setRememberLazyMode,
  getPrefersArabicLazyMode,
  setPrefersArabicLazyMode,
} from "../states/lazy-mode";
import Ape from "../ape";
import { createEffect, createMemo, createRoot, on, untrack } from "solid-js";
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
import * as Arrays from "../utils/arrays";
import { getGlarsesMode } from "../states/glarses-mode";
import { getSarcasticResultMessage } from "../states/sarcastic-result-message";
import { getCustomTextIndicator } from "../states/core";
import { isAuthenticated } from "../auth/state";
import {
  setIsDirectionReversed,
  setIsLanguageRightToLeft,
  getCurrentQuote,
  isPaceRepeat,
  isRepeated,
  pushIncompleteTest,
  resetIncompleteTests,
  setIsPaceRepeat,
  setIsRepeated,
  setLastSignedOutResult,
  isRestartAnimating,
  setTestInitError,
  setTestInitFailed,
  setJoiningScript,
  setComposing,
  setCompositionData,
  highlightKeymapKey,
  setFocusMode,
  setTestFocusState,
} from "../states/test";
import {
  getActiveWordIndex,
  getRestartOptions,
  getTestEnd,
  isTestRestarting,
  isTestActive,
  getResultData,
  isResultPending,
  setWordsInfo,
  type RestartOptions,
  type TestEnd,
  isTestFinished,
} from "./engine/state";
import * as Engine from "./engine/commands";
import type { ResultDataCheck, ResultData } from "./engine/result-data";
import {
  TEST_SETTINGS_KEYS,
  getTestSettings,
  takeTestSettings,
} from "./engine/test-settings";
import { changeRequiresRestart } from "../config/metadata";
import "./timer-effects";
import * as TestWords from "./engine/test-words";
import * as WordsGenerator from "./words-generator";
import { isTestPageMounted } from "./test-page-bridge";
import { configEvent } from "../events/config";
import { canStartTest } from "../states/router";
import objectHash from "object-hash";
import * as AnalyticsController from "../controllers/analytics-controller";
import { getAuthenticatedUser } from "../auth/provider";
import { Mode } from "@monkeytype/schemas/shared";
import { CompletedEvent } from "@monkeytype/schemas/results";
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
import { ResultDetails, setResultState, setCrownType } from "../states/result";
import { blurInputElement } from "../input/input-element";
import { debounce } from "throttle-debounce";
import { setAccountButtonSpinner } from "../states/header";
import { Config, getConfig } from "../config/store";
import { setQuoteLengthAll, toggleFunbox, setConfig } from "../config/setters";
import { buildEventLog } from "./engine/events/data";
import {
  getIncompleteTestSeconds,
  getInputHistory,
} from "./engine/events/stats";
import { getLiveCachedAccuracy } from "./engine/events/live-cache";
import { resetModifierState } from "../states/modifiers";
import { nthElementFromArray } from "../utils/arrays";
import { appendRenderedWord } from "../states/words-render";

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
    onFinish: () => finish(),
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
  if (isTestRestarting() || isResultPending()) return;

  if (isTestActive()) recordIncompleteTest();
  resetTestState();
}

/** Ends the test when leaving the test page. Keystrokes after this don't reach the test. */
export function leaveTestPage(): void {
  stop();
  blurInputElement();
}

type RestartRequestOptions = Partial<RestartOptions> & {
  /** Practise missed words: keeps the practise settings. */
  practiseMissed?: boolean;
  nosave?: boolean;
  event?: KeyboardEvent;
  isQuickRestart?: boolean;
  /** A test setting changed: supersedes a restart in progress, or restarts the test still fading in. */
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
  const restarting = isTestRestarting();
  if (restarting || untrack(isRestartAnimating)) {
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

  if (isResultPending()) {
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
      noAnim: options.noAnim,
    }),
  );
}

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

  if (initResult === "ok") {
    setTestInitFailed(false);
    setTestInitError(null);
  }
  // TestPage swaps it in once the old test has faded out
  Engine.commitRestart(token);
}

// Changing a test setting restarts the test: one restart, however many
// change (a preset applies them in one batch). Moves into the engine with the
// request steps above (no roadmap row yet).
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
  takeTestSettings(CustomText.getData());
  const { withSameWordset } = getRestartOptions();
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

/** Ends the test: completed by default, or bailed out / failed (see fail()). */
export function finish(end: TestEnd = { type: "completed" }): void {
  if (!isTestActive()) return;
  // a repeated quote counts
  if (isRepeated() && getTestSettings().mode === "quote") {
    setIsRepeated(false);
  }
  setTestFocusState("focused");
  Engine.finish(end);
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

/**
 * The engine published a finished test's result: everything but showing it
 * (TestPage shows it once the words faded out). Notifications, incomplete
 * tests, long custom text progress, today's time, the crown and tag pbs,
 * starting the save.
 */
function onResult({
  completedEvent: ce,
  malformed,
  check,
  afkDetected,
  end,
  eventLog,
}: ResultData): void {
  const bailedOut = end.type === "bailedOut";
  const failReason = end.type === "failed" ? end.reason : null;
  const difficultyFailed = failReason !== null;
  PaceCaret.setLastTestWpm(ce.wpm);

  console.debug("Completed event object", ce);

  if (malformed) {
    console.log(ce);
    showErrorNotification(
      "Failed to build result object: One of the fields is undefined or NaN",
    );
  }
  if (check === "failed") {
    showNoticeNotification(`Test failed - ${failReason}`, {
      durationMs: 1000,
    });
  } else if (check !== "ok") {
    showNoticeNotification(`Test invalid - ${invalidMessages[check]}`);
  }
  let dontSave = malformed || check !== "ok";
  const invalid = check !== "ok" && check !== "failed";

  const completedEvent = structuredClone(ce) as CompletedEvent;

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

      Engine.save(async (isRetrying) => {
        const outcome = await saveResult(completedEvent, isRetrying);
        if (outcome.saved && !isRetrying) {
          void AnalyticsController.log("testCompleted");
        }
        return outcome;
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

  const details: ResultDetails = {
    difficultyFailed,
    failReason: failReason ?? "",
    afkDetected,
    isRepeated: isRepeated(),
    tooShort: check === "tooShort",
    invalid,
    stopOnError: getTestSettings().stopOnError,
    deleteOnError: Config.deleteOnError,
    quote: getTestSettings().mode === "quote" ? getCurrentQuote() : null,
  };

  const pbEligibility = getPbEligibility(completedEvent, dontSave);
  updateCrown(completedEvent, pbEligibility);
  setResultState({
    details,
    tags: getResultTags(completedEvent, pbEligibility),
    resultId: "",
    dailyLeaderboardRank: undefined,
  });

  if (getGlarsesMode()) {
    console.log(
      `Test Completed: ${completedEvent.wpm} wpm ${completedEvent.acc}% acc ${completedEvent.rawWpm} raw ${completedEvent.consistency}% consistency`,
    );
  }

  if (
    completedEvent.wpm === 0 &&
    !difficultyFailed &&
    completedEvent.testDuration >= 5 &&
    getSarcasticResultMessage()
  ) {
    const message = Arrays.randomElementFromArray(sarcasticMessages).replace(
      "{time}",
      Math.round(completedEvent.testDuration).toString(),
    );
    showConfetti();
    showNoticeNotification(message, {
      customTitle: "Nice",
      durationMs: 15000,
      important: true,
    });
  }
}

const invalidMessages: Record<
  Exclude<ResultDataCheck, "ok" | "failed">,
  string
> = {
  inconsistentDuration: "inconsistent test duration",
  tooShort: "too short",
  afk: "AFK detected",
  repeated: "repeated",
  wpm: "wpm",
  raw: "raw",
  accuracy: "accuracy",
};

createRoot(() => {
  createEffect(
    on(
      getResultData,
      (result) => {
        if (result !== null) onResult(result);
      },
      { defer: true },
    ),
  );
});

async function saveResult(
  completedEvent: CompletedEvent,
  isRetrying: boolean,
): Promise<Engine.SaveOutcome> {
  if (!Config.resultSaving) {
    showErrorNotification("Result not saved: disabled by user", {
      durationMs: 3000,
      customTitle: "Notice",
      important: true,
    });
    return { saved: false, canRetry: false };
  }
  if (isRetrying) showNoticeNotification("Retrying to save...");

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
    const canRetry = ![460, 461, 463, 464, 465, 466].includes(response.status);
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
    return { saved: false, canRetry };
  }

  const data = response.body.data;
  setResultState("resultId", data.insertedId);

  const localDataToSave: SaveLocalResultData = {};

  if (data.xp !== undefined) {
    localDataToSave.xp = data.xp;
    if (isTestFinished()) {
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

  setResultState("dailyLeaderboardRank", data.dailyLeaderboardRank);
  if (isRetrying) {
    showSuccessNotification("Result saved", { important: true });
  }
  saveLocalResult(localDataToSave);
  return { saved: true };
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
  finish({ type: "failed", reason });
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
  if (isResultPending()) return;
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
