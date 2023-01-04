import Ape from "../ape";
import * as TestUI from "./test-ui";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";
import QuotesController from "../controllers/quotes-controller";
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
import * as QuoteSubmitPopup from "../popups/quote-submit-popup";
import * as PbCrown from "./pb-crown";
import * as TestTimer from "./test-timer";
import * as OutOfFocus from "./out-of-focus";
import * as AccountButton from "../elements/account-button";
import * as DB from "../db";
import * as Replay from "./replay";
import * as TodayTracker from "./today-tracker";
import * as Wordset from "./wordset";
import * as ChallengeContoller from "../controllers/challenge-controller";
import * as QuoteRatePopup from "../popups/quote-rate-popup";
import * as BritishEnglish from "./british-english";
import * as EnglishPunctuation from "./english-punctuation";
import * as LazyMode from "./lazy-mode";
import * as Result from "./result";
import * as MonkeyPower from "../elements/monkey-power";
import * as ActivePage from "../states/active-page";
import * as TestActive from "../states/test-active";
import * as TestInput from "./test-input";
import * as TestWords from "./test-words";
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

function shouldCapitalize(lastChar: string): boolean {
  return /[?!.؟]/.test(lastChar);
}

let spanishSentenceTracker = "";
export async function punctuateWord(
  previousWord: string,
  currentWord: string,
  index: number,
  maxindex: number
): Promise<string> {
  let word = currentWord;

  const currentLanguage = Config.language.split("_")[0];

  const lastChar = Misc.getLastChar(previousWord);

  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.punctuateWord
  );
  if (funbox?.functions?.punctuateWord) {
    return funbox.functions.punctuateWord(word);
  }
  if (
    currentLanguage != "code" &&
    currentLanguage != "georgian" &&
    (index == 0 || shouldCapitalize(lastChar))
  ) {
    //always capitalise the first word or if there was a dot unless using a code alphabet or the Georgian language

    word = Misc.capitalizeFirstLetterOfEachWord(word);

    if (currentLanguage == "turkish") {
      word = word.replace(/I/g, "İ");
    }

    if (currentLanguage == "spanish" || currentLanguage == "catalan") {
      const rand = Math.random();
      if (rand > 0.9) {
        word = "¿" + word;
        spanishSentenceTracker = "?";
      } else if (rand > 0.8) {
        word = "¡" + word;
        spanishSentenceTracker = "!";
      }
    }
  } else if (
    (Math.random() < 0.1 &&
      lastChar != "." &&
      lastChar != "," &&
      index != maxindex - 2) ||
    index == maxindex - 1
  ) {
    if (currentLanguage == "spanish" || currentLanguage == "catalan") {
      if (spanishSentenceTracker == "?" || spanishSentenceTracker == "!") {
        word += spanishSentenceTracker;
        spanishSentenceTracker = "";
      }
    } else {
      const rand = Math.random();
      if (rand <= 0.8) {
        if (currentLanguage == "kurdish") {
          word += ".";
        } else if (currentLanguage === "nepali") {
          word += "।";
        } else {
          word += ".";
        }
      } else if (rand > 0.8 && rand < 0.9) {
        if (currentLanguage == "french") {
          word = "?";
        } else if (
          currentLanguage == "arabic" ||
          currentLanguage == "persian" ||
          currentLanguage == "urdu" ||
          currentLanguage == "kurdish"
        ) {
          word += "؟";
        } else if (currentLanguage == "greek") {
          word += ";";
        } else {
          word += "?";
        }
      } else {
        if (currentLanguage == "french") {
          word = "!";
        } else {
          word += "!";
        }
      }
    }
  } else if (
    Math.random() < 0.01 &&
    lastChar != "," &&
    lastChar != "." &&
    currentLanguage !== "russian"
  ) {
    word = `"${word}"`;
  } else if (
    Math.random() < 0.011 &&
    lastChar != "," &&
    lastChar != "." &&
    currentLanguage !== "russian" &&
    currentLanguage !== "ukrainian"
  ) {
    word = `'${word}'`;
  } else if (Math.random() < 0.012 && lastChar != "," && lastChar != ".") {
    if (currentLanguage == "code") {
      const r = Math.random();
      if (r < 0.25) {
        word = `(${word})`;
      } else if (r < 0.5) {
        word = `{${word}}`;
      } else if (r < 0.75) {
        word = `[${word}]`;
      } else {
        word = `<${word}>`;
      }
    } else {
      word = `(${word})`;
    }
  } else if (
    Math.random() < 0.013 &&
    lastChar != "," &&
    lastChar != "." &&
    lastChar != ";" &&
    lastChar != "؛" &&
    lastChar != ":"
  ) {
    if (currentLanguage == "french") {
      word = ":";
    } else if (currentLanguage == "greek") {
      word = "·";
    } else {
      word += ":";
    }
  } else if (
    Math.random() < 0.014 &&
    lastChar != "," &&
    lastChar != "." &&
    previousWord != "-"
  ) {
    word = "-";
  } else if (
    Math.random() < 0.015 &&
    lastChar != "," &&
    lastChar != "." &&
    lastChar != ";" &&
    lastChar != "؛" &&
    lastChar != ":"
  ) {
    if (currentLanguage == "french") {
      word = ";";
    } else if (currentLanguage == "greek") {
      word = "·";
    } else if (currentLanguage == "arabic" || currentLanguage == "kurdish") {
      word += "؛";
    } else {
      word += ";";
    }
  } else if (Math.random() < 0.2 && lastChar != ",") {
    if (
      currentLanguage == "arabic" ||
      currentLanguage == "urdu" ||
      currentLanguage == "persian" ||
      currentLanguage == "kurdish"
    ) {
      word += "،";
    } else {
      word += ",";
    }
  } else if (Math.random() < 0.25 && currentLanguage == "code") {
    const specials = ["{", "}", "[", "]", "(", ")", ";", "=", "+", "%", "/"];
    const specialsC = [
      "{",
      "}",
      "[",
      "]",
      "(",
      ")",
      ";",
      "=",
      "+",
      "%",
      "/",
      "/*",
      "*/",
      "//",
      "!=",
      "==",
      "<=",
      ">=",
      "||",
      "&&",
      "<<",
      ">>",
      "%=",
      "&=",
      "*=",
      "++",
      "+=",
      "--",
      "-=",
      "/=",
      "^=",
      "|=",
    ];

    if (
      (Config.language.startsWith("code_c") &&
        !Config.language.startsWith("code_css")) ||
      Config.language.startsWith("code_arduino")
    ) {
      word = Misc.randomElementFromArray(specialsC);
    } else {
      word = Misc.randomElementFromArray(specials);
    }
  } else if (
    Math.random() < 0.5 &&
    currentLanguage === "english" &&
    (await EnglishPunctuation.check(word))
  ) {
    word = await applyEnglishPunctuationToWord(word);
  }
  return word;
}

