import Ape from "../ape";
import * as TestUI from "./test-ui";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
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
import * as Focus from "./focus";
import * as Funbox from "./funbox/funbox";
import * as Keymap from "../elements/keymap";
import * as ThemeController from "../controllers/theme-controller";
import * as ResultWordHighlight from "../elements/result-word-highlight";
import * as PaceCaret from "./pace-caret";
import * as Caret from "./caret";
import * as LiveSpeed from "./live-speed";
import * as LiveAcc from "./live-acc";
import * as LiveBurst from "./live-burst";
import * as TimerProgress from "./timer-progress";

import * as TestTimer from "./test-timer";
import * as OutOfFocus from "./out-of-focus";
import * as AccountButton from "../elements/account-button";
import * as DB from "../db";
import * as Replay from "./replay";
import * as TodayTracker from "./today-tracker";
import * as ChallengeContoller from "../controllers/challenge-controller";
import * as QuoteRateModal from "../modals/quote-rate";
import * as Result from "./result";
import * as MonkeyPower from "../elements/monkey-power";
import * as ActivePage from "../states/active-page";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
import * as WordsGenerator from "./words-generator";
import * as TestState from "./test-state";
import * as ModesNotice from "../elements/modes-notice";
import * as PageTransition from "../states/page-transition";
import * as ConfigEvent from "../observables/config-event";
import * as TimerEvent from "../observables/timer-event";
import * as Last10Average from "../elements/last-10-average";
import * as Monkey from "./monkey";
import objectHash from "object-hash";
import * as AnalyticsController from "../controllers/analytics-controller";
import { Auth, isAuthenticated } from "../firebase";
import * as AdController from "../controllers/ad-controller";
import * as TestConfig from "./test-config";
import * as ConnectionState from "../states/connection";
import * as FunboxList from "./funbox/funbox-list";
import * as MemoryFunboxTimer from "./funbox/memory-funbox-timer";
import * as KeymapEvent from "../observables/keymap-event";
import * as LayoutfluidFunboxTimer from "../test/funbox/layoutfluid-funbox-timer";
import * as ArabicLazyMode from "../states/arabic-lazy-mode";
import Format from "../utils/format";
import { QuoteLength } from "@monkeytype/contracts/schemas/configs";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import {
  CompletedEvent,
  CustomTextDataWithTextLen,
} from "@monkeytype/contracts/schemas/results";
import * as XPBar from "../elements/xp-bar";

let failReason = "";
const koInputVisual = document.getElementById("koInputVisual") as HTMLElement;

export let notSignedInLastResult: CompletedEvent | null = null;

export function clearNotSignedInResult(): void {
  notSignedInLastResult = null;
}

