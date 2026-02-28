import Ape from "../ape";
import * as TestUI from "./test-ui";
import * as ManualRestart from "./manual-restart-tracker";
import Config, { setConfig, setQuoteLengthAll, toggleFunbox } from "../config";
import * as Strings from "../utils/strings";
import * as Misc from "../utils/misc";
import * as Arrays from "../utils/arrays";
import * as JSONData from "../utils/json-data";
import * as Numbers from "@monkeytype/util/numbers";
import * as Notifications from "../elements/notifications";
import * as CustomText from "./custom-text";
import * as CustomTextState from "../states/custom-text-name";
import * as TestStats from "./test-stats";
import * as PractiseWords from "./practise-words";
import * as ShiftTracker from "./shift-tracker";
import * as AltTracker from "./alt-tracker";
import * as Funbox from "./funbox/funbox";
import * as PaceCaret from "./pace-caret";
import * as Caret from "./caret";
import * as TestTimer from "./test-timer";
import * as AccountButton from "../elements/account-button";
import * as DB from "../db";
import * as Replay from "./replay";
import * as TodayTracker from "./today-tracker";
import * as ChallengeContoller from "../controllers/challenge-controller";
import * as QuoteRateModal from "../modals/quote-rate";
import * as Result from "./result";
import { getActivePage } from "../signals/core";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import * as WordsGenerator from "./words-generator";
import * as TestState from "./test-state";
import * as PageTransition from "../states/page-transition";
import * as ConfigEvent from "../observables/config-event";
import * as TimerEvent from "../observables/timer-event";
import objectHash from "object-hash";
import * as AnalyticsController from "../controllers/analytics-controller";
import { getAuthenticatedUser, isAuthenticated } from "../firebase";
import * as ConnectionState from "../states/connection";
import * as KeymapEvent from "../observables/keymap-event";
import * as LazyModeState from "../states/remember-lazy-mode";
import Format from "../utils/format";
import { QuoteLength, QuoteLengthConfig } from "@monkeytype/schemas/configs";
import { Mode } from "@monkeytype/schemas/shared";
import {
  CompletedEvent,
  CompletedEventCustomText,
} from "@monkeytype/schemas/results";
import * as XPBar from "../elements/xp-bar";
import {
  findSingleActiveFunboxWithFunction,
  getActiveFunboxes,
  getActiveFunboxesWithFunction,
  getActiveFunboxNames,
  isFunboxActive,
  isFunboxActiveWithProperty,
} from "./funbox/list";
import { getFunbox } from "@monkeytype/funbox";
import * as CompositionState from "../states/composition";
import { SnapshotResult } from "../constants/default-snapshot";
import { WordGenError } from "../utils/word-gen-error";
import { tryCatch } from "@monkeytype/util/trycatch";
import * as Sentry from "../sentry";
import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as TestInitFailed from "../elements/test-init-failed";
import { canQuickRestart } from "../utils/quick-restart";
import { animate } from "animejs";
import { setInputElementValue } from "../input/input-element";
import { debounce } from "throttle-debounce";
import * as Time from "../states/time";
import { qs } from "../utils/dom";

let failReason = "";

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
  TestInput.resetKeypressTimings();
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
};