async function applyEnglishPunctuationToWord(word: string): Promise<string> {
  return EnglishPunctuation.replace(word);
}

export function startTest(): boolean {
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

  TestActive.set(true);
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
  TestStats.setStart(performance.now());
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
      if (
        TestWords.hasTab &&
        !options.event?.shiftKey &&
        Config.quickRestart !== "esc"
      ) {
        return;
      }
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
        Notifications.add("Quick restart disabled. " + message, 0, 3);
        return;
      }
      // }else{
      //   return;
      // }
    }
  }
  if (TestActive.get()) {
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
    UpdateConfig.setMode(PractiseWords.before.mode);
    PractiseWords.resetBefore();
  }

  let repeatWithPace = false;
  if (TestUI.resultVisible && Config.repeatedPace && options.withSameWordset) {
    repeatWithPace = true;
  }

  $("#words").stop(true, true);
  $("#words .smoothScroller").stop(true, true).remove();

  ManualRestart.reset();
  TestTimer.clear();
  TestStats.restart();
  TestInput.restart();
  TestInput.corrected.reset();
  ShiftTracker.reset();
  Caret.hide();
  TestActive.set(false);
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

  $("#showWordHistoryButton").removeClass("loaded");
  $("#restartTestButton").blur();
  MemoryFunboxTimer.reset();
  QuoteRatePopup.clearQuoteStats();
  if (ActivePage.get() == "test" && window.scrollY > 0) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
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
          toPush.forEach((word) => TestWords.words.push(word));
        }
      }
      if (!options.withSameWordset && !shouldQuoteRepeat) {
        TestState.setRepeated(false);
        TestState.setPaceRepeat(repeatWithPace);
        TestWords.setHasTab(false);
        await init();
        await PaceCaret.init();
      } else {
        TestState.setRepeated(true);
        TestState.setPaceRepeat(repeatWithPace);
        TestActive.set(false);
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
            if ($("#commandLineWrapper").hasClass("hidden")) {
              TestUI.focusWords();
            }
            // ChartController.result.update();
            PageTransition.set(false);
          }
        );
    }
  );
}

