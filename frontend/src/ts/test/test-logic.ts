import Ape from "../ape";
import * as TestUI from "./test-ui";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";

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
import * as PaceCaret from "./pace-caret";
import * as Caret from "./caret";
import * as LiveWpm from "./live-wpm";
import * as LiveAcc from "./live-acc";
import * as LiveBurst from "./live-burst";
import * as TimerProgress from "./timer-progress";
import * as QuoteSearchPopup from "../popups/quote-search-popup";

import * as PbCrown from "./pb-crown";
import * as TestTimer from "./test-timer";
import * as OutOfFocus from "./out-of-focus";
import * as AccountButton from "../elements/account-button";
import * as DB from "../db";
import * as Replay from "./replay";
import * as TodayTracker from "./today-tracker";
import * as ChallengeContoller from "../controllers/challenge-controller";
import * as QuoteRatePopup from "../popups/quote-rate-popup";
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
import { Auth } from "../firebase";
import * as AdController from "../controllers/ad-controller";
import * as TestConfig from "./test-config";
import * as ConnectionState from "../states/connection";
import * as FunboxList from "./funbox/funbox-list";
import * as MemoryFunboxTimer from "./funbox/memory-funbox-timer";
import * as KeymapEvent from "../observables/keymap-event";
import * as LayoutfluidFunboxTimer from "../test/funbox/layoutfluid-funbox-timer";
import * as Wordset from "./wordset";

let failReason = "";
const koInputVisual = document.getElementById("koInputVisual") as HTMLElement;

export let notSignedInLastResult: MonkeyTypes.Result<MonkeyTypes.Mode> | null =
  null;

export function clearNotSignedInResult(): void {
  notSignedInLastResult = null;
}

export function setNotSignedInUid(uid: string): void {
  if (notSignedInLastResult === null) return;
  notSignedInLastResult.uid = uid;
  delete notSignedInLastResult.hash;
  notSignedInLastResult.hash = objectHash(notSignedInLastResult);
}

export function startTest(now: number): boolean {
  if (PageTransition.get()) {
    return false;
  }
  if (!UpdateConfig.dbConfigLoaded) {
    UpdateConfig.setChangedBeforeDb(true);
  }

  if (Auth?.currentUser) {
    AnalyticsController.log("testStarted");
  } else {
    AnalyticsController.log("testStartedNoLogin");
  }

  TestState.setActive(true);
  Replay.startReplayRecording();
  Replay.replayGetWordsList(TestWords.words.list);
  TestInput.resetKeypressTimings();
  TimerProgress.restart();
  TimerProgress.show();
  $("#liveWpm").text("0");
  LiveWpm.show();
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
  TestTimer.start();
  return true;
}