export function setNotSignedInUidAndHash(uid: string): void {
  if (notSignedInLastResult === null) return;
  notSignedInLastResult.uid = uid;
  //@ts-expect-error
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
  TimerProgress.show();
  LiveSpeed.show();
  LiveAcc.show();
  LiveBurst.show();
  TimerProgress.update();
  TestTimer.clear();
  Monkey.show();

  for (const f of FunboxList.get(Config.funbox)) {
    if (f.functions?.start) f.functions.start();
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
  return true;
}

type RestartOptions = {
  withSameWordset?: boolean;
  nosave?: boolean;
  event?: JQuery.KeyDownEvent;
  practiseMissed?: boolean;
  noAnim?: boolean;
};

// withSameWordset = false,
// _?: boolean, // this is nosave and should be renamed to nosave when needed
// event?: JQuery.KeyDownEvent,
// practiseMissed = false,
// noAnim = false

export function restart(options = {} as RestartOptions): void {
  const defaultOptions = {
    withSameWordset: false,
    practiseMissed: false,
    noAnim: false,
    nosave: false,
  };

  options = { ...defaultOptions, ...options };
  const animationTime = options.noAnim ? 0 : Misc.applyReducedMotion(125);

  if (TestUI.testRestarting || TestUI.resultCalculating) {
    event?.preventDefault();
    return;
  }
  if (ActivePage.get() === "test") {
    if (!ManualRestart.get()) {
      if (Config.mode !== "zen") event?.preventDefault();
      if (
        !Misc.canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText.getData(),
          CustomTextState.isCustomTextLong() ?? false
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
          }
        );
        return;
      }
    }
  }

  if (TestState.isActive) {
    if (TestState.isRepeated) {
      options.withSameWordset = true;
    }

    if (TestState.savingEnabled) {
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
      UpdateConfig.setPunctuation(PractiseWords.before.punctuation);
    }
    if (PractiseWords.before.numbers !== null) {
      UpdateConfig.setNumbers(PractiseWords.before.numbers);
    }

    if (PractiseWords.before.customText) {
      CustomText.setText(PractiseWords.before.customText.text);
      CustomText.setLimitMode(PractiseWords.before.customText.limit.mode);
      CustomText.setLimitValue(PractiseWords.before.customText.limit.value);
      CustomText.setPipeDelimiter(
        PractiseWords.before.customText.pipeDelimiter
      );
    }

    UpdateConfig.setMode(PractiseWords.before.mode);
    PractiseWords.resetBefore();
  }

  ManualRestart.reset();
  TestTimer.clear();
  TestStats.restart();
  TestInput.restart();
  TestInput.corrected.reset();
  ShiftTracker.reset();
  Caret.hide();
  TestState.setActive(false);
  Replay.stopReplayRecording();
  LiveSpeed.hide();
  LiveAcc.hide();
  LiveBurst.hide();
  TimerProgress.hide();
  Replay.pauseReplay();
  TestState.setBailedOut(false);
  PaceCaret.reset();
  Monkey.hide();
  TestInput.input.setKoreanStatus(false);
  LayoutfluidFunboxTimer.hide();
  MemoryFunboxTimer.reset();
  QuoteRateModal.clearQuoteStats();
  TestUI.reset();

  if (TestUI.resultVisible) {
    if (Config.randomTheme !== "off") {
      void ThemeController.randomizeTheme();
    }
    void XPBar.skipBreakdown();
  }

  if (!ConnectionState.get()) {
    ConnectionState.showOfflineBanner();
  }

  let el = null;
  if (TestUI.resultVisible) {
    //results are being displayed
    el = $("#result");
  } else {
    //words are being displayed
    el = $("#typingTest");
  }
  TestUI.setResultVisible(false);
  PageTransition.set(true);
  TestUI.setTestRestarting(true);
  el.stop(true, true).animate(
    {
      opacity: 0,
    },
    animationTime,
    async () => {
      $("#result").addClass("hidden");
      $("#typingTest").css("opacity", 0).removeClass("hidden");
      $("#wordsInput").val(" ");

      if (Config.language.startsWith("korean")) {
        koInputVisual.innerText = " ";
        Config.mode !== "zen"
          ? $("#koInputVisualContainer").show()
          : $("#koInputVisualContainer").hide();
      } else {
        $("#koInputVisualContainer").hide();
      }

      Focus.set(false);
      if (ActivePage.get() === "test") {
        AdController.updateFooterAndVerticalAds(false);
      }
      TestConfig.show();
      AdController.destroyResult();

      await Funbox.rememberSettings();

      testReinitCount = 0;
      failReason = "";

      let repeatWithPace = false;
      if (Config.repeatedPace && options.withSameWordset) {
        repeatWithPace = true;
      }

      TestState.setRepeated(options.withSameWordset ?? false);
      TestState.setPaceRepeat(repeatWithPace);
      await init();
      await PaceCaret.init();

      for (const f of FunboxList.get(Config.funbox)) {
        if (f.functions?.restart) f.functions.restart();
      }

      if (Config.showAverage !== "off") {
        void Last10Average.update().then(() => {
          void ModesNotice.update();
        });
      } else {
        void ModesNotice.update();
      }

      const isWordsFocused = $("#wordsInput").is(":focus");
      if (isWordsFocused) OutOfFocus.hide();
      TestUI.focusWords();

      $("#typingTest")
        .css("opacity", 0)
        .removeClass("hidden")
        .stop(true, true)
        .animate(
          {
            opacity: 1,
          },
          animationTime,
          () => {
            TimerProgress.reset();
            LiveSpeed.reset();
            LiveAcc.reset();
            LiveBurst.reset();
            TestUI.setTestRestarting(false);
            TestUI.updatePremid();
            ManualRestart.reset();
            PageTransition.set(false);
          }
        );
    }
  );

  ResultWordHighlight.destroy();
}