function getFunboxWord(word: string, wordset?: Misc.Wordset): string {
  const wordFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.getWord
  );
  if (wordFunbox?.functions?.getWord) {
    word = wordFunbox.functions.getWord(wordset);
  }
  return word;
}

function applyFunboxesToWord(word: string): string {
  for (const f of FunboxList.get(Config.funbox)) {
    if (f.functions?.alterText) {
      word = f.functions.alterText(word);
    }
  }
  return word;
}

async function applyBritishEnglishToWord(word: string): Promise<string> {
  if (Config.britishEnglish && /english/.test(Config.language)) {
    word = await BritishEnglish.replace(word);
  }
  return word;
}

function applyLazyModeToWord(
  word: string,
  language: MonkeyTypes.LanguageObject
): string {
  if (Config.lazyMode === true && !language.noLazyMode) {
    word = LazyMode.replaceAccents(word, language.accents);
  }
  return word;
}

async function getNextWord(
  wordset: Misc.Wordset,
  language: MonkeyTypes.LanguageObject,
  wordsBound: number
): Promise<string> {
  let randomWord = wordset.randomWord();
  const previousWord = TestWords.words.get(TestWords.words.length - 1, true);
  const previousWord2 = TestWords.words.get(TestWords.words.length - 2, true);
  if (Config.mode === "quote") {
    randomWord =
      TestWords.randomQuote.textSplit?.[TestWords.words.length] ?? "";
  } else if (
    Config.mode == "custom" &&
    !CustomText.isWordRandom &&
    !CustomText.isTimeRandom
  ) {
    randomWord = CustomText.text[TestWords.words.length];
  } else if (
    Config.mode == "custom" &&
    (CustomText.isWordRandom || CustomText.isTimeRandom) &&
    (wordset.length < 4 || PractiseWords.before.mode !== null)
  ) {
    randomWord = wordset.randomWord();
  } else {
    let regenarationCount = 0; //infinite loop emergency stop button
    while (
      regenarationCount < 100 &&
      (previousWord == randomWord ||
        previousWord2 == randomWord ||
        (Config.mode !== "custom" &&
          !Config.punctuation &&
          randomWord == "I") ||
        (Config.mode !== "custom" &&
          !Config.punctuation &&
          !Config.language.startsWith("code") &&
          /[-=_+[\]{};'\\:"|,./<>?]/i.test(randomWord)) ||
        (Config.mode !== "custom" &&
          !Config.numbers &&
          /[0-9]/i.test(randomWord)))
    ) {
      regenarationCount++;
      randomWord = wordset.randomWord();
    }
  }

  if (randomWord === undefined) {
    randomWord = wordset.randomWord();
  }

  if (
    Config.mode !== "custom" &&
    Config.mode !== "quote" &&
    /[A-Z]/.test(randomWord) &&
    !Config.punctuation &&
    !Config.language.startsWith("german") &&
    !Config.language.startsWith("swiss_german") &&
    !Config.language.startsWith("code")
  ) {
    randomWord = randomWord.toLowerCase();
  }

  randomWord = randomWord.replace(/ +/gm, " ");
  randomWord = randomWord.replace(/^ | $/gm, "");
  randomWord = applyLazyModeToWord(randomWord, language);
  randomWord = getFunboxWord(randomWord, wordset);
  randomWord = await applyBritishEnglishToWord(randomWord);

  if (Config.punctuation) {
    randomWord = await punctuateWord(
      TestWords.words.get(TestWords.words.length - 1),
      randomWord,
      TestWords.words.length,
      wordsBound
    );
  }
  if (Config.numbers) {
    if (Math.random() < 0.1) {
      randomWord = Misc.getNumbers(4);

      if (Config.language.startsWith("kurdish")) {
        randomWord = Misc.convertNumberToArabic(randomWord);
      } else if (Config.language.startsWith("nepali")) {
        randomWord = Misc.convertNumberToNepali(randomWord);
      }
    }
  }

  randomWord = applyFunboxesToWord(randomWord);

  return randomWord;
}

let rememberLazyMode: boolean;
export async function init(): Promise<void> {
  TestActive.set(false);
  MonkeyPower.reset();
  Replay.stopReplayRecording();
  TestWords.words.reset();
  TestUI.setCurrentWordElementIndex(0);
  // accuracy = {
  //   correct: 0,
  //   incorrect: 0,
  // };

  TestInput.input.resetHistory();
  TestInput.input.resetCurrent();

  if (ActivePage.get() == "test") {
    await Funbox.activate();
  }

  if (Config.quoteLength.includes(-3) && !Auth?.currentUser) {
    UpdateConfig.setQuoteLength(-1);
  }
  let language;
  try {
    language = await Misc.getLanguage(Config.language);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to load language"),
      -1
    );
  }
  if (language && language.name !== Config.language) {
    UpdateConfig.setLanguage("english");
  }

  if (!language) {
    UpdateConfig.setLanguage("english");
    try {
      language = await Misc.getLanguage(Config.language);
    } catch (e) {
      Notifications.add(
        Misc.createErrorMessage(e, "Failed to load language"),
        -1
      );
      return;
    }
  }

  if (Config.mode === "quote") {
    let group;
    try {
      group = await Misc.findCurrentGroup(Config.language);
    } catch (e) {
      console.error(
        Misc.createErrorMessage(e, "Failed to find current language group")
      );
      return;
    }
    if (group && group.name !== "code" && group.name !== Config.language) {
      UpdateConfig.setLanguage(group.name);
    }
  }

  if (Config.lazyMode === true && language.noLazyMode) {
    rememberLazyMode = true;
    Notifications.add("This language does not support lazy mode.", 0);
    UpdateConfig.setLazyMode(false, true);
  } else if (rememberLazyMode === true && !language.noLazyMode) {
    UpdateConfig.setLazyMode(true, true);
  }

  if (Config.lazyMode === false && !language.noLazyMode) {
    rememberLazyMode = false;
  }

  let wordsBound = 100;

  const funboxToPush = FunboxList.get(Config.funbox)
    .find((f) => f.properties?.find((fp) => fp.startsWith("toPush")))
    ?.properties?.find((fp) => fp.startsWith("toPush:"));
  if (funboxToPush) {
    wordsBound = +funboxToPush.split(":")[1];
    if (Config.mode === "words" && Config.words < wordsBound) {
      wordsBound = Config.words;
    }
  } else if (Config.showAllLines) {
    if (Config.mode === "quote") {
      wordsBound = 100;
    } else if (Config.mode === "custom") {
      if (CustomText.isWordRandom) {
        wordsBound = CustomText.word;
      } else if (CustomText.isTimeRandom) {
        wordsBound = 100;
      } else {
        wordsBound = CustomText.text.length;
      }
    } else if (Config.mode != "time") {
      wordsBound = Config.words;
    }
  } else {
    if (Config.mode === "words" && Config.words < wordsBound) {
      wordsBound = Config.words;
    }
    if (
      Config.mode == "custom" &&
      CustomText.isWordRandom &&
      CustomText.word < wordsBound
    ) {
      wordsBound = CustomText.word;
    }
    if (Config.mode == "custom" && CustomText.isTimeRandom) {
      wordsBound = 100;
    }
    if (
      Config.mode == "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.text.length < wordsBound
    ) {
      wordsBound = CustomText.text.length;
    }
  }

  if (
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      CustomText.word == 0) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      CustomText.time == 0)
  ) {
    wordsBound = 100;
  }

  if (Config.mode === "words" && Config.words === 0) {
    wordsBound = 100;
  }

  if (
    Config.mode == "time" ||
    Config.mode == "words" ||
    Config.mode == "custom"
  ) {
    let wordList = language.words;
    if (Config.mode == "custom") {
      wordList = CustomText.text;
    }
    const wordset = await Wordset.withWords(wordList);
    let wordCount = 0;

    const sectionFunbox = FunboxList.get(Config.funbox).find(
      (f) => f.functions?.pullSection
    );
    if (sectionFunbox?.functions?.pullSection) {
      while (
        (Config.mode == "words" && Config.words >= wordCount) ||
        (Config.mode === "time" && wordCount < 100)
      ) {
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

        if (section === undefined) continue;

        for (const word of section.words) {
          if (wordCount >= Config.words && Config.mode == "words") {
            wordCount++;
            break;
          }
          wordCount++;
          TestWords.words.push(word);
        }
      }
    }

    if (wordCount == 0) {
      for (let i = 0; i < wordsBound; i++) {
        const randomWord = await getNextWord(wordset, language, wordsBound);

        if (/\t/g.test(randomWord)) {
          TestWords.setHasTab(true);
        }

        const te = randomWord.replace("\n", "\n ").trim();

        if (/ +/.test(te)) {
          const randomList = te.split(" ");
          let id = 0;
          while (id < randomList.length) {
            TestWords.words.push(randomList[id]);
            id++;

            if (
              TestWords.words.length == wordsBound &&
              Config.mode == "custom" &&
              CustomText.isWordRandom
            ) {
              break;
            }
          }
          if (
            Config.mode == "custom" &&
            !CustomText.isWordRandom &&
            !CustomText.isTimeRandom
          ) {
            //
          } else {
            i = TestWords.words.length - 1;
          }
        } else {
          TestWords.words.push(randomWord);
        }
      }
    }
  } else if (Config.mode === "quote") {
    const languageToGet = Config.language.startsWith("swiss_german")
      ? "german"
      : Config.language;

    const quotesCollection = await QuotesController.getQuotes(
      languageToGet,
      Config.quoteLength
    );

    if (quotesCollection.length === 0) {
      TestUI.setTestRestarting(false);
      Notifications.add(
        `No ${Config.language
          .replace(/_\d*k$/g, "")
          .replace(/_/g, " ")} quotes found`,
        0
      );
      if (Auth?.currentUser) {
        QuoteSubmitPopup.show(false);
      }
      UpdateConfig.setMode("words");
      restart();
      return;
    }

    let rq: MonkeyTypes.Quote | undefined = undefined;
    if (Config.quoteLength.includes(-2) && Config.quoteLength.length === 1) {
      const targetQuote = QuotesController.getQuoteById(
        QuoteSearchPopup.selectedId
      );
      if (targetQuote === undefined) {
        rq = <MonkeyTypes.Quote>quotesCollection.groups[0][0];
        Notifications.add("Quote Id Does Not Exist", 0);
      } else {
        rq = targetQuote;
      }
    } else if (Config.quoteLength.includes(-3)) {
      const randomQuote = QuotesController.getRandomFavoriteQuote(
        Config.language
      );

      if (randomQuote === null) {
        Notifications.add("No favorite quotes found", 0);
        UpdateConfig.setQuoteLength(-1);
        restart();
        return;
      }

      rq = randomQuote;
    } else {
      const randomQuote = QuotesController.getRandomQuote();
      if (randomQuote === null) {
        Notifications.add("No quotes found for selected quote length", 0);
        TestUI.setTestRestarting(false);
        return;
      }

      rq = randomQuote;
    }

    if (rq === undefined) return;

    rq.text = rq.text.replace(/ +/gm, " ");
    rq.text = rq.text.replace(/\\\\t/gm, "\t");
    rq.text = rq.text.replace(/\\\\n/gm, "\n");
    rq.text = rq.text.replace(/\\t/gm, "\t");
    rq.text = rq.text.replace(/\\n/gm, "\n");
    rq.text = rq.text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
    rq.text = rq.text.replace(/…/g, "...");
    rq.text = rq.text.trim();
    rq.textSplit = rq.text.split(" ");
    rq.language = Config.language.replace(/_\d*k$/g, "");

    TestWords.setRandomQuote(rq);

    const w = TestWords.randomQuote.textSplit;

    if (w === undefined) return;

    wordsBound = Math.min(wordsBound, w.length);

    for (let i = 0; i < wordsBound; i++) {
      if (/\t/g.test(w[i])) {
        TestWords.setHasTab(true);
      }

      w[i] = applyLazyModeToWord(w[i], language);
      w[i] = applyFunboxesToWord(w[i]);
      w[i] = await applyBritishEnglishToWord(w[i]);

      if (Config.language === "swiss_german") {
        w[i] = w[i].replace(/ß/g, "ss");
      }

      TestWords.words.push(w[i]);
    }
  }
  //handle right-to-left languages
  if (language.leftToRight) {
    TestUI.arrangeCharactersLeftToRight();
  } else {
    TestUI.arrangeCharactersRightToLeft();
  }
  if (language.ligatures) {
    $("#words").addClass("withLigatures");
    $("#resultWordsHistory .words").addClass("withLigatures");
    $("#resultReplay .words").addClass("withLigatures");
  } else {
    $("#words").removeClass("withLigatures");
    $("#resultWordsHistory .words").removeClass("withLigatures");
    $("#resultReplay .words").removeClass("withLigatures");
  }
  // if (Config.mode == "zen") {
  //   // Creating an empty active word element for zen mode
  //   $("#words").append('<div class="word active"></div>');
  //   $("#words").css("height", "auto");
  //   $("#wordsWrapper").css("height", "auto");
  // } else {
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
  // }
}

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
      TestWords.words.length >= CustomText.text.length) ||
    (Config.mode === "quote" &&
      TestWords.words.length >= (TestWords.randomQuote.textSplit?.length ?? 0))
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
      for (const word of section.words) {
        if (wordCount >= Config.words && Config.mode == "words") {
          break;
        }
        wordCount++;
        TestWords.words.push(word);
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

  const randomWord = await getNextWord(wordset, language, bound);

  const split = randomWord.split(" ");
  if (split.length > 1) {
    split.forEach((word) => {
      TestWords.words.push(word);
      TestUI.addWord(word);
    });
  } else {
    TestWords.words.push(randomWord);
    TestUI.addWord(randomWord);
  }
}