interface RestartOptions {
  withSameWordset?: boolean;
  nosave?: boolean;
  event?: JQuery.KeyDownEvent;
  practiseMissed?: boolean;
  noAnim?: boolean;
}

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

  if (TestUI.testRestarting || TestUI.resultCalculating) {
    event?.preventDefault();
    return;
  }
  if (ActivePage.get() == "test" && !TestUI.resultVisible) {
    if (!ManualRestart.get()) {
      if (Config.mode !== "zen") event?.preventDefault();
      if (
        !Misc.canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText,
          CustomTextState.isCustomTextLong() ?? false
        )
      ) {
        let message = "Use your mouse to confirm.";
        if (Config.quickRestart === "tab") {
          message = "Press shift + tab or use your mouse to confirm.";
        } else if (Config.quickRestart === "esc") {
          message = "Press shift + escape or use your mouse to confirm.";
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
      // }else{
      //   return;
      // }
    }
  }
  if (TestState.isActive) {
    if (
      Config.repeatQuotes === "typing" &&
      Config.mode === "quote" &&
      Config.language.startsWith(TestWords.randomQuote.language)
    ) {
      options.withSameWordset = true;
    }
    if (TestState.isRepeated) {
      options.withSameWordset = true;
    }

    if (TestState.savingEnabled) {
      TestInput.pushKeypressesToHistory();
      const testSeconds = TestStats.calculateTestSeconds(performance.now());
      const afkseconds = TestStats.calculateAfkSeconds(testSeconds);
      let tt = Misc.roundTo2(testSeconds - afkseconds);
      if (tt < 0) tt = 0;
      TestStats.incrementIncompleteSeconds(tt);
      TestStats.incrementRestartCount();
      const acc = Misc.roundTo2(TestStats.calculateAccuracy());
      TestStats.pushIncompleteTest(acc, tt);
    }
  }

  if (Config.mode == "zen") {
    $("#words").empty();
  }

  if (Config.language.startsWith("korean")) {
    koInputVisual.innerText = " ";
    Config.mode !== "zen"
      ? $("#koInputVisualContainer").show()
      : $("#koInputVisualContainer").hide();
  } else {
    $("#koInputVisualContainer").hide();
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
      CustomText.setIsTimeRandom(PractiseWords.before.customText.isTimeRandom);
      CustomText.setIsWordRandom(PractiseWords.before.customText.isWordRandom);
      CustomText.setWord(PractiseWords.before.customText.word);
      CustomText.setTime(PractiseWords.before.customText.time);
      CustomText.setPopupTextareaState(
        PractiseWords.before.customText.text.join(CustomText.delimiter)
      );
    }

    UpdateConfig.setMode(PractiseWords.before.mode);
    PractiseWords.resetBefore();
  }

  let repeatWithPace = false;
  if (TestUI.resultVisible && Config.repeatedPace && options.withSameWordset) {
    repeatWithPace = true;
  }

  $("#words").stop(true, true);
  $("#words .smoothScroller").stop(true, true).remove();

  testReinitCount = 0;
  ManualRestart.reset();
  TestTimer.clear();
  TestStats.restart();
  TestInput.restart();
  TestInput.corrected.reset();
  ShiftTracker.reset();
  Caret.hide();
  TestState.setActive(false);
  Replay.stopReplayRecording();
  LiveWpm.hide();
  LiveAcc.hide();
  LiveBurst.hide();
  TimerProgress.hide();
  Replay.pauseReplay();
  TestInput.setBailout(false);
  PaceCaret.reset();
  Monkey.hide();
  TestInput.input.setKoreanStatus(false);
  LayoutfluidFunboxTimer.hide();

  $("#showWordHistoryButton").removeClass("loaded");
  $("#restartTestButton").blur();
  MemoryFunboxTimer.reset();
  QuoteRatePopup.clearQuoteStats();
  // if (ActivePage.get() == "test" && window.scrollY > 0) {
  // window.scrollTo({ top: 0, behavior: "smooth" });
  // }
  $("#wordsInput").val(" ");

  TestUI.reset();

  $("#timerNumber").css("opacity", 0);
  let el = null;
  if (TestUI.resultVisible) {
    //results are being displayed
    el = $("#result");
  } else {
    //words are being displayed
    el = $("#typingTest");
  }
  if (TestUI.resultVisible) {
    if (
      Config.randomTheme !== "off" &&
      !PageTransition.get()
      // && Config.customThemeId === ""
    ) {
      ThemeController.randomizeTheme();
    }
    AccountButton.skipXpBreakdown();
  }
  TestUI.setResultVisible(false);
  PageTransition.set(true);
  TestUI.setTestRestarting(true);
  el.stop(true, true).animate(
    {
      opacity: 0,
    },
    options.noAnim ? 0 : 125,
    async () => {
      if (ActivePage.get() == "test") {
        AdController.updateTestPageAds(false);
        Focus.set(false);
      }
      TestConfig.show();
      TestUI.focusWords();
      $("#monkey .fast").stop(true, true).css("opacity", 0);
      $("#monkey").stop(true, true).css({ animationDuration: "0s" });
      $("#typingTest").css("opacity", 0).removeClass("hidden");
      $("#wordsInput").val(" ");
      AdController.destroyResult();
      $("#resultWordsHistory .words").empty();
      $("#resultReplay #replayWords").empty();
      let shouldQuoteRepeat = false;
      if (
        Config.mode === "quote" &&
        Config.repeatQuotes === "typing" &&
        failReason !== ""
      ) {
        shouldQuoteRepeat = true;
      }

      await Funbox.rememberSettings();

      if (options.withSameWordset) {
        const funboxToPush = FunboxList.get(Config.funbox)
          .find((f) => f.properties?.find((fp) => fp.startsWith("toPush")))
          ?.properties?.find((fp) => fp.startsWith("toPush:"));
        if (funboxToPush) {
          const toPushCount = +funboxToPush.split(":")[1];
          const toPush = [];
          for (let i = 0; i < toPushCount; i++) {
            toPush.push(TestWords.words.get(i));
          }
          TestWords.words.reset();
          toPush.forEach((word, index) => TestWords.words.push(word, index));
        }
      }
      if (!options.withSameWordset && !shouldQuoteRepeat) {
        TestState.setRepeated(false);
        TestState.setPaceRepeat(repeatWithPace);
        await init();
        await PaceCaret.init();
      } else {
        TestState.setRepeated(true);
        TestState.setPaceRepeat(repeatWithPace);
        TestState.setActive(false);
        Replay.stopReplayRecording();
        TestWords.words.resetCurrentIndex();
        TestInput.input.reset();
        TestUI.showWords();
        if (Config.keymapMode === "next" && Config.mode !== "zen") {
          KeymapEvent.highlight(
            TestWords.words
              .getCurrent()
              .substring(
                TestInput.input.current.length,
                TestInput.input.current.length + 1
              )
              .toString()
          );
        }
        Funbox.toggleScript(TestWords.words.getCurrent());
        await PaceCaret.init();
      }
      failReason = "";
      if (Config.mode === "quote") {
        TestState.setRepeated(false);
      }
      if (Config.keymapMode !== "off") {
        Keymap.show();
      } else {
        Keymap.hide();
      }
      (<HTMLElement>(
        document.querySelector("#miniTimerAndLiveWpm .wpm")
      )).innerHTML = "0";
      (<HTMLElement>(
        document.querySelector("#miniTimerAndLiveWpm .acc")
      )).innerHTML = "100%";
      (<HTMLElement>(
        document.querySelector("#miniTimerAndLiveWpm .burst")
      )).innerHTML = "0";
      (<HTMLElement>document.querySelector("#liveWpm")).innerHTML = "0";
      (<HTMLElement>document.querySelector("#liveAcc")).innerHTML = "100%";
      (<HTMLElement>document.querySelector("#liveBurst")).innerHTML = "0";

      for (const f of FunboxList.get(Config.funbox)) {
        if (f.functions?.restart) f.functions.restart();
      }

      if (Config.showAverage !== "off") {
        Last10Average.update().then(() => {
          ModesNotice.update();
        });
      }

      const mode2 = Misc.getMode2(Config, TestWords.randomQuote);
      let fbtext = "";
      if (Config.funbox !== "none") {
        fbtext = " " + Config.funbox.split("#").join(" ");
      }
      $(".pageTest #premidTestMode").text(
        `${Config.mode} ${mode2} ${Config.language.replace(/_/g, " ")}${fbtext}`
      );
      $(".pageTest #premidSecondsLeft").text(Config.time);

      $("#result").addClass("hidden");
      $("#testModesNotice").removeClass("hidden").css({
        opacity: 1,
      });
      // resetPaceCaret();
      ModesNotice.update();
      ManualRestart.reset();
      $("#typingTest")
        .css("opacity", 0)
        .removeClass("hidden")
        .stop(true, true)
        .animate(
          {
            opacity: 1,
          },
          options.noAnim ? 0 : 125,
          () => {
            TestUI.setTestRestarting(false);
            // resetPaceCaret();
            PbCrown.hide();
            TestTimer.clear();
            if (!Misc.isPopupVisible("commandLineWrapper")) {
              TestUI.focusWords();
            }
            // ChartController.result.update();
            PageTransition.set(false);
          }
        );
    }
  );
}