let rememberLazyMode: boolean;
let testReinitCount = 0;
export async function init(): Promise<void> {
  console.debug("Initializing test");
  testReinitCount++;
  if (testReinitCount >= 4) {
    TestUI.setTestRestarting(false);
    Notifications.add(
      "Too many test reinitialization attempts. Something is going very wrong. Please contact support.",
      -1,
      {
        important: true,
      }
    );
    return;
  }

  MonkeyPower.reset();
  Replay.stopReplayRecording();
  TestWords.words.reset();
  TestUI.setActiveWordElementIndex(0);
  TestInput.input.resetHistory();
  TestInput.input.resetCurrent();

  let language;
  try {
    language = await JSONData.getLanguage(Config.language);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to load language"),
      -1
    );
  }

  if (!language || language.name !== Config.language) {
    UpdateConfig.setLanguage("english");
    await init();
    return;
  }

  if (ActivePage.get() === "test") {
    await Funbox.activate();
  }

  if (Config.mode === "quote") {
    if (Config.quoteLength.includes(-3) && !isAuthenticated()) {
      UpdateConfig.setQuoteLength(-1);
    }
  }

  if (Config.tapeMode !== "off" && language.rightToLeft) {
    Notifications.add("This language does not support tape mode.", 0, {
      important: true,
    });
    UpdateConfig.setTapeMode("off");
  }

  const allowLazyMode = !language.noLazyMode || Config.mode === "custom";
  if (Config.lazyMode && !allowLazyMode) {
    rememberLazyMode = true;
    Notifications.add("This language does not support lazy mode.", 0, {
      important: true,
    });
    UpdateConfig.setLazyMode(false, true);
  } else if (rememberLazyMode && !language.noLazyMode) {
    UpdateConfig.setLazyMode(true, true);
  }

  if (!Config.lazyMode && !language.noLazyMode) {
    rememberLazyMode = false;
  }

  if (Config.mode === "custom") {
    console.debug("Custom text", CustomText.getData());
  }

  let generatedWords: string[];
  let generatedSectionIndexes: number[];
  let wordsHaveTab = false;
  let wordsHaveNewline = false;
  try {
    const gen = await WordsGenerator.generateWords(language);
    generatedWords = gen.words;
    generatedSectionIndexes = gen.sectionIndexes;
    wordsHaveTab = gen.hasTab;
    wordsHaveNewline = gen.hasNewline;
  } catch (e) {
    console.error(e);
    if (e instanceof WordsGenerator.WordGenError) {
      Notifications.add(e.message, 0, {
        important: true,
      });
    } else {
      Notifications.add(
        Misc.createErrorMessage(e, "Failed to generate words"),
        -1,
        {
          important: true,
        }
      );
    }

    await init();
    return;
  }

  const beforeHasNumbers = TestWords.hasNumbers ? true : false;

  let hasNumbers = false;

  for (const word of generatedWords) {
    if (/\d/g.test(word) && !hasNumbers) {
      hasNumbers = true;
    }
  }

  TestWords.setHasNumbers(hasNumbers);
  TestWords.setHasTab(wordsHaveTab);
  TestWords.setHasNewline(wordsHaveNewline);

  if (beforeHasNumbers !== hasNumbers) {
    void Keymap.refresh();
  }

  for (let i = 0; i < generatedWords.length; i++) {
    TestWords.words.push(
      generatedWords[i] as string,
      generatedSectionIndexes[i] as number
    );
  }

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    void KeymapEvent.highlight(
      Arrays.nthElementFromArray([...TestWords.words.getCurrent()], 0) as string
    );
  }
  Funbox.toggleScript(TestWords.words.getCurrent());
  TestUI.setRightToLeft(language.rightToLeft);
  TestUI.setLigatures(language.ligatures ?? false);
  TestUI.showWords();
  console.debug("Test initialized with words", generatedWords);
  console.debug(
    "Test initialized with section indexes",
    generatedSectionIndexes
  );
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
  let bound = 100; // how many extra words to aim for AFTER the current word
  const funboxToPush = FunboxList.get(Config.funbox)
    .find((f) => f.properties?.find((fp) => fp.startsWith("toPush")))
    ?.properties?.find((fp) => fp.startsWith("toPush:"));
  const toPushCount = funboxToPush?.split(":")[1];
  if (toPushCount !== undefined) bound = +toPushCount - 1;
  if (
    TestWords.words.length - TestInput.input.history.length > bound ||
    areAllTestWordsGenerated()
  ) {
    return;
  }

  const sectionFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.pullSection
  );
  if (sectionFunbox?.functions?.pullSection) {
    if (TestWords.words.length - TestWords.words.currentIndex < 20) {
      const section = await sectionFunbox.functions.pullSection(
        Config.language
      );

      if (section === false) {
        Notifications.add(
          "Error while getting section. Please try again later",
          -1
        );
        UpdateConfig.toggleFunbox(sectionFunbox.name);
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
      TestWords.words.get(TestWords.words.length - 2)
    );

    TestWords.words.push(randomWord.word, randomWord.sectionIndex);
    TestUI.addWord(randomWord.word);
  } catch (e) {
    TimerEvent.dispatch("fail", "word generation error");
    Notifications.add(
      Misc.createErrorMessage(
        e,
        "Error while getting next word. Please try again later"
      ),
      -1
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
      }
    );

    return;
  }

  if (!retrySaving.canRetry) {
    return;
  }

  retrySaving.canRetry = false;
  $("#retrySavingResultButton").addClass("hidden");

  AccountButton.loading(true);

  Notifications.add("Retrying to save...");

  await saveResult(completedEvent, true);
}