interface CompletedEvent extends MonkeyTypes.Result<MonkeyTypes.Mode> {
  keySpacing: number[] | "toolong";
  keyDuration: number[] | "toolong";
  customText: MonkeyTypes.CustomText;
  wpmConsistency: number;
  lang: string;
  challenge?: string | null;
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
      -1
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
  let keyConsistencyArray =
    TestInput.keypressTimings.spacing.array === "toolong"
      ? []
      : TestInput.keypressTimings.spacing.array.slice();
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
  if (!TestActive.get()) return;
  if (Config.mode == "zen" && TestInput.input.current.length != 0) {
    TestInput.input.pushHistory();
    TestInput.corrected.pushHistory();
    Replay.replayGetWordsList(TestInput.input.history);
  }

  TestInput.recordKeypressSpacing(); //this is needed in case there is afk time at the end - to make sure test duration makes sense

  TestUI.setResultCalculating(true);
  TestUI.setResultVisible(true);
  TestStats.setEnd(performance.now());
  TestActive.set(false);
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

  const completedEvent = buildCompletedEvent(difficultyFailed);

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

  if (countUndefined(completedEvent) > 0) {
    console.log(completedEvent);
    Notifications.add(
      "Failed to build result object: One of the fields is undefined or NaN",
      -1
    );
    dontSave = true;
  }