let rememberLazyMode: boolean;
let testReinitCount = 0;
export async function init(): Promise<void> {
  console.debug("Initializing test");
  testReinitCount++;
  if (testReinitCount >= 5) {
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

  TestState.setActive(false);
  MonkeyPower.reset();
  Replay.stopReplayRecording();
  TestWords.words.reset();
  TestUI.setCurrentWordElementIndex(0);
  TestInput.input.resetHistory();
  TestInput.input.resetCurrent();

  let language;
  try {
    language = await Misc.getLanguage(Config.language);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to load language"),
      -1
    );
  }

  if (!language || (language && language.name !== Config.language)) {
    UpdateConfig.setLanguage("english");
    await init();
    return;
  }

  if (ActivePage.get() == "test") {
    await Funbox.activate();
  }

  if (Config.mode === "quote") {
    if (Config.quoteLength.includes(-3) && !Auth?.currentUser) {
      UpdateConfig.setQuoteLength(-1);
    }
    let group;
    try {
      group = await Misc.findCurrentGroup(Config.language);
    } catch (e) {
      console.error(
        Misc.createErrorMessage(e, "Failed to find current language group")
      );
      return;
    }
    if (
      group &&
      group.name !== "code" &&
      group.name !== "other" &&
      group.name !== Config.language
    ) {
      UpdateConfig.setLanguage(group.name);
    }
  }

  if (Config.tapeMode !== "off" && language.rightToLeft === true) {
    Notifications.add("This language does not support tape mode.", 0, {
      important: true,
    });
    UpdateConfig.setTapeMode("off");
  }

  if (Config.lazyMode === true && language.noLazyMode) {
    rememberLazyMode = true;
    Notifications.add("This language does not support lazy mode.", 0, {
      important: true,
    });
    UpdateConfig.setLazyMode(false, true);
  } else if (rememberLazyMode === true && !language.noLazyMode) {
    UpdateConfig.setLazyMode(true, true);
  }

  if (Config.lazyMode === false && !language.noLazyMode) {
    rememberLazyMode = false;
  }

  let generatedWords: string[];
  let generatedSectionIndexes: number[];
  try {
    const gen = await WordsGenerator.generateWords(language);
    generatedWords = gen.words;
    generatedSectionIndexes = gen.sectionIndexes;
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

  let hasTab = false;
  let hasNumbers = false;

  for (const word of generatedWords) {
    if (/\t/g.test(word) && !hasTab) {
      hasTab = true;
    }
    if (/\d/g.test(word) && !hasNumbers) {
      hasNumbers = true;
    }
  }

  TestWords.setHasTab(hasTab);
  TestWords.setHasNumbers(hasNumbers);

  if (beforeHasNumbers !== hasNumbers) {
    Keymap.refresh();
  }

  for (let i = 0; i < generatedWords.length; i++) {
    TestWords.words.push(generatedWords[i], generatedSectionIndexes[i]);
  }

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    KeymapEvent.highlight(
      Misc.nthElementFromArray([...TestWords.words.getCurrent()], 0) as string
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

//add word during the test
export async function addWord(): Promise<void> {
  let bound = 100;
  const funboxToPush = FunboxList.get(Config.funbox)
    .find((f) => f.properties?.find((fp) => fp.startsWith("toPush")))
    ?.properties?.find((fp) => fp.startsWith("toPush:"));
  const toPushCount: string | undefined = funboxToPush?.split(":")[1];
  if (toPushCount) bound = +toPushCount - 1;
  if (
    TestWords.words.length - TestInput.input.history.length > bound ||
    (Config.mode === "words" &&
      TestWords.words.length >= Config.words &&
      Config.words > 0) ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      TestWords.words.length >= CustomText.word &&
      CustomText.word != 0) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      !CustomText.isSectionRandom &&
      TestWords.words.length >= CustomText.text.length) ||
    (Config.mode === "quote" &&
      TestWords.words.length >=
        (TestWords.randomQuote.textSplit?.length ?? 0)) ||
    (Config.mode === "custom" &&
      CustomText.isSectionRandom &&
      WordsGenerator.sectionIndex >= CustomText.section &&
      WordsGenerator.currentSection.length === 0 &&
      CustomText.section != 0)
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
        const word = section.words[i];
        if (wordCount >= Config.words && Config.mode == "words") {
          break;
        }
        wordCount++;
        TestWords.words.push(word, i);
        TestUI.addWord(word);
      }
    }
  }

  const language: MonkeyTypes.LanguageObject =
    Config.mode !== "custom"
      ? await Misc.getCurrentLanguage(Config.language)
      : {
          //borrow the direction of the current language
          ...(await Misc.getCurrentLanguage(Config.language)),
          words: CustomText.text,
        };
  const wordset = await Wordset.withWords(language.words);

  const randomWord = await WordsGenerator.getNextWord(
    wordset,
    TestWords.words.length,
    language,
    bound,
    TestWords.words.get(TestWords.words.length - 1),
    TestWords.words.get(TestWords.words.length - 2)
  );

  TestWords.words.push(randomWord.word, randomWord.sectionIndex);
  TestUI.addWord(randomWord.word);
}

