import Ape from "../ape";
import * as TestUI from "./test-ui";
import * as Strings from "../utils/strings";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Numbers from "@monkeytype/util/numbers";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import * as CustomText from "./custom-text";
import * as PractiseWords from "./practise-words";
import * as Funbox from "./funbox/funbox";
import * as PaceCaret from "./pace-caret";
import * as TestTimer from "./test-timer";
import * as DB from "../db";
import * as Replay from "./replay-ui";
import { __nonReactive } from "../collections/tags";
import * as TodayTracker from "./today-tracker";
import * as ChallengeContoller from "../controllers/challenge-controller";
import { clearQuoteStats } from "../states/quote-rate";
import * as Result from "./result";
import {
  getActivePage,
  getCustomTextIndicator,
  isAuthenticated,
} from "../states/core";
import {
  setIsDirectionReversed,
  setIsLanguageRightToLeft,
  setKoreanStatus,
  setLastEventLog,
  setIsTestRestarting,
  isTestRestarting,
  getCurrentQuote,
  getIncompleteSeconds,
  getIncompleteTests,
  getRestartCount,
  isPaceRepeat,
  isRepeated,
  isTestActive,
  pushIncompleteTest,
  resetIncompleteTests,
  setIsPaceRepeat,
  setIsRepeated,
  setIsTestInvalid,
  setLastResult,
  getActiveWordIndex,
  resetActiveWordIndex,
  getBailedOut,
  isResultCalculating,
  setBailedOut,
  setLastSignedOutResult,
  setResultCalculating,
  setResultVisible,
  setTestActive,
  setWordsHaveNewline,
  setWordsHaveNumbers,
  setWordsHaveTab,
  getResultVisible,
} from "../states/test";
import { restartTestEvent } from "../events/test";
import * as TestWords from "./test-words";
import * as WordsGenerator from "./words-generator";
import * as PageTransition from "../legacy-states/page-transition";
import { configEvent } from "../events/config";
import { timerEvent } from "../events/timer";
import objectHash from "object-hash";
import * as AnalyticsController from "../controllers/analytics-controller";
import { getAuthenticatedUser } from "../firebase";
import { highlight } from "../events/keymap";
import * as LazyModeState from "../legacy-states/remember-lazy-mode";
import Format from "../singletons/format";
import { Mode, Mode2 } from "@monkeytype/schemas/shared";
import { Language } from "@monkeytype/schemas/languages";
import * as DailyLbStanding from "./daily-lb-standing";
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
import * as CompositionState from "../legacy-states/composition";
import { SnapshotResult } from "../constants/default-snapshot";
import { WordGenError } from "../utils/word-gen-error";
import { tryCatch } from "@monkeytype/util/trycatch";
import * as Sentry from "../sentry";
import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
import * as TestInitFailed from "../elements/test-init-failed";
import { canQuickRestart } from "../utils/quick-restart";
import { animate } from "animejs";
import { setInputElementValue } from "../input/input-element";
import { debounce } from "throttle-debounce";
import { qs } from "../utils/dom";
import { setAccountButtonSpinner } from "../states/header";
import { Config } from "../config/store";
import { setQuoteLengthAll, toggleFunbox, setConfig } from "../config/setters";
import {
  resetTestEvents,
  cleanupData,
  logEventsDataToTheConsoleTable,
  forceReleaseAllKeys,
  buildEventLog,
} from "./events/data";
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
} from "./events/stats";
import { getLiveCachedAccuracy } from "./events/live-cache";
import { calculateWpm } from "../utils/numbers";
import { isDevEnvironment } from "../utils/env";
import { EventLog } from "./events/types";
import { resetModifierState } from "../states/modifiers";
import { nthElementFromArray } from "../utils/arrays";

let failReason = "";