  ///////// completed event ready

  //afk check
  const kps = TestInput.keypressPerSecond.slice(-5);
  let afkDetected = kps.every((second) => second.afk);
  if (TestInput.bailout) afkDetected = false;

  let tooShort = false;
  //fail checks
  if (difficultyFailed) {
    Notifications.add(`Test failed - ${failReason}`, 0, 1);
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
      CustomText.text.length < 10) ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.word < 10) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      CustomText.isTimeRandom &&
      CustomText.time < 15) ||
    (Config.mode === "zen" && completedEvent.testDuration < 15)
  ) {
    Notifications.add("Test invalid - too short", 0);
    tooShort = true;
    dontSave = true;
  } else if (completedEvent.wpm < 0 || completedEvent.wpm > 350) {
    Notifications.add("Test invalid - wpm", 0);
    TestStats.setInvalid();
    dontSave = true;
  } else if (completedEvent.rawWpm < 0 || completedEvent.rawWpm > 350) {
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
      Notifications.add("Long custom text progress saved", 1, 5);

      let newText = CustomText.getCustomText(customTextName, true);
      newText = newText.slice(newProgress);
      CustomText.setText(newText);
    } else {
      // They finished the test
      CustomText.setCustomTextLongProgress(customTextName, 0);
      CustomText.setText(CustomText.getCustomText(customTextName, true));
      Notifications.add("Long custom text completed", 1, 5);
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
    TestInput.setKeypressTimingsTooLong();
  }

  if (dontSave) {
    AnalyticsController.log("testCompletedInvalid");
    return;
  }

  // user is logged in

  if (
    Config.difficulty == "normal" ||
    ((Config.difficulty == "master" || Config.difficulty == "expert") &&
      !difficultyFailed)
  ) {
    TestStats.resetIncomplete();
  }

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
    Notifications.add("Result not saved: disabled by user", -1, 3, "Notice");
    AccountButton.loading(false);
    return;
  }

  if (!ConnectionState.get()) {
    Notifications.add("Result not saved: offline", -1, 2, "Notice");
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
      TestStats.restartCount + 1,
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
    Notifications.add("Result saved", 1);
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
    TestActive.get() &&
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

$("#practiseWordsPopup .button.missed").on("click", () => {
  PractiseWords.hidePopup();
  PractiseWords.init(true, false);
  restart({
    practiseMissed: true,
  });
});

$("#practiseWordsPopup .button.slow").on("click", () => {
  PractiseWords.hidePopup();
  PractiseWords.init(false, true);
  restart({
    practiseMissed: true,
  });
});

$("#practiseWordsPopup .button.both").on("click", () => {
  PractiseWords.hidePopup();
  PractiseWords.init(true, true);
  restart({
    practiseMissed: true,
  });
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