export function restart(options = {} as RestartOptions): void {
  const defaultOptions = {
    withSameWordset: false,
    practiseMissed: false,
    noAnim: false,
    nosave: false,
  };

  options = { ...defaultOptions, ...options };
  Strings.clearWordDirectionCache();

  const animationTime = options.noAnim ? 0 : Misc.applyReducedMotion(125);

  const noQuit = isFunboxActive("no_quit");
  if (TestState.isActive && noQuit) {
    Notifications.add("No quit funbox is active. Please finish the test.", 0, {
      important: true,
    });
    options.event?.preventDefault();
    return;
  }

  if (TestState.testRestarting || TestUI.resultCalculating) {
    options.event?.preventDefault();
    return;
  }
  if (getActivePage() === "test") {
    if (!ManualRestart.get()) {
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
        Notifications.add(
          `Quick restart disabled in long tests. ${message}`,
          0,
          {
            duration: 4,
            important: true,
          },
        );
        return;
      }
    }
  }

  if (TestState.isActive) {
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
      TestStats.incrementIncompleteSeconds(tt);
      TestStats.incrementRestartCount();
      const acc = Numbers.roundTo2(TestStats.calculateAccuracy());
      TestStats.pushIncompleteTest(acc, tt);
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
    Notifications.add("Reverting to previous settings.", 0);
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

  ManualRestart.reset();
  TestTimer.clear();
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
  QuoteRateModal.clearQuoteStats();
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
          ManualRestart.reset();
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
    Notifications.add(
      Misc.createErrorMessage(error, "Failed to load language"),
      -1,
    );
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
        Notifications.add(
          Misc.createErrorMessage(
            error,
            `Failed to load language: ${langName}`,
          ),
          -1,
        );
      }
      return lang;
    });

    const anySupportsLazyMode = (await Promise.all(languagePromises))
      .filter((lang) => lang !== null)
      .some((lang) => !lang.noLazyMode);

    if (Config.lazyMode && !anySupportsLazyMode) {
      LazyModeState.setRemember(true);
      if (!showedLazyModeNotification) {
        Notifications.add(
          "None of the selected polyglot languages support lazy mode.",
          0,
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
        Notifications.add("This language does not support lazy mode.", 0, {
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
  let allLigatures: boolean | undefined = undefined;
  let generatedWords: string[] = [];
  let generatedSectionIndexes: number[] = [];
  try {
    const gen = await WordsGenerator.generateWords(language);
    generatedWords = gen.words;
    generatedSectionIndexes = gen.sectionIndexes;
    wordsHaveTab = gen.hasTab;
    wordsHaveNewline = gen.hasNewline;
    ({ allRightToLeft, allLigatures } = gen);
  } catch (e) {
    hideLoaderBar();
    if (e instanceof WordGenError || e instanceof Error) {
      lastInitError = e;
    }
    console.error(e);
    if (e instanceof WordGenError) {
      if (e.message.length > 0) {
        Notifications.add(e.message, 0, {
          important: true,
        });
      }
    } else {
      Notifications.add(
        Misc.createErrorMessage(e, "Failed to generate words"),
        -1,
        {
          important: true,
        },
      );
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
  TestWords.setHasTab(wordsHaveTab);
  TestWords.setHasNewline(wordsHaveNewline);

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
    void KeymapEvent.highlight(
      Arrays.nthElementFromArray(
        // ignoring for now but this might need a different approach
        // oxlint-disable-next-line no-misused-spread
        [...TestWords.words.getCurrent()],
        0,
      ) as string,
    );
  }
  Funbox.toggleScript(TestWords.words.getCurrent());
  TestUI.setLigatures(allLigatures ?? language.ligatures ?? false);

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
        Notifications.add(
          "Error while getting section. Please try again later",
          -1,
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
      TestWords.words.get(TestWords.words.length - 1),
      TestWords.words.get(TestWords.words.length - 2),
    );

    TestWords.words.push(randomWord.word, randomWord.sectionIndex);
    TestUI.addWord(randomWord.word);
  } catch (e) {
    TimerEvent.dispatch("fail", "word generation error");
    Notifications.add(
      Misc.createErrorMessage(
        e,
        "Error while getting next word. Please try again later",
      ),
      -1,
      {
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
    Notifications.add(
      "Could not retry saving the result as the result no longer exists.",
      0,
      {
        duration: 5,
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

  Notifications.add("Retrying to save...");

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
  const activeTagsIds: string[] = [];
  for (const tag of DB.getSnapshot()?.tags ?? []) {
    if (tag.active === true) {
      activeTagsIds.push(tag._id);
    }
  }

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
    restartCount: TestStats.restartCount,
    incompleteTests: TestStats.incompleteTests,
    incompleteTestSeconds:
      TestStats.incompleteSeconds < 0
        ? 0
        : Numbers.roundTo2(TestStats.incompleteSeconds),
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

export async function finish(difficultyFailed = false): Promise<void> {
  if (!TestState.isActive) return;
  TestUI.setResultCalculating(true);
  const now = performance.now();
  TestTimer.clear();
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

  const endAfkSeconds = (now - TestInput.keypressTimings.spacing.last) / 1000;
  if ((Config.mode === "zen" || TestState.bailedOut) && endAfkSeconds < 7) {
    TestStats.setEnd(TestInput.keypressTimings.spacing.last);
  }

  TestState.setResultVisible(true);
  TestState.setActive(false);
  Replay.stopReplayRecording();

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
  if (TestStats.lastSecondNotRound && !difficultyFailed) {
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
    Notifications.add(
      "Failed to build result object: One of the fields is undefined or NaN",
      -1,
    );
    dontSave = true;
  }

  const completedEvent = structuredClone(ce) as CompletedEvent;

  TestStats.setLastResult(structuredClone(completedEvent));

  ///////// completed event ready

  //afk check
  const kps = TestInput.afkHistory.slice(-5);
  let afkDetected = kps.every((afk) => afk);
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
    Notifications.add("Test invalid - inconsistent test duration", 0);
    console.error("Test duration inconsistent", ce.testDuration, dateDur);
    TestStats.setInvalid();
    dontSave = true;
  } else if (difficultyFailed) {
    Notifications.add(`Test failed - ${failReason}`, 0, {
      duration: 1,
    });
    dontSave = true;
  } else if (afkDetected) {
    Notifications.add("Test invalid - AFK detected", 0);
    TestStats.setInvalid();
    dontSave = true;
  } else if (TestState.isRepeated) {
    Notifications.add("Test invalid - repeated", 0);
    TestStats.setInvalid();
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
    Notifications.add("Test invalid - too short", 0);
    TestStats.setInvalid();
    tooShort = true;
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
    Notifications.add("Test invalid - wpm", 0);
    TestStats.setInvalid();
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
    Notifications.add("Test invalid - raw", 0);
    TestStats.setInvalid();
    dontSave = true;
  } else if (
    (!DB.getSnapshot()?.lbOptOut &&
      (completedEvent.acc < 75 || completedEvent.acc > 100)) ||
    (DB.getSnapshot()?.lbOptOut === true &&
      (completedEvent.acc < 50 || completedEvent.acc > 100))
  ) {
    Notifications.add("Test invalid - accuracy", 0);
    TestStats.setInvalid();
    dontSave = true;
  }

  // test is valid

  if (TestState.isRepeated) {
    const testSeconds = completedEvent.testDuration;
    const afkseconds = completedEvent.afkDuration;
    let tt = Numbers.roundTo2(testSeconds - afkseconds);
    if (tt < 0) tt = 0;
    const acc = completedEvent.acc;
    TestStats.incrementIncompleteSeconds(tt);
    TestStats.incrementRestartCount();
    TestStats.pushIncompleteTest(acc, tt);
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

      if (lastWordInputLength < TestWords.words.get(wordIndex).length) {
        historyLength--;
      }

      const newProgress =
        CustomText.getCustomTextLongProgress(customTextName) + historyLength;
      CustomText.setCustomTextLongProgress(customTextName, newProgress);
      Notifications.add("Long custom text progress saved", 1, {
        duration: 5,
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
      Notifications.add("Long custom text completed", 1, {
        duration: 5,
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
      TestStats.resetIncomplete();

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
  AccountButton.loading(true);

  if (!Config.resultSaving) {
    Notifications.add("Result not saved: disabled by user", -1, {
      duration: 3,
      customTitle: "Notice",
      important: true,
    });
    AccountButton.loading(false);
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

  const response = await Ape.results.add({ body: { result } });

  AccountButton.loading(false);

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
    Notifications.add("Failed to save result", -1, { response });
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
    const snapxp = DB.getSnapshot()?.xp ?? 0;

    void XPBar.update(
      snapxp,
      data.xp,
      TestState.resultVisible ? data.xpBreakdown : undefined,
    );
    localDataToSave.xp = data.xp;
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
    Notifications.add("Result saved", 1, { important: true });
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
  if (!Config.resultSaving) return;
  const testSeconds = TestStats.calculateTestSeconds(performance.now());
  const afkseconds = TestStats.calculateAfkSeconds(testSeconds);
  let tt = Numbers.roundTo2(testSeconds - afkseconds);
  if (tt < 0) tt = 0;
  TestStats.incrementIncompleteSeconds(tt);
  TestStats.incrementRestartCount();
  const acc = Numbers.roundTo2(TestStats.calculateAccuracy());
  TestStats.pushIncompleteTest(acc, tt);
}

const debouncedZipfCheck = debounce(250, async () => {
  const supports = await JSONData.checkIfLanguageSupportsZipf(Config.language);
  if (supports === "no") {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language),
      )} does not support Zipf funbox, because the list is not ordered by frequency. Please try another word list.`,
      0,
      {
        duration: 7,
      },
    );
  }
  if (supports === "unknown") {
    Notifications.add(
      `${Strings.capitalizeFirstLetter(
        Strings.getLanguageDisplayString(Config.language),
      )} may not support Zipf funbox, because we don't know if it's ordered by frequency or not. If you would like to add this label, please contact us.`,
      0,
      {
        duration: 7,
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
  ManualRestart.set();
  if (TestUI.resultCalculating) return;
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
  ManualRestart.set();
  restart();
});

qs(".pageTest")?.onChild("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode === "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  ManualRestart.set();
  restart({
    withSameWordset: true,
  });
});

qs(".pageTest")?.onChild("click", "#testConfig .mode .textButton", (e) => {
  if (TestState.testRestarting) return;
  if ((e.childTarget as HTMLElement).classList.contains("active")) return;
  const mode = ((e.childTarget as HTMLElement)?.getAttribute("mode") ??
    "time") as Mode;
  if (mode === undefined) return;
  if (setConfig("mode", mode)) {
    ManualRestart.set();
    restart();
  }
});

qs(".pageTest")?.onChild("click", "#testConfig .wordCount .textButton", (e) => {
  if (TestState.testRestarting) return;
  const wrd = (e.childTarget as HTMLElement)?.getAttribute("wordCount") ?? "15";
  if (wrd !== "custom") {
    if (setConfig("words", parseInt(wrd))) {
      ManualRestart.set();
      restart();
    }
  }
});

qs(".pageTest")?.onChild("click", "#testConfig .time .textButton", (e) => {
  if (TestState.testRestarting) return;
  const mode =
    (e.childTarget as HTMLElement)?.getAttribute("timeConfig") ?? "10";
  if (mode !== "custom") {
    if (setConfig("time", parseInt(mode))) {
      ManualRestart.set();
      restart();
    }
  }
});

qs(".pageTest")?.onChild(
  "click",
  "#testConfig .quoteLength .textButton",
  (e) => {
    if (TestState.testRestarting) return;
    const lenAttr = (e.childTarget as HTMLElement)?.getAttribute("quoteLength");
    if (lenAttr === "all") {
      if (setQuoteLengthAll()) {
        ManualRestart.set();
        restart();
      }
    } else {
      const len = parseInt(lenAttr ?? "1") as QuoteLength;

      if (len !== -2) {
        let arr: QuoteLengthConfig = [];

        if (e.shiftKey) {
          arr = [...Config.quoteLength, len];
        } else {
          arr = [len];
        }

        if (setConfig("quoteLength", arr)) {
          ManualRestart.set();
          restart();
        }
      }
    }
  },
);

qs(".pageTest")?.onChild(
  "click",
  "#testConfig .punctuationMode.textButton",
  () => {
    if (TestState.testRestarting) return;
    if (setConfig("punctuation", !Config.punctuation)) {
      ManualRestart.set();
      restart();
    }
  },
);

qs(".pageTest")?.onChild("click", "#testConfig .numbersMode.textButton", () => {
  if (TestState.testRestarting) return;
  if (setConfig("numbers", !Config.numbers)) {
    ManualRestart.set();
    restart();
  }
});

qs("header")?.onChild("click", "nav #startTestButton, #logo", () => {
  if (getActivePage() === "test") restart();
  // Result.showConfetti();
});

// ===============================

ConfigEvent.subscribe(({ key, newValue, nosave }) => {
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
        void KeymapEvent.highlight(
          Arrays.nthElementFromArray(
            // ignoring for now but this might need a different approach
            // oxlint-disable-next-line no-misused-spread
            [...TestWords.words.getCurrent()],
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

TimerEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "fail" && eventValue !== undefined) fail(eventValue);
  if (eventKey === "finish") void finish();
});