export function startTest(now: number): boolean {
  if (PageTransition.get()) {
    return false;
  }

  if (isAuthenticated()) {
    void AnalyticsController.log("testStarted");
  } else {
    void AnalyticsController.log("testStartedNoLogin");
  }

  setTestActive(true);
  TestTimer.clear();

  for (const fb of getActiveFunboxesWithFunction("start")) {
    fb.functions.start();
  }

  try {
    if (Config.paceCaret !== "off" || (Config.repeatedPace && isPaceRepeat())) {
      PaceCaret.start();
    }
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  void TestTimer.start(now);
  TestUI.onTestStart();
  return true;
}

type RestartOptions = {
  withSameWordset?: boolean;
  nosave?: boolean;
  event?: KeyboardEvent;
  practiseMissed?: boolean;
  noAnim?: boolean;
  isQuickRestart?: boolean;
};

export async function restart(options = {} as RestartOptions): Promise<void> {
  const defaultOptions = {
    withSameWordset: false,
    practiseMissed: false,
    noAnim: false,
    nosave: false,
    isQuickRestart: false,
  };

  options = { ...defaultOptions, ...options };

  // guards

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

  if (isTestRestarting() || isResultCalculating()) {
    options.event?.preventDefault();
    return;
  }
  if (isTestActive()) {
    if (options.isQuickRestart) {
      if (Config.mode !== "zen") options.event?.preventDefault();
      if (
        !canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText.getData(),
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
      options.withSameWordset = true;
    }

    if (Config.resultSaving) {
      // Finalize the abandoned test before measuring it: logging the timer
      // "end" event gives getAfkDuration its interval boundaries, so idle time
      // is actually subtracted. Without it AFK is always 0 and the full
      // wall-clock lifetime (incl. unbounded idle) leaks into the result.
      TestTimer.clear(true);
      const liveEventLog = buildEventLog();
      const tt = getIncompleteTestSeconds(liveEventLog);
      const acc = Numbers.roundTo2(getLiveCachedAccuracy());
      pushIncompleteTest({ acc, seconds: tt });
    }
  }

  const currentQuote = getCurrentQuote();
  if (
    Config.mode === "quote" &&
    currentQuote !== null &&
    Config.language.startsWith(currentQuote.language) &&
    Config.repeatQuotes === "typing" &&
    (isTestActive() || failReason !== "")
  ) {
    options.withSameWordset = true;
  }

  if (
    PractiseWords.before.mode !== null &&
    !options.withSameWordset &&
    !options.practiseMissed
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

  // reset state

  resetTestEvents();
  TestTimer.clear();
  setIsTestInvalid(false);
  resetModifierState();
  setTestActive(false);
  Replay.pauseReplay();
  setBailedOut(false);
  PaceCaret.reset();
  setKoreanStatus(false);
  clearQuoteStats();
  CompositionState.setComposing(false);
  CompositionState.setData("");
  Strings.clearWordDirectionCache();
  testReinitCount = 0;
  failReason = "";

  const repeatWithPace =
    (Config.repeatedPace && options.withSameWordset) ?? false;
  setIsRepeated(options.withSameWordset ?? false);
  setIsPaceRepeat(repeatWithPace);

  // restart

  const source: "testPage" | "resultPage" = getResultVisible()
    ? "resultPage"
    : "testPage";
  const noAnim = options.noAnim ?? false;

  setIsTestRestarting(true);

  await TestUI.fadeOutForRestart(source, noAnim);

  setResultVisible(false);
  setInputElementValue("");

  await Funbox.rememberSettings();

  const initResult = await init();

  if (!initResult) {
    setIsTestRestarting(false);
    return;
  }

  await PaceCaret.init();

  for (const fb of getActiveFunboxesWithFunction("restart")) {
    fb.functions.restart();
  }

  TestUI.onTestRestart(source);

  await TestUI.fadeInAfterRestart(noAnim);
  setIsTestRestarting(false);
}

let lastInitError: Error | null = null;
let showedLazyModeNotification: boolean = false;
let testReinitCount = 0;

async function init(): Promise<boolean> {
  console.debug("Initializing test");
  testReinitCount++;
  if (testReinitCount > 3) {
    if (lastInitError) {
      void Sentry.captureException(lastInitError);
      TestInitFailed.showError(
        `${lastInitError.name}: ${lastInitError.message}`,
      );
    }
    TestInitFailed.show();
    setIsTestRestarting(false);
    return false;
  }

  TestWords.words.reset();
  resetActiveWordIndex();

  showLoaderBar();
  const { data: language, error } = await tryCatch(
    JSONData.getLanguage(Config.language),
  );
  hideLoaderBar();

  if (error) {
    showErrorNotification("Failed to load language", { error });
  }

  if (!language || language.name !== Config.language) {
    return await init();
  }

  if (getActivePage() === "test") {
    await Funbox.activate();
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

    if (Config.lazyMode && !anySupportsLazyMode) {
      LazyModeState.setRemember(true);
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
    } else if (LazyModeState.getRemember() && anySupportsLazyMode) {
      setConfig("lazyMode", true);
      LazyModeState.setRemember(false);
      showedLazyModeNotification = false;
    }
  } else {
    // normal mode
    if (Config.lazyMode && !allowLazyMode) {
      LazyModeState.setRemember(true);
      if (!showedLazyModeNotification) {
        showNoticeNotification("This language does not support lazy mode.", {
          important: true,
        });
        showedLazyModeNotification = true;
      }
      setConfig("lazyMode", false);
    } else if (LazyModeState.getRemember() && allowLazyMode) {
      setConfig("lazyMode", true);
      LazyModeState.setRemember(false);
      showedLazyModeNotification = false;
    }
  }

  if (!Config.lazyMode && !language.noLazyMode) {
    LazyModeState.setRemember(false);
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

  let wordsHaveTab = false;
  let wordsHaveNewline = false;
  let allRightToLeft: boolean | undefined = undefined;
  let allJoiningScript: boolean | undefined = undefined;
  let generatedWords: string[] = [];
  let generatedSectionIndexes: number[] = [];
  try {
    const gen = await WordsGenerator.generateWords(language);
    generatedWords = gen.words;
    generatedSectionIndexes = gen.sectionIndexes;
    wordsHaveTab = gen.hasTab;
    wordsHaveNewline = gen.hasNewline;
    ({ allRightToLeft, allJoiningScript } = gen);
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

    return await init();
  }

  let hasNumbers = false;

  for (const word of generatedWords) {
    if (/\d/g.test(word) && !hasNumbers) {
      hasNumbers = true;
    }
  }

  setWordsHaveNumbers(hasNumbers);
  setWordsHaveTab(wordsHaveTab);
  setWordsHaveNewline(wordsHaveNewline);

  if (
    generatedWords
      .join()
      .normalize()
      .match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g,
      )
  ) {
    setKoreanStatus(true);
  }

  for (let i = 0; i < generatedWords.length; i++) {
    TestWords.words.push(
      generatedWords[i] as string,
      generatedSectionIndexes[i] as number,
    );
  }

  if (WordsGenerator.areAllWordsGenerated()) {
    TestWords.words.removeCommitCharacterFromLastWord();
  }

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    highlight(
      nthElementFromArray(
        // ignoring for now but this might need a different approach
        // oxlint-disable-next-line no-misused-spread
        [...(TestWords.words.getCurrent()?.text ?? "")],
        0,
      ) as string,
    );
  }

  Funbox.toggleScript(TestWords.words.getCurrent()?.text ?? "");
  TestUI.setJoiningClass(allJoiningScript ?? language.joiningScript ?? false);

  const isLanguageRTL = allRightToLeft ?? language.rightToLeft ?? false;
  setIsLanguageRightToLeft(isLanguageRTL);
  setIsDirectionReversed(isFunboxActiveWithProperty("reverseDirection"));

  console.debug("Test initialized with words", TestWords.words.get());
  console.debug(
    "Test initialized with section indexes",
    generatedSectionIndexes,
  );
  return true;
}

//add word during the test
export async function addWord(): Promise<void> {
  if (Config.mode === "zen") {
    TestUI.appendEmptyWordElement(getActiveWordIndex() + 1);
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
        Config.language,
      );

      if (section === false) {
        showErrorNotification(
          "Error while getting section. Please try again later",
        );
        toggleFunbox(sectionFunbox.name);
        void restart();
        return;
      }

      if (section === undefined) return;

      let wordCount = 0;
      for (let i = 0; i < section.words.length; i++) {
        const word = section.words[i] as string;
        if (wordCount >= Config.words && Config.mode === "words") {
          break;
        }
        wordCount++;
        const newWord = TestWords.words.push(
          WordsGenerator.appendCommitCharacter(word),
          i,
        );
        TestUI.addWord(newWord.display);
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

    const newWord = TestWords.words.push(
      randomWord.word,
      randomWord.sectionIndex,
    );
    TestUI.addWord(newWord.display);
  } catch (e) {
    timerEvent.dispatch({ key: "fail", value: "word generation error" });
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
    TestWords.words.removeCommitCharacterFromLastWord();
  }
}

type RetrySaving = {
  completedEvent: CompletedEvent | null;
  canRetry: boolean;
};

const retrySaving: RetrySaving = {
  completedEvent: null,
  canRetry: false,
};

export async function retrySavingResult(): Promise<void> {
  const { completedEvent } = retrySaving;

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

  if (!retrySaving.canRetry) {
    return;
  }

  retrySaving.canRetry = false;
  qs("#retrySavingResultButton")?.hide();

  showNoticeNotification("Retrying to save...");

  await saveResult(completedEvent, true);
}

function buildCompletedEvent(
  eventLog: EventLog,
): Omit<CompletedEvent, "hash" | "uid"> {
  const chars = getChars(eventLog);

  //tags
  const activeTagsIds: string[] = __nonReactive
    .getActiveTags()
    .map((tag) => tag._id);

  let language = Config.language;
  if (Config.mode === "quote") {
    language = Strings.removeLanguageSize(Config.language);
  }

  let customText: CompletedEventCustomText | undefined = undefined;
  if (Config.mode === "custom") {
    const temp = CustomText.getData();
    customText = {
      textLen: temp.text.length,
      mode: temp.mode,
      pipeDelimiter: temp.pipeDelimiter,
      limit: temp.limit,
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
  const completedEvent: Omit<CompletedEvent, "hash" | "uid"> = {
    wpm: Numbers.roundTo2(calculateWpm(chars.correctWord, duration)),
    rawWpm: Numbers.roundTo2(
      calculateWpm(chars.allCorrect + chars.incorrect + chars.extra, duration),
    ),
    charStats: [chars.correctWord, chars.incorrect, chars.extra, chars.missed],
    charTotal: chars.allCorrect + chars.incorrect + chars.extra,
    acc: Numbers.roundTo2(getAccuracy(eventLog).percentage),
    language: language,
    testDuration: duration,
    lastKeyToEnd: getLastKeypressToEndMs(eventLog),
    startToFirstKey: getStartToFirstKeypressMs(eventLog),
    afkDuration: afkDuration,
    quoteLength: currentQuote?.group ?? -1,
    customText: customText,
    tags: activeTagsIds,
    punctuation: Config.punctuation,
    numbers: Config.numbers,
    lazyMode: Config.lazyMode,
    timestamp: Date.now(),
    mode: Config.mode,
    mode2: Misc.getMode2(Config, currentQuote),
    bailedOut: getBailedOut(),
    funbox: Config.funbox,
    difficulty: Config.difficulty,
    blindMode: Config.blindMode,
    stopOnLetter: Config.stopOnError === "letter",
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

export async function finish(difficultyFailed = false): Promise<void> {
  if (!isTestActive()) return;
  setResultCalculating(true);
  const now = performance.now();
  TestTimer.clear(true, now);

  // fade out the test and show loading
  // because the css animation has a delay,
  // if the test calculation is fast the loading will not show
  await Misc.promiseAnimate("#typingTest", {
    opacity: 0,
    duration: Misc.applyReducedMotion(125),
  });
  qs(".pageTest #typingTest")?.hide();
  qs(".pageTest .loading")?.show();
  await Misc.sleep(0); //allow ui update

  TestUI.onTestFinish();

  if (isRepeated() && Config.mode === "quote") {
    setIsRepeated(false);
  }

  forceReleaseAllKeys();

  setResultVisible(true);
  setTestActive(false);

  cleanupData();

  if (isDevEnvironment()) {
    logEventsDataToTheConsoleTable();
  }

  const eventLog = buildEventLog();
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

  if (countUndefined(ce) > 0) {
    console.log(ce);
    showErrorNotification(
      "Failed to build result object: One of the fields is undefined or NaN",
    );
    dontSave = true;
  }

  const completedEvent = structuredClone(ce) as CompletedEvent;

  setLastEventLog(eventLog);
  setLastResult(structuredClone(completedEvent));

  ///////// completed event ready

  //afk check
  let afkDetected = getKeypressesPerSecond(eventLog)
    .slice(-5)
    .every((kps) => kps === 0);
  if (getBailedOut()) afkDetected = false;

  const mode2Number = parseInt(completedEvent.mode2);

  let tooShort = false;
  //fail checks
  const dateDur = getDateBasedTestDurationMs(eventLog) / 1000;
  if (
    Config.mode === "time" &&
    !getBailedOut() &&
    (ce.testDuration < dateDur - 0.1 || ce.testDuration > dateDur + 0.1) &&
    ce.testDuration <= 120
  ) {
    showNoticeNotification("Test invalid - inconsistent test duration");
    console.error("Test duration inconsistent", ce.testDuration, dateDur);
    setIsTestInvalid(true);
    dontSave = true;
  } else if (difficultyFailed) {
    showNoticeNotification(`Test failed - ${failReason}`, {
      durationMs: 1000,
    });
    dontSave = true;
  } else if (
    completedEvent.testDuration < 1 ||
    (Config.mode === "time" && mode2Number < 15 && mode2Number > 0) ||
    (Config.mode === "time" &&
      mode2Number === 0 &&
      completedEvent.testDuration < 15) ||
    (Config.mode === "words" && mode2Number < 10 && mode2Number > 0) ||
    (Config.mode === "words" &&
      mode2Number === 0 &&
      completedEvent.testDuration < 15) ||
    (Config.mode === "custom" &&
      (CustomText.getLimitMode() === "word" ||
        CustomText.getLimitMode() === "section") &&
      CustomText.getLimitValue() < 10) ||
    (Config.mode === "custom" &&
      CustomText.getLimitMode() === "time" &&
      CustomText.getLimitValue() < 15) ||
    (Config.mode === "zen" && completedEvent.testDuration < 15)
  ) {
    showNoticeNotification("Test invalid - too short");
    setIsTestInvalid(true);
    tooShort = true;
    dontSave = true;
  } else if (afkDetected) {
    showNoticeNotification("Test invalid - AFK detected");
    setIsTestInvalid(true);
    dontSave = true;
  } else if (isRepeated()) {
    showNoticeNotification("Test invalid - repeated");
    setIsTestInvalid(true);
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
    setIsTestInvalid(true);
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
    setIsTestInvalid(true);
    dontSave = true;
  } else if (
    (!DB.getSnapshot()?.lbOptOut &&
      (completedEvent.acc < 75 || completedEvent.acc > 100)) ||
    (DB.getSnapshot()?.lbOptOut === true &&
      (completedEvent.acc < 50 || completedEvent.acc > 100))
  ) {
    showNoticeNotification("Test invalid - accuracy");
    setIsTestInvalid(true);
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
  if (Config.mode === "custom" && customTextName !== "" && isLong) {
    // Let's update the custom text progress
    if (
      getBailedOut() ||
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
  Result.updateTodayTracker();

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
        if (response && response.status === 200) {
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

  const resultUpdatePromise = Result.update(
    completedEvent,
    difficultyFailed,
    failReason,
    afkDetected,
    isRepeated(),
    tooShort,
    getCurrentQuote(),
    dontSave,
  );

  await Promise.all([savingResultPromise, resultUpdatePromise]);
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
      retrySaving.canRetry = true;
      qs("#retrySavingResultButton")?.show();
      if (!isRetrying) {
        retrySaving.completedEvent = result;
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
  qs("#result .stats .tags .editTagsButton")?.setAttribute(
    "data-result-id",
    data.insertedId,
  );
  qs("#result .stats .tags .editTagsButton")?.removeClass("invisible");

  const localDataToSave: DB.SaveLocalResultData = {};

  if (data.xp !== undefined) {
    localDataToSave.xp = data.xp;
    if (getResultVisible()) {
      localDataToSave.xpBreakdown = data.xpBreakdown;
    }
  }

  if (data.streak !== undefined) {
    localDataToSave.streak = data.streak;
  }

  if (data.insertedId !== undefined) {
    //TODO - this type cast was not needed before because we were using JSON cloning
    // but now with the stronger types it shows that we are forcing completed event
    // into a snapshot result - might not cuase issues but worth investigating
    const snapshotResult = structuredClone(
      result,
    ) as unknown as SnapshotResult<Mode>;
    snapshotResult._id = data.insertedId;
    if (data.isPb !== undefined && data.isPb) {
      snapshotResult.isPb = true;
    }
    localDataToSave.result = snapshotResult;
  }

  if (data.isPb !== undefined && data.isPb) {
    //new pb
    const localPb = DB.getLocalPB(
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
      Result.showConfetti();
    }
    Result.showCrown("normal");

    localDataToSave.isPb = true;
  } else {
    Result.showErrorCrownIfNeeded();
  }

  const dailyLeaderboardEl = document.querySelector(
    "#result .stats .dailyLeaderboard",
  ) as HTMLElement;

  if (data.dailyLeaderboardRank === undefined) {
    dailyLeaderboardEl.classList.add("hidden");
    if (Config.showDailyLbStanding) {
      void showCurrentDailyStanding(
        dailyLeaderboardEl,
        result.mode,
        result.mode2,
        result.language,
      );
    }
  } else {
    dailyLeaderboardEl.classList.remove("hidden");
    dailyLeaderboardEl.style.maxWidth = "13rem";

    // undo the dimming/label a previous "current standing" render may have set
    const valueEl = qs("#result .stats .dailyLeaderboard .bottom");
    valueEl?.native.style.removeProperty("opacity");
    valueEl?.setAttribute("aria-label", "Show daily leaderboard");

    animate(dailyLeaderboardEl, {
      opacity: [0, 1],
      duration: Misc.applyReducedMotion(250),
    });

    setDailyLeaderboardValue(data.dailyLeaderboardRank, result.wpm, result.acc);
  }

  qs("#retrySavingResultButton")?.hide();
  if (isRetrying) {
    showSuccessNotification("Result saved", { important: true });
  }
  DB.saveLocalResult(localDataToSave);
  return response;
}

// Shown when the completed test did not improve the user's daily best (so the
// server returned no rank) but the user still has an entry on today's
// leaderboard. Dimmed to distinguish it from a placement made by this test.
async function showCurrentDailyStanding(
  dailyLeaderboardEl: HTMLElement,
  mode: Mode,
  mode2: Mode2<Mode>,
  language: Language,
): Promise<void> {
  const standing = await DailyLbStanding.getCurrentStanding(
    mode,
    mode2,
    language,
  );
  if (standing === null || !getResultVisible()) return;

  const valueEl = qs("#result .stats .dailyLeaderboard .bottom");
  dailyLeaderboardEl.classList.remove("hidden");
  dailyLeaderboardEl.style.maxWidth = "13rem";
  valueEl?.native.style.setProperty("opacity", "0.5");
  valueEl?.setAttribute("aria-label", "current standing");

  animate(dailyLeaderboardEl, {
    opacity: [0, 1],
    duration: Misc.applyReducedMotion(250),
  });

  setDailyLeaderboardValue(standing.rank, standing.wpm, standing.acc);
}

// The rank sits in .text, with the score that holds it below in .score, so the
// user can see what they need to beat without opening the leaderboard.
function setDailyLeaderboardValue(
  rank: number,
  wpm: number,
  acc: number,
): void {
  qs("#result .stats .dailyLeaderboard .bottom .text")?.setHtml(
    Format.rank(rank, { fallback: "" }),
  );
  qs("#result .stats .dailyLeaderboard .bottom .score")?.setText(
    `${Format.typingSpeed(wpm, {
      suffix: ` ${Config.typingSpeedUnit}`,
    })} ${Format.accuracy(acc)}`,
  );
}

export function fail(reason: string): void {
  failReason = reason;
  void finish(true);
}

const debouncedZipfCheck = debounce(250, async () => {
  const supports = await JSONData.checkIfLanguageSupportsZipf(Config.language);
  if (supports === "no") {
    showNoticeNotification(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language),
      )} does not support Zipf funbox, because the list is not ordered by frequency. Please try another word list.`,
      {
        durationMs: 7000,
      },
    );
  }
  if (supports === "unknown") {
    showNoticeNotification(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language),
      )} may not support Zipf funbox, because we don't know if it's ordered by frequency or not. If you would like to add this label, please contact us.`,
      {
        durationMs: 7000,
      },
    );
  }
});

qs(".pageTest")?.onChild("click", "#testInitFailed button.restart", () => {
  void restart();
});

qs(".pageTest")?.onChild("click", "#restartTestButton", () => {
  if (isResultCalculating()) return;
  if (
    isTestActive() &&
    Config.repeatQuotes === "typing" &&
    Config.mode === "quote"
  ) {
    void restart({
      withSameWordset: true,
    });
  } else {
    void restart();
  }
});

qs(".pageTest")?.onChild(
  "click",
  "#retrySavingResultButton",
  retrySavingResult,
);

qs(".pageTest")?.onChild("click", "#nextTestButton", () => {
  void restart();
});

qs(".pageTest")?.onChild("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode === "zen") {
    showNoticeNotification("Repeat test disabled in zen mode");
    return;
  }
  void restart({
    withSameWordset: true,
  });
});

// little roadblock for basic cheating
window.addEventListener("focus", () => {
  if (
    !isTestActive() &&
    !getResultVisible() &&
    (Config.mode === "time" || Config.mode === "words")
  ) {
    void restart({
      noAnim: true,
    });
  }
});

// little roadblock for basic cheating
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (
    !isTestActive() &&
    !getResultVisible() &&
    (Config.mode === "time" || Config.mode === "words")
  ) {
    void restart({
      noAnim: true,
    });
  }
});

restartTestEvent.subscribe((event) => void restart(event));

// ===============================

configEvent.subscribe(({ key, newValue, nosave }) => {
  if (getActivePage() === "test") {
    if (key === "language") {
      //automatically enable lazy mode for arabic
      if (
        (newValue as string)?.startsWith("arabic") &&
        LazyModeState.getArabicPref()
      ) {
        setConfig("lazyMode", true, {
          nosave: true,
        });
      }
      void restart();
    }
    if (key === "difficulty" && !nosave) void restart();
    if (key === "customLayoutfluid" && Config.funbox.includes("layoutfluid")) {
      void restart();
    }

    if (key === "keymapMode" && newValue === "next" && Config.mode !== "zen") {
      setTimeout(() => {
        highlight(
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
      LazyModeState.setArabicPref(newValue);
    }
  }
});

timerEvent.subscribe(({ key: eventKey, value: eventValue }) => {
  if (eventKey === "fail" && eventValue !== undefined) fail(eventValue);
  if (eventKey === "finish") void finish();
});