function buildCompletedEvent(
  difficultyFailed: boolean
): Omit<CompletedEvent, "hash" | "uid"> {
  //build completed event object
  let stfk = Numbers.roundTo2(
    TestInput.keypressTimings.spacing.first - TestStats.start
  );
  if (stfk < 0 || Config.mode === "zen") {
    stfk = 0;
  }

  let lkte = Numbers.roundTo2(
    TestStats.end - TestInput.keypressTimings.spacing.last
  );
  if (lkte < 0 || Config.mode === "zen") {
    lkte = 0;
  }
  // stats
  const stats = TestStats.calculateStats();
  if (stats.time % 1 !== 0 && Config.mode !== "time") {
    TestStats.setLastSecondNotRound();
  }

  PaceCaret.setLastTestWpm(stats.wpm); //todo why is this in here?

  // if the last second was not rounded, add another data point to the history
  if (TestStats.lastSecondNotRound && !difficultyFailed) {
    const wpmAndRaw = TestStats.calculateWpmAndRaw();
    TestInput.pushToWpmHistory(wpmAndRaw.wpm);
    TestInput.pushToRawHistory(wpmAndRaw.raw);
    TestInput.pushKeypressesToHistory();
    TestInput.pushErrorToHistory();
    TestInput.pushAfkToHistory();
  }

  //consistency
  const rawPerSecond = TestInput.keypressCountHistory.map((count) =>
    Math.round((count / 5) * 60)
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
      (rawPerSecond[rawPerSecond.length - 1] as number) * timescale
    );
  }

  const stddev = Numbers.stdDev(rawPerSecond);
  const avg = Numbers.mean(rawPerSecond);
  let consistency = Numbers.roundTo2(Numbers.kogasa(stddev / avg));
  let keyConsistencyArray = TestInput.keypressTimings.spacing.array.slice();
  if (keyConsistencyArray.length > 0) {
    keyConsistencyArray = keyConsistencyArray.slice(
      0,
      keyConsistencyArray.length - 1
    );
  }
  let keyConsistency = Numbers.roundTo2(
    Numbers.kogasa(
      Numbers.stdDev(keyConsistencyArray) / Numbers.mean(keyConsistencyArray)
    )
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
    raw: rawPerSecond,
    err: chartErr,
  };

  //wpm consistency
  const stddev3 = Numbers.stdDev(chartData.wpm ?? []);
  const avg3 = Numbers.mean(chartData.wpm ?? []);
  const wpmCons = Numbers.roundTo2(Numbers.kogasa(stddev3 / avg3));
  const wpmConsistency = isNaN(wpmCons) ? 0 : wpmCons;

  let customText: CustomTextDataWithTextLen | undefined = undefined;
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
  TestStats.setEnd(now);

  if (TestState.isRepeated && Config.mode === "quote") {
    TestState.setRepeated(false);
  }

  await Misc.sleep(1); //this is needed to make sure the last keypress is registered
  if (TestInput.input.current.length !== 0) {
    TestInput.input.pushHistory();
    TestInput.corrected.pushHistory();
    Replay.replayGetWordsList(TestInput.input.history);
  }

  TestInput.forceKeyup(now); //this ensures that the last keypress(es) are registered

  const endAfkSeconds = (now - TestInput.keypressTimings.spacing.last) / 1000;
  if ((Config.mode === "zen" || TestState.bailedOut) && endAfkSeconds < 7) {
    TestStats.setEnd(TestInput.keypressTimings.spacing.last);
  }

  TestUI.setResultVisible(true);
  TestState.setActive(false);
  Replay.stopReplayRecording();
  Caret.hide();
  LiveSpeed.hide();
  LiveAcc.hide();
  LiveBurst.hide();
  TimerProgress.hide();
  OutOfFocus.hide();
  TestTimer.clear();
  Monkey.hide();
  void ModesNotice.update();

  //need one more calculation for the last word if test auto ended
  if (TestInput.burstHistory.length !== TestInput.input.getHistory()?.length) {
    const burst = TestStats.calculateBurst();
    TestInput.pushBurstToHistory(burst);
  }

  //remove afk from zen
  if (Config.mode === "zen" || TestState.bailedOut) {
    TestStats.removeAfkData();
  }

  const ce = buildCompletedEvent(difficultyFailed);

  console.debug("Completed event object", ce);

  function countUndefined(input: unknown): number {
    if (typeof input === "number") {
      return isNaN(input) ? 1 : 0;
    } else if (typeof input === "undefined") {
      return 1;
    } else if (typeof input === "object" && input !== null) {
      return Object.values(input).reduce(
        (a, b) => (a + countUndefined(b)) as number,
        0
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
      -1
    );
    dontSave = true;
  }

  const completedEvent = Misc.deepClone(ce) as CompletedEvent;

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
    Config.mode !== "zen" &&
    !TestState.bailedOut &&
    (ce.testDuration < dateDur - 0.25 || ce.testDuration > dateDur + 0.25)
  ) {
    //dont bother checking this for zen mode or bailed out tests because
    //the duration might be modified to remove trailing afk time
    //its also not a big deal if the duration is off in those tests
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
    dontSave = true;
  } else if (TestState.isRepeated) {
    Notifications.add("Test invalid - repeated", 0);
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
    TestStats.pushIncompleteTest(acc, tt);
  }

  const customTextName = CustomTextState.getCustomTextName();
  const isLong = CustomTextState.isCustomTextLong();
  if (Config.mode === "custom" && customTextName !== "" && isLong) {
    // Let's update the custom text progress
    if (
      TestState.bailedOut ||
      TestInput.input.history.length < TestWords.words.length
    ) {
      // They bailed out

      const historyLength = TestInput.input.getHistory()?.length;
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
    completedEvent.testDuration - completedEvent.afkDuration
  );
  Result.updateTodayTracker();

  if (!isAuthenticated()) {
    $(".pageTest #result #rateQuoteButton").addClass("hidden");
    $(".pageTest #result #reportQuoteButton").addClass("hidden");
    void AnalyticsController.log("testCompletedNoLogin");
    if (!dontSave) notSignedInLastResult = completedEvent;
    dontSave = true;
  } else {
    $(".pageTest #result #reportQuoteButton").removeClass("hidden");
  }

  $("#result .stats .dailyLeaderboard").addClass("hidden");

  TestStats.setLastResult(Misc.deepClone(completedEvent));

  if (!ConnectionState.get()) {
    ConnectionState.showOfflineBanner();
  }

  await Result.update(
    completedEvent,
    difficultyFailed,
    failReason,
    afkDetected,
    TestState.isRepeated,
    tooShort,
    TestWords.currentQuote,
    dontSave
  );

  if (completedEvent.chartData !== "toolong") {
    // @ts-expect-error TODO: check if this is needed
    delete completedEvent.chartData.unsmoothedRaw;
  }

  if (completedEvent.testDuration > 122) {
    completedEvent.chartData = "toolong";
    completedEvent.keySpacing = "toolong";
    completedEvent.keyDuration = "toolong";
  }

  if (dontSave) {
    void AnalyticsController.log("testCompletedInvalid");
    return;
  }

  // user is logged in
  TestStats.resetIncomplete();

  completedEvent.uid = Auth?.currentUser?.uid as string;
  Result.updateRateQuote(TestWords.currentQuote);

  AccountButton.loading(true);

  if (!completedEvent.bailedOut) {
    const challenge = ChallengeContoller.verify(completedEvent);
    if (challenge !== null) completedEvent.challenge = challenge;
  }

  completedEvent.hash = objectHash(completedEvent);

  await saveResult(completedEvent, false);
}