interface CompletedEvent extends MonkeyTypes.Result<MonkeyTypes.Mode> {
  keySpacing: number[] | "toolong";
  keyDuration: number[] | "toolong";
  customText: MonkeyTypes.CustomText;
  wpmConsistency: number;
  lang: string;
  challenge?: string | null;
  keyOverlap: number;
  lastKeyToEnd: number;
  startToFirstKey: number;
  charTotal: number;
}

type PartialCompletedEvent = Omit<Partial<CompletedEvent>, "chartData"> & {
  chartData: Partial<MonkeyTypes.ChartData>;
};

interface RetrySaving {
  completedEvent: CompletedEvent | null;
  canRetry: boolean;
}

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

  saveResult(completedEvent, true);
}

function buildCompletedEvent(difficultyFailed: boolean): CompletedEvent {
  //build completed event object
  const completedEvent: PartialCompletedEvent = {
    wpm: undefined,
    rawWpm: undefined,
    charStats: undefined,
    charTotal: undefined,
    acc: undefined,
    mode: Config.mode,
    mode2: undefined,
    quoteLength: -1,
    punctuation: Config.punctuation,
    numbers: Config.numbers,
    lazyMode: Config.lazyMode,
    timestamp: Date.now(),
    language: Config.language,
    restartCount: TestStats.restartCount,
    incompleteTests: TestStats.incompleteTests,
    incompleteTestSeconds:
      TestStats.incompleteSeconds < 0
        ? 0
        : Misc.roundTo2(TestStats.incompleteSeconds),
    difficulty: Config.difficulty,
    blindMode: Config.blindMode,
    tags: undefined,
    keySpacing: TestInput.keypressTimings.spacing.array,
    keyDuration: TestInput.keypressTimings.duration.array,
    keyOverlap: Misc.roundTo2(TestInput.keyOverlap.total),
    lastKeyToEnd: undefined,
    startToFirstKey: undefined,
    consistency: undefined,
    keyConsistency: undefined,
    funbox: Config.funbox,
    bailedOut: TestInput.bailout,
    chartData: {
      wpm: TestInput.wpmHistory,
      raw: undefined,
      err: undefined,
    },
    customText: undefined,
    testDuration: undefined,
    afkDuration: undefined,
  };

  const stfk = Misc.roundTo2(
    TestInput.keypressTimings.spacing.first - TestStats.start
  );

  if (stfk < 0) {
    completedEvent.startToFirstKey = 0;
  } else {
    completedEvent.startToFirstKey = stfk;
  }

  const lkte = Misc.roundTo2(
    TestStats.end - TestInput.keypressTimings.spacing.last
  );

  if (lkte < 0 || Config.mode === "zen") {
    completedEvent.lastKeyToEnd = 0;
  } else {
    completedEvent.lastKeyToEnd = lkte;
  }

  // stats
  const stats = TestStats.calculateStats();
  if (stats.time % 1 != 0 && Config.mode !== "time") {
    TestStats.setLastSecondNotRound();
  }
  TestStats.setLastTestWpm(stats.wpm);
  completedEvent.wpm = stats.wpm;
  completedEvent.rawWpm = stats.wpmRaw;
  completedEvent.charStats = [
    stats.correctChars + stats.correctSpaces,
    stats.incorrectChars,
    stats.extraChars,
    stats.missedChars,
  ];
  completedEvent.charTotal = stats.allChars;
  completedEvent.acc = stats.acc;

  // if the last second was not rounded, add another data point to the history
  if (TestStats.lastSecondNotRound && !difficultyFailed) {
    const wpmAndRaw = TestStats.calculateWpmAndRaw();
    TestInput.pushToWpmHistory(wpmAndRaw.wpm);
    TestInput.pushToRawHistory(wpmAndRaw.raw);
    TestInput.pushKeypressesToHistory();
  }

  //consistency
  const rawPerSecond = TestInput.keypressPerSecond.map((f) =>
    Math.round((f.count / 5) * 60)
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
      rawPerSecond[rawPerSecond.length - 1] * timescale
    );
  }

  const stddev = Misc.stdDev(rawPerSecond);
  const avg = Misc.mean(rawPerSecond);
  let consistency = Misc.roundTo2(Misc.kogasa(stddev / avg));
  let keyConsistencyArray = TestInput.keypressTimings.spacing.array.slice();
  if (keyConsistencyArray.length > 0) {
    keyConsistencyArray = keyConsistencyArray.slice(
      0,
      keyConsistencyArray.length - 1
    );
  }
  let keyConsistency = Misc.roundTo2(
    Misc.kogasa(
      Misc.stdDev(keyConsistencyArray) / Misc.mean(keyConsistencyArray)
    )
  );
  if (!consistency || isNaN(consistency)) {
    consistency = 0;
  }
  if (!keyConsistency || isNaN(keyConsistency)) {
    keyConsistency = 0;
  }
  completedEvent.keyConsistency = keyConsistency;
  completedEvent.consistency = consistency;
  completedEvent.chartData.raw = rawPerSecond;

  //wpm consistency
  const stddev3 = Misc.stdDev(completedEvent.chartData.wpm ?? []);
  const avg3 = Misc.mean(completedEvent.chartData.wpm ?? []);
  const wpmConsistency = Misc.roundTo2(Misc.kogasa(stddev3 / avg3));
  completedEvent.wpmConsistency = isNaN(wpmConsistency) ? 0 : wpmConsistency;

  completedEvent.testDuration = parseFloat(stats.time.toString());
  completedEvent.afkDuration = TestStats.calculateAfkSeconds(
    completedEvent.testDuration
  );

  completedEvent.chartData.err = [];
  for (let i = 0; i < TestInput.keypressPerSecond.length; i++) {
    completedEvent.chartData.err.push(TestInput.keypressPerSecond[i].errors);
  }

  if (Config.mode === "quote") {
    completedEvent.quoteLength = TestWords.randomQuote.group;
    completedEvent.language = Config.language.replace(/_\d*k$/g, "");
  } else {
    delete completedEvent.quoteLength;
  }

  // @ts-ignore TODO fix this
  completedEvent.mode2 = Misc.getMode2(Config, TestWords.randomQuote);

  if (Config.mode === "custom") {
    completedEvent.customText = <MonkeyTypes.CustomText>{};
    completedEvent.customText.textLen = CustomText.text.length;
    completedEvent.customText.isWordRandom = CustomText.isWordRandom;
    completedEvent.customText.isTimeRandom = CustomText.isTimeRandom;
    completedEvent.customText.word = CustomText.word;
    completedEvent.customText.time = CustomText.time;
  } else {
    delete completedEvent.customText;
  }

  //tags
  const activeTagsIds: string[] = [];
  try {
    DB.getSnapshot()?.tags?.forEach((tag) => {
      if (tag.active === true) {
        activeTagsIds.push(tag._id);
      }
    });
  } catch (e) {}
  completedEvent.tags = activeTagsIds;

  if (completedEvent.mode != "custom") delete completedEvent.customText;

  return <CompletedEvent>completedEvent;
}

