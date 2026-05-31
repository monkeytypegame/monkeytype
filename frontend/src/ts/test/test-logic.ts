import Ape from "../ape";
import * as TestUI from "./test-ui";
import * as Strings from "../utils/strings";
import * as Misc from "../utils/misc";
import * as Arrays from "../utils/arrays";
import * as JSONData from "../utils/json-data";
import * as Numbers from "@monkeytype/util/numbers";
import {
  showNoticeNotification,
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import * as CustomText from "./custom-text";
import * as CustomTextState from "../legacy-states/custom-text-name";
import * as TestStats from "./test-stats";
import * as PractiseWords from "./practise-words";
import * as ShiftTracker from "./shift-tracker";
import * as AltTracker from "./alt-tracker";
import * as Funbox from "./funbox/funbox";
import * as PaceCaret from "./pace-caret";
import * as Caret from "./caret";
import * as TestTimer from "./test-timer";
import * as DB from "../db";
import * as Replay from "./replay";
import { __nonReactive } from "../collections/tags";
import * as TodayTracker from "./today-tracker";
import * as ChallengeContoller from "../controllers/challenge-controller";
import { clearQuoteStats } from "../states/quote-rate";
import * as Result from "./result";
import { getActivePage, isAuthenticated } from "../states/core";
import {
  getIncompleteSeconds,
  getIncompleteTests,
  getRestartCount,
  pushIncompleteTest,
  resetIncompleteTests,
  setIsTestInvalid,
  setLastResult,
  setResultVisible,
  setWordsHaveNewline,
  setWordsHaveTab,
} from "../states/test";
import { restartTestEvent } from "../events/test";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import * as WordsGenerator from "./words-generator";
import * as TestState from "./test-state";
import * as PageTransition from "../legacy-states/page-transition";
import { configEvent } from "../events/config";
import { timerEvent } from "../events/timer";
import objectHash from "object-hash";
import * as AnalyticsController from "../controllers/analytics-controller";
import { getAuthenticatedUser } from "../firebase";
import * as ConnectionState from "../legacy-states/connection";
import { highlight } from "../events/keymap";
import * as LazyModeState from "../legacy-states/remember-lazy-mode";
import Format from "../singletons/format";
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
import * as Time from "../legacy-states/time";
import { qs } from "../utils/dom";
import { setAccountButtonSpinner } from "../states/header";
import { Config } from "../config/store";
import { setQuoteLengthAll, toggleFunbox, setConfig } from "../config/setters";
import { resetTestEvents, cleanupData } from "./events/data";
import {
  getKeypressDurations,
  getChars,
  getRawPerSecond,
  getLastKeypressToEndMs,
  getStartToFirstKeypressMs,
  getTestDurationMs,
  getAccuracy,
  getKeypressSpacing,
  getKeypressOverlap,
  getErrorCountHistory,
  getWpmHistory,
  getAfkDuration,
  forceReleaseAllKeys,
  getKeypressesPerSecond,
} from "./events/stats";
import { calculateWpm } from "../utils/numbers";

let failReason = "";

export async function syncNotSignedInLastResult(uid: string): Promise<void> {
  if (notSignedInLastResult === null) return;
  setNotSignedInUidAndHash(uid);

  const response = await Ape.results.add({
    body: { result: notSignedInLastResult },
  });
  if (response.status !== 200) {
    showErrorNotification(`Failed to save last result hello ${failReason} hi`, {
      response,
    });
    return;
  }

  //TODO - this type cast was not needed before because we were using JSON cloning
  // but now with the stronger types it shows that we are forcing completed event
  // into a snapshot result - might not cause issues but worth investigating
  const result = structuredClone(
    notSignedInLastResult,
  ) as unknown as SnapshotResult<Mode>;

  const dataToSave: DB.SaveLocalResultData = {
    xp: response.body.data.xp,
    streak: response.body.data.streak,
    result,
    isPb: response.body.data.isPb,
  };

  result._id = response.body.data.insertedId;
  if (response.body.data.isPb) {
    result.isPb = true;
  }
  DB.saveLocalResult(dataToSave);
  clearNotSignedInResult();
  showSuccessNotification(
    `Last test result saved ${response.body.data.isPb ? `(new pb!)` : ""}`,
  );
}

export let notSignedInLastResult: CompletedEvent | null = null;

export function clearNotSignedInResult(): void {
  notSignedInLastResult = null;
}

export function setNotSignedInUidAndHash(uid: string): void {
  if (notSignedInLastResult === null) return;
  notSignedInLastResult.uid = uid;
  //@ts-expect-error really need to delete this
  delete notSignedInLastResult.hash;
  notSignedInLastResult.hash = objectHash(notSignedInLastResult);
}

export function startTest(now: number): boolean {
  if (PageTransition.get()) {
    return false;
  }

  if (isAuthenticated()) {
    void AnalyticsController.log("testStarted");
  } else {
    void AnalyticsController.log("testStartedNoLogin");
  }

  TestState.setActive(true);
  Replay.startReplayRecording();
  Replay.replayGetWordsList(TestWords.words.list);
  TestInput.carryoverFirstKeypress();
  Time.set(0);
  TestTimer.clear();

  for (const fb of getActiveFunboxesWithFunction("start")) {
    fb.functions.start();
  }

  try {
    if (
      Config.paceCaret !== "off" ||
      (Config.repeatedPace && TestState.isPaceRepeat)
    ) {
      PaceCaret.start();
    }
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  TestStats.setStart(now);
  void TestTimer.start();
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

export function restart(options = {} as RestartOptions): void {
  const defaultOptions = {
    withSameWordset: false,
    practiseMissed: false,
    noAnim: false,
    nosave: false,
    isQuickRestart: false,
  };

  options = { ...defaultOptions, ...options };
  Strings.clearWordDirectionCache();

  const animationTime = options.noAnim ? 0 : Misc.applyReducedMotion(125);

  const noQuit = isFunboxActive("no_quit");
  if (TestState.isActive && noQuit) {
    showNoticeNotification(
      "No quit funbox is active. Please finish the test.",
      {
        important: true,
      },
    );
    options.event?.preventDefault();
    return;
  }

  if (TestState.testRestarting || TestState.resultCalculating) {
    options.event?.preventDefault();
    return;
  }
  if (TestState.isActive) {
    if (options.isQuickRestart) {
      if (Config.mode !== "zen") options.event?.preventDefault();
      if (
        !canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText.getData(),
          CustomTextState.isCustomTextLong() ?? false,
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

    if (TestState.isRepeated) {
      options.withSameWordset = true;
    }

    if (Config.resultSaving) {
      TestInput.pushKeypressesToHistory();
      TestInput.pushErrorToHistory();
      TestInput.pushAfkToHistory();
      const testSeconds = TestStats.calculateTestSeconds(performance.now());
      const afkseconds = TestStats.calculateAfkSeconds(testSeconds);
      let tt = Numbers.roundTo2(testSeconds - afkseconds);
      if (tt < 0) tt = 0;
      const acc = Numbers.roundTo2(TestStats.calculateAccuracy());
      pushIncompleteTest({ acc, seconds: tt });
    }
  }

  if (
    Config.mode === "quote" &&
    TestWords.currentQuote !== null &&
    Config.language.startsWith(TestWords.currentQuote.language) &&
    Config.repeatQuotes === "typing" &&
    (TestState.isActive || failReason !== "")
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

  resetTestEvents();
  TestTimer.clear();
  setIsTestInvalid(false);
  TestStats.restart();
  TestInput.restart();
  TestInput.corrected.reset();
  ShiftTracker.reset();
  AltTracker.reset();
  Caret.hide();
  TestState.setActive(false);
  Replay.stopReplayRecording();
  Replay.pauseReplay();
  TestState.setBailedOut(false);
  Caret.resetPosition();
  PaceCaret.reset();
  TestInput.input.setKoreanStatus(false);
  clearQuoteStats();
  CompositionState.setComposing(false);
  CompositionState.setData("");

  if (!ConnectionState.get()) {
    ConnectionState.showOfflineBanner();
  }

  // TestUI.beforeTestRestart();

  let source: "testPage" | "resultPage";
  let el: HTMLElement;
  if (TestState.resultVisible) {
    //results are being displayed
    el = document.querySelector("#result") as HTMLElement;
    source = "resultPage";
  } else {
    //words are being displayed
    el = document.querySelector("#typingTest") as HTMLElement;
    source = "testPage";
  }

  TestState.setResultVisible(false);
  TestState.setTestRestarting(true);

  animate(el, {
    opacity: 0,
    duration: animationTime,
    onComplete: async () => {
      setResultVisible(false);
      setInputElementValue("");

      await Funbox.rememberSettings();

      testReinitCount = 0;
      failReason = "";

      let repeatWithPace = false;
      if (Config.repeatedPace && options.withSameWordset) {
        repeatWithPace = true;
      }

      TestState.setRepeated(options.withSameWordset ?? false);
      TestState.setPaceRepeat(repeatWithPace);
      TestInitFailed.hide();
      TestState.setTestInitSuccess(true);
      const initResult = await init();

      if (!initResult) {
        TestState.setTestRestarting(false);
        return;
      }

      await PaceCaret.init();

      for (const fb of getActiveFunboxesWithFunction("restart")) {
        fb.functions.restart();
      }

      TestUI.onTestRestart(source);

      const typingTestEl = document.querySelector("#typingTest") as HTMLElement;
      animate(typingTestEl, {
        opacity: [0, 1],
        onBegin: () => {
          typingTestEl.classList.remove("hidden");
        },
        duration: animationTime,
        onComplete: () => {
          TestState.setTestRestarting(false);
        },
      });
    },
  });
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
    TestState.setTestRestarting(false);
    TestState.setTestInitSuccess(false);
    return false;
  }

  Replay.stopReplayRecording();
  TestWords.words.reset();
  TestState.setActiveWordIndex(0);
  TestInput.input.resetHistory();
  TestInput.input.current = "";

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
    currentQuote: TestWords.currentQuote,
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

  TestWords.setHasNumbers(hasNumbers);
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
    TestInput.input.setKoreanStatus(true);
  }

  for (let i = 0; i < generatedWords.length; i++) {
    TestWords.words.push(
      generatedWords[i] as string,
      generatedSectionIndexes[i] as number,
    );
  }

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    highlight(
      Arrays.nthElementFromArray(
        // ignoring for now but this might need a different approach
        // oxlint-disable-next-line no-misused-spread
        [...TestWords.words.getCurrentText()],
        0,
      ) as string,
    );
  }

  Funbox.toggleScript(TestWords.words.getCurrentText());
  TestUI.setJoiningClass(allJoiningScript ?? language.joiningScript ?? false);

  const isLanguageRTL = allRightToLeft ?? language.rightToLeft ?? false;
  TestState.setIsLanguageRightToLeft(isLanguageRTL);
  TestState.setIsDirectionReversed(
    isFunboxActiveWithProperty("reverseDirection"),
  );

  console.debug("Test initialized with words", generatedWords);
  console.debug(
    "Test initialized with section indexes",
    generatedSectionIndexes,
  );
  return true;
}

export function areAllTestWordsGenerated(): boolean {
  return (
    (Config.mode === "words" &&
      TestWords.words.length >= Config.words &&
      Config.words > 0) ||
    (Config.mode === "custom" &&
      CustomText.getLimitMode() === "word" &&
      TestWords.words.length >= CustomText.getLimitValue() &&
      CustomText.getLimitValue() !== 0) ||
    (Config.mode === "quote" &&
      TestWords.words.length >=
        (TestWords.currentQuote?.textSplit?.length ?? 0)) ||
    (Config.mode === "custom" &&
      CustomText.getLimitMode() === "section" &&
      WordsGenerator.sectionIndex >= CustomText.getLimitValue() &&
      WordsGenerator.currentSection.length === 0 &&
      CustomText.getLimitValue() !== 0)
  );
}

//add word during the test
export async function addWord(): Promise<void> {
  if (Config.mode === "zen") {
    TestUI.appendEmptyWordElement();
    return;
  }

  let bound = 100; // how many extra words to aim for AFTER the current word

  const funboxToPush =
    getActiveFunboxes()
      .flatMap((fb) => fb.properties ?? [])
      .find((prop) => prop.startsWith("toPush:")) ?? "";

  const toPushCount = funboxToPush?.split(":")[1];
  if (toPushCount !== undefined) bound = +toPushCount - 1;

  if (TestWords.words.length - TestInput.input.getHistory().length > bound) {
    console.debug("Not adding word, enough words already");
    return;
  }
  if (areAllTestWordsGenerated()) {
    console.debug("Not adding word, all words generated");
    return;
  }
  const sectionFunbox = findSingleActiveFunboxWithFunction("pullSection");
  if (sectionFunbox) {
    if (TestWords.words.length - TestState.activeWordIndex < 20) {
      const section = await sectionFunbox.functions.pullSection(
        Config.language,
      );

      if (section === false) {
        showErrorNotification(
          "Error while getting section. Please try again later",
        );
        toggleFunbox(sectionFunbox.name);
        restart();
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
        TestWords.words.push(word, i);
        TestUI.addWord(word);
      }
    }
  }

  try {
    const randomWord = await WordsGenerator.getNextWord(
      TestWords.words.length,
      bound,
      TestWords.words.getText(TestWords.words.length - 1),
      TestWords.words.getText(TestWords.words.length - 2),
    );

    TestWords.words.push(randomWord.word, randomWord.sectionIndex);
    TestUI.addWord(randomWord.word);
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
  stats: TestStats.Stats,
  rawPerSecond: number[],
): Omit<CompletedEvent, "hash" | "uid"> {
  //build completed event object
  let stfk = Numbers.roundTo2(
    TestInput.keypressTimings.spacing.first - TestStats.start,
  );
  if (stfk < 0 || Config.mode === "zen") {
    stfk = 0;
  }

  let lkte = Numbers.roundTo2(
    TestStats.end - TestInput.keypressTimings.spacing.last,
  );
  if (lkte < 0 || Config.mode === "zen") {
    lkte = 0;
  }

  //consistency
  const stddev = Numbers.stdDev(rawPerSecond);
  const avg = Numbers.mean(rawPerSecond);
  let consistency = Numbers.roundTo2(Numbers.kogasa(stddev / avg));
  let keyConsistencyArray = TestInput.keypressTimings.spacing.array.slice();
  if (keyConsistencyArray.length > 0) {
    keyConsistencyArray = keyConsistencyArray.slice(
      0,
      keyConsistencyArray.length - 1,
    );
  }
  let keyConsistency = Numbers.roundTo2(
    Numbers.kogasa(
      Numbers.stdDev(keyConsistencyArray) / Numbers.mean(keyConsistencyArray),
    ),
  );
  if (!consistency || isNaN(consistency)) {
    consistency = 0;
  }
  if (!keyConsistency || isNaN(keyConsistency)) {
    keyConsistency = 0;
  }

  const chartErr = [];
  for (const error of TestInput.errorHistory) {
    chartErr.push(error.count ?? 0);
  }

  const chartData = {
    wpm: TestInput.wpmHistory,
    burst: rawPerSecond,
    err: chartErr,
  };

  //wpm consistency
  const stddev3 = Numbers.stdDev(chartData.wpm ?? []);
  const avg3 = Numbers.mean(chartData.wpm ?? []);
  const wpmCons = Numbers.roundTo2(Numbers.kogasa(stddev3 / avg3));
  const wpmConsistency = isNaN(wpmCons) ? 0 : wpmCons;

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

  //tags
  const activeTagsIds: string[] = __nonReactive
    .getActiveTags()
    .map((tag) => tag._id);

  const duration = parseFloat(stats.time.toString());
  const afkDuration = TestStats.calculateAfkSeconds(duration);
  let language = Config.language;
  if (Config.mode === "quote") {
    language = Strings.removeLanguageSize(Config.language);
  }

  const quoteLength = TestWords.currentQuote?.group ?? -1;

  const completedEvent: Omit<CompletedEvent, "hash" | "uid"> = {
    wpm: stats.wpm,
    rawWpm: stats.wpmRaw,
    charStats: [
      stats.correctChars + stats.correctSpaces,
      stats.incorrectChars,
      stats.extraChars,
      stats.missedChars,
    ],
    charTotal: stats.allChars,
    acc: stats.acc,
    mode: Config.mode,
    mode2: Misc.getMode2(Config, TestWords.currentQuote),
    quoteLength: quoteLength,
    punctuation: Config.punctuation,
    numbers: Config.numbers,
    lazyMode: Config.lazyMode,
    timestamp: Date.now(),
    language: language,
    restartCount: getRestartCount(),
    incompleteTests: getIncompleteTests(),
    incompleteTestSeconds:
      getIncompleteSeconds() < 0 ? 0 : Numbers.roundTo2(getIncompleteSeconds()),
    difficulty: Config.difficulty,
    blindMode: Config.blindMode,
    tags: activeTagsIds,
    keySpacing: TestInput.keypressTimings.spacing.array,
    keyDuration: TestInput.keypressTimings.duration.array,
    keyOverlap: Numbers.roundTo2(TestInput.keyOverlap.total),
    lastKeyToEnd: lkte,
    startToFirstKey: stfk,
    consistency: consistency,
    wpmConsistency: wpmConsistency,
    keyConsistency: keyConsistency,
    funbox: Config.funbox,
    bailedOut: TestState.bailedOut,
    chartData: chartData,
    customText: customText,
    testDuration: duration,
    afkDuration: afkDuration,
    stopOnLetter: Config.stopOnError === "letter",
  };

  if (completedEvent.mode !== "custom") delete completedEvent.customText;
  if (completedEvent.mode !== "quote") delete completedEvent.quoteLength;

  return completedEvent;
}

function compareCompletedEvents(
  ce: Omit<CompletedEvent, "hash" | "uid">,
): void {
  const start = performance.now();
  const ce2 = buildCompletedEvent2();
  const end = performance.now();

  console.debug(
    `Built completed event 2 in ${Numbers.roundTo2(end - start)} ms`,
  );

  //compare ce and ce2, log differences
  const notMatching: string[] = [];
  const mismatchedKeys: string[] = [];
  const ceKeys = Object.keys(ce) as (keyof typeof ce)[];
  for (const key of ceKeys) {
    let val1 = ce[key];
    let val2 = ce2[key];

    if (key === "keyDuration" || key === "keySpacing") {
      const a = (val1 as number[]).map((v) => Numbers.roundTo2(v));
      const b = (val2 as number[]).map((v) => Numbers.roundTo2(v));
      const total = Math.max(a.length, b.length);
      let mismatchCount = 0;
      if (a.length !== b.length) {
        mismatchCount = total;
        console.error(
          `Completed event length mismatch on key ${key}: ${a.length} vs ${b.length}`,
        );
      } else {
        for (let i = 0; i < total; i++) {
          if (a[i] !== b[i]) mismatchCount++;
        }
      }
      if (mismatchCount === 0) {
        console.debug(`Completed event match on key ${key}:`, a);
      } else {
        notMatching.push(`${key} (${mismatchCount}/${total} elements differ)`);
        mismatchedKeys.push(key);
        console.error(
          `Completed event mismatch on key ${key}: ${mismatchCount}/${total} elements differ`,
          a,
          b,
        );
      }
      continue;
    }

    if (key === "charStats") {
      const a = val1 as number[];
      const b = val2 as number[];
      const labels = ["correct", "incorrect", "extra", "missed"];
      const diffs: string[] = [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) {
          const label = labels[i] ?? `[${i}]`;
          diffs.push(`${label}: ${a[i]} vs ${b[i]}`);
        }
      }
      if (diffs.length === 0) {
        console.debug(`Completed event match on key charStats:`, a);
      } else {
        notMatching.push(`charStats (${diffs.join(", ")})`);
        mismatchedKeys.push("charStats");
        console.error(`Completed event mismatch on key charStats:`, a, b);
      }
      continue;
    }

    if (key === "keyOverlap") {
      val1 = Numbers.roundTo2(val1 as number);
      val2 = Numbers.roundTo2(val2 as number);
    }

    if (key === "timestamp") {
      continue;
    }

    if (key === "consistency") {
      continue;
    }

    // if (key === "chartData") {
    //   val1 = {
    //     //@ts-expect-error temp
    //     // eslint-disable-next-line
    //     wpm: (val1 as CompletedEvent["chartData"]).wpm.map((v) =>
    //       // eslint-disable-next-line
    //       Math.round(v),
    //     ),
    //     //@ts-expect-error temp
    //     // eslint-disable-next-line
    //     burst: (val1 as CompletedEvent["chartData"]).burst,
    //     //@ts-expect-error temp
    //     // eslint-disable-next-line
    //     err: (val1 as CompletedEvent["chartData"]).err,
    //   };
    //   val2 = {
    //     //@ts-expect-error temp
    //     // eslint-disable-next-line
    //     wpm: (val2 as CompletedEvent["chartData"]).wpm.map((v) =>
    //       // eslint-disable-next-line
    //       Math.round(v),
    //     ),
    //     //@ts-expect-error temp
    //     // eslint-disable-next-line
    //     burst: (val2 as CompletedEvent["chartData"]).burst,
    //     //@ts-expect-error temp
    //     // eslint-disable-next-line
    //     err: (val2 as CompletedEvent["chartData"]).err,
    //   };
    // }

    if (key === "chartData") {
      const v1 = val1 as CompletedEvent["chartData"];
      const v2 = val2 as CompletedEvent["chartData"];

      if (v1 === "toolong" || v2 === "toolong") {
        if (v1 === v2) {
          console.debug(
            `Completed event match on key chartData: both are "toolong"`,
          );
        } else {
          notMatching.push("chartData (one is 'toolong' and the other is not)");
          mismatchedKeys.push("chartData");
          console.error(
            `Completed event mismatch on key chartData: one is "toolong" and the other is not`,
            v1,
            v2,
          );
        }
        continue;
      }

      for (const field of ["wpm", "err"] as const) {
        const a = v1[field];
        const b = v2[field];
        const withinTolerance =
          a.length === b.length &&
          a.every((val, i) => {
            if (val === 0 && b[i] === 0) return true;
            const ref = Math.max(Math.abs(val), Math.abs(b[i] ?? 0));
            return Math.abs(val - (b[i] ?? 0)) / ref <= 0.05;
          });
        if (withinTolerance) {
          console.debug(`Completed event match on key chartData.${field}:`, a);
        } else {
          notMatching.push(`chartData.${field} (values differ)`);
          mismatchedKeys.push(`chartData.${field}`);
          console.error(
            `Completed event mismatch on key chartData.${field}:`,
            a,
            b,
          );
        }
      }

      {
        const a = TestInput.keypressCountHistory;
        const b = getKeypressesPerSecond();
        if (a.length === b.length && a.every((val, i) => val === b[i])) {
          console.debug(
            `Completed event match on key keypressCountHistory:`,
            a,
          );
        } else {
          notMatching.push(`keypressCountHistory (values differ)`);
          mismatchedKeys.push("keypressCountHistory");
          console.error(
            `Completed event mismatch on key keypressCountHistory:`,
            a,
            b,
          );
        }
      }
    } else if (key === "wpmConsistency" || key === "keyConsistency") {
      const a = val1 as number;
      const b = val2 as number;
      const ref = Math.max(
        Numbers.roundTo2(Math.abs(a)),
        Numbers.roundTo2(Math.abs(b)),
      );
      const within = (a === 0 && b === 0) || Math.abs(a - b) / ref <= 0.05;
      if (within) {
        console.debug(`Completed event match on key ${key}:`, a);
      } else {
        const diff = Numbers.roundTo2(Math.abs(a - b));
        const dir = a > b ? "ce1 larger" : "ce2 larger";
        notMatching.push(`${key} (off by ${diff}, ${dir})`);
        mismatchedKeys.push(key);
        console.error(`Completed event mismatch on key ${key}:`, a, b);
      }
    } else if (typeof val1 === "number" && typeof val2 === "number") {
      const a = Numbers.roundTo2(val1);
      const b = Numbers.roundTo2(val2);
      if (a !== b) {
        const diff = Numbers.roundTo2(Math.abs(a - b));
        const dir = a > b ? "ce1 larger" : "ce2 larger";
        notMatching.push(`${key} (off by ${diff}, ${dir})`);
        mismatchedKeys.push(key);
        console.error(`Completed event mismatch on key ${key}:`, a, b);
      } else {
        console.debug(`Completed event match on key ${key}:`, a);
      }
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      notMatching.push(`${key} (values differ)`);
      mismatchedKeys.push(key);
      console.error(`Completed event mismatch on key ${key}:`, val1, val2);
    } else {
      console.debug(`Completed event match on key ${key}:`, val1);
    }
  }

  if (notMatching.length === 0) {
    // showSuccessNotification("Completed events match", { important: true });
  } else {
    // showErrorNotification(
    //   `Completed event mismatch: ${notMatching.join(", ")}`,
    //   { important: true },
    // );
    mismatchedKeys.sort();
    const groupKey = mismatchedKeys.join(",");
    Ape.results
      .reportCompletedEventMismatch({
        body: {
          notMatching,
          mismatchedKeys,
          groupKey,
          language: ce.language,
          mode: ce.mode,
          mode2: ce.mode2,
          difficulty: ce.difficulty,
          duration: ce.testDuration,
          // ce: ce as Record<string, unknown>,
          // ce2: ce2 as Record<string, unknown>,
        },
      })
      .catch(() => {
        //
      });
  }

  console.debug("Completed event object2", ce2);
}

function buildCompletedEvent2(): Omit<CompletedEvent, "hash" | "uid"> {
  const chars = getChars();

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

  let duration = getTestDurationMs() / 1000;

  const rawPerSecond = getRawPerSecond();
  const afkDuration = getAfkDuration();
  const stddev = Numbers.stdDev(rawPerSecond);
  const avg = Numbers.mean(rawPerSecond);
  let consistency = Numbers.roundTo2(Numbers.kogasa(stddev / avg));
  if (!consistency || isNaN(consistency)) {
    consistency = 0;
  }

  const keypressSpacing = getKeypressSpacing();

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

  const wpmHistory = getWpmHistory();
  const wpmCons = Numbers.roundTo2(
    Numbers.kogasa(Numbers.stdDev(wpmHistory) / Numbers.mean(wpmHistory)),
  );
  const wpmConsistency = isNaN(wpmCons) ? 0 : wpmCons;

  const chartData = {
    wpm: wpmHistory,
    burst: rawPerSecond,
    err: getErrorCountHistory(),
  };

  const completedEvent: Omit<CompletedEvent, "hash" | "uid"> = {
    wpm: Numbers.roundTo2(calculateWpm(chars.correctWord, duration)),
    rawWpm: Numbers.roundTo2(
      calculateWpm(chars.allCorrect + chars.incorrect + chars.extra, duration),
    ),
    charStats: [chars.correctWord, chars.incorrect, chars.extra, chars.missed],
    charTotal: chars.allCorrect + chars.incorrect + chars.extra,
    acc: Numbers.roundTo2(getAccuracy().percentage),
    language: language,
    testDuration: duration,
    lastKeyToEnd: getLastKeypressToEndMs(),
    startToFirstKey: getStartToFirstKeypressMs(),
    afkDuration: afkDuration,
    quoteLength: TestWords.currentQuote?.group ?? -1,
    customText: customText,
    tags: activeTagsIds,
    punctuation: Config.punctuation,
    numbers: Config.numbers,
    lazyMode: Config.lazyMode,
    timestamp: Date.now(),
    mode: Config.mode,
    mode2: Misc.getMode2(Config, TestWords.currentQuote),
    bailedOut: TestState.bailedOut,
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
    keyDuration: getKeypressDurations(),
    keyOverlap: getKeypressOverlap(),
  } as Omit<CompletedEvent, "hash" | "uid">;

  if (completedEvent.mode !== "custom") delete completedEvent.customText;
  if (completedEvent.mode !== "quote") delete completedEvent.quoteLength;

  return completedEvent;
}

export async function finish(difficultyFailed = false): Promise<void> {
  if (!TestState.isActive) return;
  TestState.setResultCalculating(true);
  const now = performance.now();
  TestTimer.clear(true, now);
  TestStats.setEnd(now);

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

  if (TestState.isRepeated && Config.mode === "quote") {
    TestState.setRepeated(false);
  }

  // in case the tests ends with a keypress (not a word submission)
  // we need to push the current input to history
  if (TestInput.input.current.length !== 0) {
    TestInput.input.pushHistory();
    TestInput.corrected.pushHistory();
    Replay.replayGetWordsList(TestInput.input.getHistory());
  }

  // in zen mode, ensure the replay words list reflects the typed input history
  // even if the current input was empty at finish (e.g., after submitting a word).
  if (Config.mode === "zen") {
    Replay.replayGetWordsList(TestInput.input.getHistory());
  }

  TestInput.forceKeyup(now); //this ensures that the last keypress(es) are registered
  forceReleaseAllKeys();

  const endAfkSeconds = (now - TestInput.keypressTimings.spacing.last) / 1000;
  if ((Config.mode === "zen" || TestState.bailedOut) && endAfkSeconds < 7) {
    TestStats.setEnd(TestInput.keypressTimings.spacing.last);
  }

  setResultVisible(true);
  TestState.setResultVisible(true);
  TestState.setActive(false);
  Replay.stopReplayRecording();

  cleanupData();

  // logEventsDataToTheConsoleTable();

  //need one more calculation for the last word if test auto ended
  if (TestInput.burstHistory.length !== TestInput.input.getHistory()?.length) {
    const burst = TestStats.calculateBurst(now);
    TestInput.pushBurstToHistory(burst);
  }

  //remove afk from zen
  if (Config.mode === "zen" || TestState.bailedOut) {
    TestStats.removeAfkData();
  }

  // stats
  const stats = TestStats.calculateFinalStats();
  if (
    stats.time % 1 !== 0 &&
    !(
      Config.mode === "time" ||
      (Config.mode === "custom" && CustomText.getLimitMode() === "time")
    )
  ) {
    TestStats.setLastSecondNotRound();
  }

  PaceCaret.setLastTestWpm(stats.wpm);

  // if the last second was not rounded, add another data point to the history
  if (
    TestStats.lastSecondNotRound &&
    !difficultyFailed &&
    Math.round(stats.time % 1) >= 0.5
  ) {
    const wpmAndRaw = TestStats.calculateWpmAndRaw();
    TestInput.pushToWpmHistory(wpmAndRaw.wpm);
    TestInput.pushToRawHistory(wpmAndRaw.raw);
    TestInput.pushKeypressesToHistory();
    TestInput.pushErrorToHistory();
    TestInput.pushAfkToHistory();
  }

  const rawPerSecond = TestInput.keypressCountHistory.map((count) =>
    Math.round((count / 5) * 60),
  );

  //adjust last second if last second is not round
  // if (TestStats.lastSecondNotRound && stats.time % 1 >= 0.1) {
  if (
    Config.mode !== "time" &&
    TestStats.lastSecondNotRound &&
    stats.time % 1 >= 0.5
  ) {
    const timescale = 1 / (stats.time % 1);

    //multiply last element of rawBefore by scale, and round it
    rawPerSecond[rawPerSecond.length - 1] = Math.round(
      (rawPerSecond[rawPerSecond.length - 1] as number) * timescale,
    );
  }

  const ce = buildCompletedEvent(stats, rawPerSecond);

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

  setLastResult(structuredClone(completedEvent));

  ///////// completed event ready

  //afk check
  const kps = TestInput.afkHistory.slice(-5);
  let afkDetected = kps.length > 0 && kps.every((afk) => afk);

  if (TestState.bailedOut) afkDetected = false;

  const mode2Number = parseInt(completedEvent.mode2);

  let tooShort = false;
  //fail checks
  const dateDur = (TestStats.end3 - TestStats.start3) / 1000;
  if (
    Config.mode === "time" &&
    !TestState.bailedOut &&
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
  } else if (TestState.isRepeated) {
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

  if (
    getAuthenticatedUser() !== null &&
    !dontSave &&
    !difficultyFailed &&
    Config.resultSaving
  ) {
    compareCompletedEvents(ce);
  }

  if (TestState.isRepeated || difficultyFailed) {
    if (Config.resultSaving) {
      const testSeconds = completedEvent.testDuration;
      const afkseconds = completedEvent.afkDuration;
      let tt = Numbers.roundTo2(testSeconds - afkseconds);
      if (tt < 0) tt = 0;
      const acc = completedEvent.acc;
      pushIncompleteTest({ acc, seconds: tt });
    }
  }

  const customTextName = CustomTextState.getCustomTextName();
  const isLong = CustomTextState.isCustomTextLong();
  if (Config.mode === "custom" && customTextName !== "" && isLong) {
    // Let's update the custom text progress
    if (
      TestState.bailedOut ||
      TestInput.input.getHistory().length < TestWords.words.length
    ) {
      // They bailed out

      const history = TestInput.input.getHistory();
      let historyLength = history?.length;
      const wordIndex = historyLength - 1;

      const lastWordInputLength = history[wordIndex]?.length ?? 0;

      if (lastWordInputLength < TestWords.words.getText(wordIndex).length) {
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
      notSignedInLastResult = completedEvent;
    }
    dontSave = true;
  }

  const resultUpdatePromise = Result.update(
    completedEvent,
    difficultyFailed,
    failReason,
    afkDetected,
    TestState.isRepeated,
    tooShort,
    TestWords.currentQuote,
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

  console.trace();

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
    if (TestState.resultVisible) {
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
    const localPb = await DB.getLocalPB(
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
  } else {
    dailyLeaderboardEl.classList.remove("hidden");
    dailyLeaderboardEl.style.maxWidth = "13rem";

    animate(dailyLeaderboardEl, {
      opacity: [0, 1],
      duration: Misc.applyReducedMotion(250),
    });

    qs("#result .stats .dailyLeaderboard .bottom")?.setHtml(
      Format.rank(data.dailyLeaderboardRank, { fallback: "" }),
    );
  }

  qs("#retrySavingResultButton")?.hide();
  if (isRetrying) {
    showSuccessNotification("Result saved", { important: true });
  }
  DB.saveLocalResult(localDataToSave);
  return response;
}

export function fail(reason: string): void {
  failReason = reason;
  // input.pushHistory();
  // corrected.pushHistory();
  TestInput.pushKeypressesToHistory();
  TestInput.pushErrorToHistory();
  TestInput.pushAfkToHistory();
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

qs(".pageTest")?.onChild(
  "click",
  "#testModesNotice .textButton.restart",
  () => {
    restart();
  },
);

qs(".pageTest")?.onChild("click", "#testInitFailed button.restart", () => {
  restart();
});

qs(".pageTest")?.onChild("click", "#restartTestButton", () => {
  if (TestState.resultCalculating) return;
  if (
    TestState.isActive &&
    Config.repeatQuotes === "typing" &&
    Config.mode === "quote"
  ) {
    restart({
      withSameWordset: true,
    });
  } else {
    restart();
  }
});

qs(".pageTest")?.onChild(
  "click",
  "#retrySavingResultButton",
  retrySavingResult,
);

qs(".pageTest")?.onChild("click", "#nextTestButton", () => {
  restart();
});

qs(".pageTest")?.onChild("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode === "zen") {
    showNoticeNotification("Repeat test disabled in zen mode");
    return;
  }
  restart({
    withSameWordset: true,
  });
});

restartTestEvent.subscribe((event) => restart(event));

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
      restart();
    }
    if (key === "difficulty" && !nosave) restart();
    if (key === "customLayoutfluid" && Config.funbox.includes("layoutfluid")) {
      restart();
    }

    if (key === "keymapMode" && newValue === "next" && Config.mode !== "zen") {
      setTimeout(() => {
        highlight(
          Arrays.nthElementFromArray(
            // ignoring for now but this might need a different approach
            // oxlint-disable-next-line no-misused-spread
            [...TestWords.words.getCurrentText()],
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