async function saveResult(
  completedEvent: CompletedEvent,
  isRetrying: boolean
): Promise<void> {
  if (!TestState.savingEnabled) {
    Notifications.add("Result not saved: disabled by user", -1, {
      duration: 3,
      customTitle: "Notice",
      important: true,
    });
    AccountButton.loading(false);
    return;
  }

  if (!ConnectionState.get()) {
    Notifications.add("Result not saved: offline", -1, {
      duration: 2,
      customTitle: "Notice",
      important: true,
    });
    AccountButton.loading(false);
    retrySaving.canRetry = true;
    $("#retrySavingResultButton").removeClass("hidden");
    if (!isRetrying) {
      retrySaving.completedEvent = completedEvent;
    }
    return;
  }

  const response = await Ape.results.add({ body: { result: completedEvent } });

  AccountButton.loading(false);

  if (response.status !== 200) {
    //only allow retry if status is not in this list
    if (![460, 461, 463, 464, 465, 466].includes(response.status)) {
      retrySaving.canRetry = true;
      $("#retrySavingResultButton").removeClass("hidden");
      if (!isRetrying) {
        retrySaving.completedEvent = completedEvent;
      }
    }
    console.log("Error saving result", completedEvent);
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
    Notifications.add("Failed to save result: " + response.body.message, -1);
    return;
  }

  const data = response.body.data;
  $("#result .stats .tags .editTagsButton").attr(
    "data-result-id",
    data.insertedId
  );
  $("#result .stats .tags .editTagsButton").removeClass("invisible");

  if (data.xp !== undefined) {
    const snapxp = DB.getSnapshot()?.xp ?? 0;

    void XPBar.update(
      snapxp,
      data.xp,
      TestUI.resultVisible ? data.xpBreakdown : undefined
    );
    DB.addXp(data.xp);
  }

  if (data.streak !== undefined) {
    DB.setStreak(data.streak);
  }

  if (data.insertedId !== undefined) {
    //TODO - this type cast was not needed before because we were using JSON cloning
    // but now with the stronger types it shows that we are forcing completed event
    // into a snapshot result - might not cuase issues but worth investigating
    const result = Misc.deepClone(
      completedEvent
    ) as unknown as DB.SnapshotResult<Mode>;
    result._id = data.insertedId;
    if (data.isPb !== undefined && data.isPb) {
      result.isPb = true;
    }
    DB.saveLocalResult(result);
    DB.updateLocalStats(
      completedEvent.incompleteTests.length + 1,
      completedEvent.testDuration +
        completedEvent.incompleteTestSeconds -
        completedEvent.afkDuration
    );
  }

  void AnalyticsController.log("testCompleted");

  if (data.isPb !== undefined && data.isPb) {
    //new pb
    const localPb = await DB.getLocalPB(
      completedEvent.mode,
      completedEvent.mode2,
      completedEvent.punctuation,
      completedEvent.numbers,
      completedEvent.language,
      completedEvent.difficulty,
      completedEvent.lazyMode,
      completedEvent.funbox
    );

    if (localPb !== undefined) {
      Result.showConfetti();
    }
    Result.showCrown("normal");

    await DB.saveLocalPB(
      completedEvent.mode,
      completedEvent.mode2,
      completedEvent.punctuation,
      completedEvent.numbers,
      completedEvent.language,
      completedEvent.difficulty,
      completedEvent.lazyMode,
      completedEvent.wpm,
      completedEvent.acc,
      completedEvent.rawWpm,
      completedEvent.consistency
    );
  } else {
    Result.showErrorCrownIfNeeded();
  }

  // if (response.data.dailyLeaderboardRank) {
  //   Notifications.add(
  //     `New ${completedEvent.language} ${completedEvent.mode} ${completedEvent.mode2} rank: ` +
  //       Misc.getPositionString(response.data.dailyLeaderboardRank),
  //     1,
  //     10,
  //     "Daily Leaderboard",
  //     "list-ol"
  //   );
  // }

  if (data.dailyLeaderboardRank === undefined) {
    $("#result .stats .dailyLeaderboard").addClass("hidden");
  } else {
    $("#result .stats .dailyLeaderboard")
      .css({
        maxWidth: "13rem",
        opacity: 0,
      })
      .removeClass("hidden")
      .animate(
        {
          // maxWidth: "10rem",
          opacity: 1,
        },
        Misc.applyReducedMotion(500)
      );
    $("#result .stats .dailyLeaderboard .bottom").html(
      Format.rank(data.dailyLeaderboardRank, { fallback: "" })
    );
  }

  $("#retrySavingResultButton").addClass("hidden");
  if (isRetrying) {
    Notifications.add("Result saved", 1, { important: true });
  }
}