export async function finish(difficultyFailed = false): Promise<void> {
  if (!TestState.isActive) return;
  TestUI.setResultCalculating(true);
  const now = performance.now();
  TestStats.setEnd(now);

  await Misc.sleep(1); //this is needed to make sure the last keypress is registered
  if (TestInput.input.current.length != 0) {
    TestInput.input.pushHistory();
    TestInput.corrected.pushHistory();
    Replay.replayGetWordsList(TestInput.input.history);
  }

  TestInput.forceKeyup(now); //this ensures that the last keypress(es) are registered

  const endAfkSeconds = (now - TestInput.keypressTimings.spacing.last) / 1000;
  if ((Config.mode == "zen" || TestInput.bailout) && endAfkSeconds < 7) {
    TestStats.setEnd(TestInput.keypressTimings.spacing.last);
  }

  TestUI.setResultVisible(true);
  TestState.setActive(false);
  Replay.stopReplayRecording();
  Focus.set(false);
  Caret.hide();
  LiveWpm.hide();
  PbCrown.hide();
  LiveAcc.hide();
  LiveBurst.hide();
  TimerProgress.hide();
  OutOfFocus.hide();
  TestTimer.clear();
  Funbox.clear();
  Monkey.hide();
  ModesNotice.update();

  //need one more calculation for the last word if test auto ended
  if (TestInput.burstHistory.length !== TestInput.input.getHistory().length) {
    const burst = TestStats.calculateBurst();
    TestInput.pushBurstToHistory(burst);
  }

  //remove afk from zen
  if (Config.mode == "zen" || TestInput.bailout) {
    TestStats.removeAfkData();
  }

  const ce = buildCompletedEvent(difficultyFailed);

  function countUndefined(input: unknown): number {
    if (typeof input === "number") {
      return isNaN(input) ? 1 : 0;
    } else if (typeof input === "undefined") {
      return 1;
    } else if (typeof input === "object" && input !== null) {
      return Object.values(input).reduce(
        (a, b) => a + countUndefined(b),
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

  const completedEvent = JSON.parse(JSON.stringify(ce));

  ///////// completed event ready

  //afk check
  const kps = TestInput.keypressPerSecond.slice(-5);
  let afkDetected = kps.every((second) => second.afk);
  if (TestInput.bailout) afkDetected = false;

  let tooShort = false;
  //fail checks
  if (difficultyFailed) {
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
    (Config.mode === "time" &&
      completedEvent.mode2 < 15 &&
      completedEvent.mode2 > 0) ||
    (Config.mode === "time" &&
      completedEvent.mode2 == 0 &&
      completedEvent.testDuration < 15) ||
    (Config.mode === "words" &&
      completedEvent.mode2 < 10 &&
      completedEvent.mode2 > 0) ||
    (Config.mode === "words" &&
      completedEvent.mode2 == 0 &&
      completedEvent.testDuration < 15) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      !CustomText.isSectionRandom &&
      CustomText.text.length < 10) ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      !CustomText.isSectionRandom &&
      CustomText.word < 10) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isSectionRandom &&
      CustomText.isTimeRandom &&
      CustomText.time < 15) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.isSectionRandom &&
      TestWords.words.length < 10) ||
    (Config.mode === "zen" && completedEvent.testDuration < 15)
  ) {
    Notifications.add("Test invalid - too short", 0);
    tooShort = true;
    dontSave = true;
  } else if (
    completedEvent.wpm < 0 ||
    (completedEvent.wpm > 350 &&
      completedEvent.mode != "words" &&
      completedEvent.mode2 != "10") ||
    (completedEvent.wpm > 420 &&
      completedEvent.mode == "words" &&
      completedEvent.mode2 == "10")
  ) {
    Notifications.add("Test invalid - wpm", 0);
    TestStats.setInvalid();
    dontSave = true;
  } else if (
    completedEvent.rawWpm < 0 ||
    (completedEvent.rawWpm > 350 &&
      completedEvent.mode != "words" &&
      completedEvent.mode2 != "10") ||
    (completedEvent.rawWpm > 420 &&
      completedEvent.mode == "words" &&
      completedEvent.mode2 == "10")
  ) {
    Notifications.add("Test invalid - raw", 0);
    TestStats.setInvalid();
    dontSave = true;
  } else if (completedEvent.acc < 75 || completedEvent.acc > 100) {
    Notifications.add("Test invalid - accuracy", 0);
    TestStats.setInvalid();
    dontSave = true;
  }

  // test is valid

  if (TestState.isRepeated) {
    const testSeconds = completedEvent.testDuration;
    const afkseconds = completedEvent.afkDuration;
    let tt = Misc.roundTo2(testSeconds - afkseconds);
    if (tt < 0) tt = 0;
    const acc = completedEvent.acc;
    TestStats.incrementIncompleteSeconds(tt);
    TestStats.pushIncompleteTest(acc, tt);
  }

  const customTextName = CustomTextState.getCustomTextName();
  const isLong = CustomTextState.isCustomTextLong();
  if (Config.mode === "custom" && customTextName !== "" && isLong) {
    // Let's update the custom text progress
    if (TestInput.bailout || TestInput.input.length < TestWords.words.length) {
      // They bailed out
      const newProgress =
        CustomText.getCustomTextLongProgress(customTextName) +
        TestInput.input.getHistory().length;
      CustomText.setCustomTextLongProgress(customTextName, newProgress);
      Notifications.add("Long custom text progress saved", 1, {
        duration: 5,
        important: true,
      });

      let newText = CustomText.getCustomText(customTextName, true);
      newText = newText.slice(newProgress);
      CustomText.setPopupTextareaState(newText.join(CustomText.delimiter));
      CustomText.setText(newText);
    } else {
      // They finished the test
      CustomText.setCustomTextLongProgress(customTextName, 0);
      const text = CustomText.getCustomText(customTextName, true);
      CustomText.setPopupTextareaState(text.join(CustomText.delimiter));
      CustomText.setText(text);
      Notifications.add("Long custom text completed", 1, {
        duration: 5,
        important: true,
      });
    }
  }

  if (!dontSave) {
    TodayTracker.addSeconds(
      completedEvent.testDuration +
        (TestStats.incompleteSeconds < 0
          ? 0
          : Misc.roundTo2(TestStats.incompleteSeconds)) -
        completedEvent.afkDuration
    );
    Result.updateTodayTracker();
  }

  if (!Auth?.currentUser) {
    $(".pageTest #result #rateQuoteButton").addClass("hidden");
    $(".pageTest #result #reportQuoteButton").addClass("hidden");
    AnalyticsController.log("testCompletedNoLogin");
    if (!dontSave) notSignedInLastResult = completedEvent;
    dontSave = true;
  } else {
    $(".pageTest #result #reportQuoteButton").removeClass("hidden");
  }

  $("#result .stats .dailyLeaderboard").addClass("hidden");

  TestStats.setLastResult(JSON.parse(JSON.stringify(completedEvent)));

  await Result.update(
    completedEvent,
    difficultyFailed,
    failReason,
    afkDetected,
    TestState.isRepeated,
    tooShort,
    TestWords.randomQuote,
    dontSave
  );

  if (completedEvent.chartData !== "toolong") {
    delete completedEvent.chartData.unsmoothedRaw;
  }

  if (completedEvent.testDuration > 122) {
    completedEvent.chartData = "toolong";
    completedEvent.keySpacing = "toolong";
    completedEvent.keyDuration = "toolong";
  }

  if (dontSave) {
    AnalyticsController.log("testCompletedInvalid");
    return;
  }

  // user is logged in

  TestStats.resetIncomplete();

  completedEvent.uid = Auth?.currentUser?.uid as string;
  Result.updateRateQuote(TestWords.randomQuote);

  AccountButton.loading(true);
  if (completedEvent.bailedOut !== true) {
    completedEvent.challenge = ChallengeContoller.verify(completedEvent);
  }

  if (completedEvent.challenge === null) delete completedEvent?.challenge;

  completedEvent.hash = objectHash(completedEvent);

  saveResult(completedEvent, false);
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

  const response = await Ape.results.save(completedEvent);

  AccountButton.loading(false);
  Result.hideCrown();

  if (response.status !== 200) {
    //only allow retry if status is not in this list
    if (![460, 461, 463, 464, 465].includes(response.status)) {
      retrySaving.canRetry = true;
      $("#retrySavingResultButton").removeClass("hidden");
      if (!isRetrying) {
        retrySaving.completedEvent = completedEvent;
      }
    }
    console.log("Error saving result", completedEvent);
    if (response.message === "Old key data format") {
      response.message =
        "Old key data format. Please refresh the page to download the new update. If the problem persists, please contact support.";
    }
    return Notifications.add("Failed to save result: " + response.message, -1);
  }

  $("#result .stats .tags .editTagsButton").attr(
    "result-id",
    response.data.insertedId
  );
  $("#result .stats .tags .editTagsButton").removeClass("invisible");

  if (response?.data?.xp) {
    const snapxp = DB.getSnapshot()?.xp ?? 0;
    AccountButton.updateXpBar(
      snapxp,
      response.data.xp,
      response.data.xpBreakdown
    );
    DB.addXp(response.data.xp);
  }

  if (response?.data?.streak) {
    DB.setStreak(response.data.streak);
  }

  if (response?.data?.insertedId) {
    completedEvent._id = response.data.insertedId;
    if (response?.data?.isPb) {
      completedEvent.isPb = true;
    }
    DB.saveLocalResult(completedEvent);
    DB.updateLocalStats(
      completedEvent.incompleteTests.length + 1,
      completedEvent.testDuration +
        completedEvent.incompleteTestSeconds -
        completedEvent.afkDuration
    );
  }

  AnalyticsController.log("testCompleted");

  if (response?.data?.isPb) {
    //new pb
    if (
      DB.getSnapshot()?.personalBests?.[Config.mode]?.[completedEvent.mode2]
    ) {
      Result.showConfetti();
    }
    Result.showCrown();
    await Result.updateCrown();
    DB.saveLocalPB(
      Config.mode,
      completedEvent.mode2,
      Config.punctuation,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
      completedEvent.wpm,
      completedEvent.acc,
      completedEvent.rawWpm,
      completedEvent.consistency
    );
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

  if (!response?.data?.dailyLeaderboardRank) {
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
        500
      );
    $("#result .stats .dailyLeaderboard .bottom").html(
      Misc.getPositionString(response.data.dailyLeaderboardRank)
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
  finish(true);
  if (!TestState.savingEnabled) return;
  const testSeconds = TestStats.calculateTestSeconds(performance.now());
  const afkseconds = TestStats.calculateAfkSeconds(testSeconds);
  let tt = Misc.roundTo2(testSeconds - afkseconds);
  if (tt < 0) tt = 0;
  TestStats.incrementIncompleteSeconds(tt);
  TestStats.incrementRestartCount();
  const acc = Misc.roundTo2(TestStats.calculateAccuracy());
  TestStats.pushIncompleteTest(acc, tt);
}

$(".pageTest").on("click", "#testModesNotice .textButton.restart", () => {
  restart();
});

$(document).on("keypress", "#restartTestButton", (event) => {
  if (event.key === "Enter") {
    restart();
  }
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

$(document).on("keypress", "#nextTestButton", (event) => {
  if (event.key === "Enter") {
    restart();
  }
});

$(".pageTest").on("click", "#nextTestButton", () => {
  ManualRestart.set();
  restart();
});

$(".pageTest").on("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  ManualRestart.set();
  restart({
    withSameWordset: true,
  });
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  if (event.key === "Enter") {
    restart({
      withSameWordset: true,
    });
  }
});

$(".pageTest").on("click", "#testConfig .mode .textButton", (e) => {
  if (TestUI.testRestarting) return;
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = ($(e.currentTarget).attr("mode") ?? "time") as MonkeyTypes.Mode;
  if (mode === undefined) return;
  UpdateConfig.setMode(mode);
  ManualRestart.set();
  restart();
});

$(".pageTest").on("click", "#testConfig .wordCount .textButton", (e) => {
  if (TestUI.testRestarting) return;
  const wrd = $(e.currentTarget).attr("wordCount") ?? "15";
  if (wrd != "custom") {
    UpdateConfig.setWordCount(parseInt(wrd));
    ManualRestart.set();
    restart();
  }
});

$(".pageTest").on("click", "#testConfig .time .textButton", (e) => {
  if (TestUI.testRestarting) return;
  const mode = $(e.currentTarget).attr("timeConfig") ?? "10";
  if (mode != "custom") {
    UpdateConfig.setTimeConfig(parseInt(mode));
    ManualRestart.set();
    restart();
  }
});

$(".pageTest").on("click", "#testConfig .quoteLength .textButton", (e) => {
  if (TestUI.testRestarting) return;
  let len: MonkeyTypes.QuoteLength | MonkeyTypes.QuoteLength[] = <
    MonkeyTypes.QuoteLength
  >parseInt($(e.currentTarget).attr("quoteLength") ?? "1");
  if (len != -2) {
    if (len == -1) {
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

$("#popups").on("click", "#practiseWordsPopup .button.missed", () => {
  if (PractiseWords.init(true, false)) {
    PractiseWords.hidePopup();
    restart({
      practiseMissed: true,
    });
  }
});

$("#popups").on("click", "#practiseWordsPopup .button.slow", () => {
  if (PractiseWords.init(false, true)) {
    PractiseWords.hidePopup();
    restart({
      practiseMissed: true,
    });
  }
});

$("#popups").on("click", "#practiseWordsPopup .button.both", () => {
  if (PractiseWords.init(true, true)) {
    PractiseWords.hidePopup();
    restart({
      practiseMissed: true,
    });
  }
});

$("#popups").on(
  "click",
  "#quoteSearchPopup #quoteSearchResults .searchResult",
  (e) => {
    if (
      e.target.classList.contains("report") ||
      e.target.classList.contains("favorite")
    ) {
      return;
    }
    const sid = parseInt($(e.currentTarget).attr("id") ?? "");
    QuoteSearchPopup.setSelectedId(sid);
    if (QuoteSearchPopup.apply(sid) === true) restart();
  }
);

$("#top").on("click", "#menu #startTestButton, .logo", () => {
  if (ActivePage.get() === "test") restart();
});

// ===============================

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (ActivePage.get() === "test") {
    if (eventKey === "difficulty" && !nosave) restart();
    if (eventKey === "showAllLines" && !nosave) restart();
    if (eventKey === "keymapMode" && !nosave) restart();
    if (eventKey === "tapeMode" && !nosave) restart();
    if (
      eventKey === "customLayoutFluid" &&
      Config.funbox.includes("layoutfluid")
    ) {
      restart();
    }
  }
  if (eventKey === "lazyMode" && eventValue === false && !nosave) {
    rememberLazyMode = false;
  }
});

TimerEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "fail" && eventValue !== undefined) fail(eventValue);
  if (eventKey === "finish") finish();
});