export function fail(reason: string): void {
  failReason = reason;
  // input.pushHistory();
  // corrected.pushHistory();
  TestInput.pushKeypressesToHistory();
  TestInput.pushErrorToHistory();
  TestInput.pushAfkToHistory();
  void finish(true);
  if (!TestState.savingEnabled) return;
  const testSeconds = TestStats.calculateTestSeconds(performance.now());
  const afkseconds = TestStats.calculateAfkSeconds(testSeconds);
  let tt = Numbers.roundTo2(testSeconds - afkseconds);
  if (tt < 0) tt = 0;
  TestStats.incrementIncompleteSeconds(tt);
  TestStats.incrementRestartCount();
  const acc = Numbers.roundTo2(TestStats.calculateAccuracy());
  TestStats.pushIncompleteTest(acc, tt);
}

$(".pageTest").on("click", "#testModesNotice .textButton.restart", () => {
  restart();
});

$(".pageTest").on("click", "#restartTestButton", () => {
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

$(".pageTest").on("click", "#retrySavingResultButton", retrySavingResult);

$(".pageTest").on("click", "#nextTestButton", () => {
  ManualRestart.set();
  restart();
});

$(".pageTest").on("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode === "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  ManualRestart.set();
  restart({
    withSameWordset: true,
  });
});

$(".pageTest").on("click", "#testConfig .mode .textButton", (e) => {
  if (TestUI.testRestarting) return;
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = ($(e.currentTarget).attr("mode") ?? "time") as Mode;
  if (mode === undefined) return;
  UpdateConfig.setMode(mode);
  ManualRestart.set();
  restart();
});

$(".pageTest").on("click", "#testConfig .wordCount .textButton", (e) => {
  if (TestUI.testRestarting) return;
  const wrd = $(e.currentTarget).attr("wordCount") ?? "15";
  if (wrd !== "custom") {
    UpdateConfig.setWordCount(parseInt(wrd));
    ManualRestart.set();
    restart();
  }
});

$(".pageTest").on("click", "#testConfig .time .textButton", (e) => {
  if (TestUI.testRestarting) return;
  const mode = $(e.currentTarget).attr("timeConfig") ?? "10";
  if (mode !== "custom") {
    UpdateConfig.setTimeConfig(parseInt(mode));
    ManualRestart.set();
    restart();
  }
});

$(".pageTest").on("click", "#testConfig .quoteLength .textButton", (e) => {
  if (TestUI.testRestarting) return;
  let len: QuoteLength | QuoteLength[] = parseInt(
    $(e.currentTarget).attr("quoteLength") ?? "1"
  ) as QuoteLength;
  if (len !== -2) {
    if (len === -1) {
      len = [0, 1, 2, 3];
    }
    UpdateConfig.setQuoteLength(len, false, e.shiftKey);
    ManualRestart.set();
    restart();
  }
});

$(".pageTest").on("click", "#testConfig .punctuationMode.textButton", () => {
  if (TestUI.testRestarting) return;
  UpdateConfig.setPunctuation(!Config.punctuation);
  ManualRestart.set();
  restart();
});

$(".pageTest").on("click", "#testConfig .numbersMode.textButton", () => {
  if (TestUI.testRestarting) return;
  UpdateConfig.setNumbers(!Config.numbers);
  ManualRestart.set();
  restart();
});

$("header").on("click", "nav #startTestButton, #logo", () => {
  if (ActivePage.get() === "test") restart();
});

// ===============================

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (ActivePage.get() === "test") {
    if (eventKey === "language") {
      //automatically enable lazy mode for arabic
      if (
        (eventValue as string)?.startsWith("arabic") &&
        ArabicLazyMode.get()
      ) {
        UpdateConfig.setLazyMode(true, true);
      }
      restart();
    }
    if (eventKey === "difficulty" && !nosave) restart();
    if (eventKey === "showAllLines" && !nosave) restart();
    if (
      eventKey === "customLayoutFluid" &&
      Config.funbox.includes("layoutfluid")
    ) {
      restart();
    }

    if (
      eventKey === "keymapMode" &&
      eventValue === "next" &&
      Config.mode !== "zen"
    ) {
      setTimeout(() => {
        void KeymapEvent.highlight(
          Arrays.nthElementFromArray(
            [...TestWords.words.getCurrent()],
            0
          ) as string
        );
      }, 0);
    }
  }
  if (eventKey === "lazyMode" && !nosave) {
    if (Config.language.startsWith("arabic")) {
      ArabicLazyMode.set(eventValue as boolean);
    }
    if (eventValue === false) {
      rememberLazyMode = false;
    }
  }
});

TimerEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "fail" && eventValue !== undefined) fail(eventValue);
  if (eventKey === "finish") void finish();
});
