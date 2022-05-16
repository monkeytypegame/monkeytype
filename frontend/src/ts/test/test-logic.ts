import Ape from "../ape";
import * as TestUI from "./test-ui";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";
import QuotesController from "../controllers/quotes-controller";
import * as Notifications from "../elements/notifications";
import * as CustomText from "./custom-text";
import * as TestStats from "./test-stats";
import * as PractiseWords from "./practise-words";
import * as ShiftTracker from "./shift-tracker";
import * as Focus from "./focus";
import * as Funbox from "./funbox";
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
import * as Poetry from "./poetry";
import * as Wikipedia from "./wikipedia";
import * as TodayTracker from "./today-tracker";
import * as WeakSpot from "./weak-spot";
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

let failReason = "";

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

  if (Config.funbox === "58008") {
    if (currentWord.length > 3) {
      if (Math.random() < 0.5) {
        word = Misc.setCharAt(
          word,
          Misc.randomIntFromRange(1, word.length - 2),
          "."
        );
      }
      if (Math.random() < 0.75) {
        const index = Misc.randomIntFromRange(1, word.length - 2);
        if (
          word[index - 1] !== "." &&
          word[index + 1] !== "." &&
          word[index + 1] !== "0"
        ) {
          const special = Misc.randomElementFromArray(["/", "*", "-", "+"]);
          word = Misc.setCharAt(word, index, special);
        }
      }
    }
  } else {
    if (
      (index == 0 || lastChar == "." || lastChar == "?" || lastChar == "!") &&
      currentLanguage != "code"
    ) {
      //always capitalise the first word or if there was a dot unless using a code alphabet

      word = Misc.capitalizeFirstLetterOfEachWord(word);

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
          word += ".";
        } else if (rand > 0.8 && rand < 0.9) {
          if (currentLanguage == "french") {
            word = "?";
          } else if (
            currentLanguage == "arabic" ||
            currentLanguage == "persian" ||
            currentLanguage == "urdu"
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
      } else if (currentLanguage == "arabic") {
        word += "؛";
      } else {
        word += ";";
      }
    } else if (Math.random() < 0.2 && lastChar != ",") {
      if (
        currentLanguage == "arabic" ||
        currentLanguage == "urdu" ||
        currentLanguage == "persian"
      ) {
        word += "،";
      } else {
        word += ",";
      }
    } else if (Math.random() < 0.25 && currentLanguage == "code") {
      const specials = ["{", "}", "[", "]", "(", ")", ";", "=", "+", "%", "/"];

      word = Misc.randomElementFromArray(specials);
    } else if (
      Math.random() < 0.5 &&
      currentLanguage === "english" &&
      (await EnglishPunctuation.check(word))
    ) {
      word = await applyEnglishPunctuationToWord(word);
    }
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

  if (Auth.currentUser !== null) {
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

  if (Config.funbox === "memory") {
    Funbox.resetMemoryTimer();
    $("#wordsWrapper").addClass("hidden");
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

export function restart(
  withSameWordset = false,
  _?: boolean, // this is nosave and should be renamed to nosave when needed
  event?: JQuery.KeyDownEvent,
  practiseMissed = false,
  noAnim = false
): void {
  if (TestUI.testRestarting || TestUI.resultCalculating) {
    event?.preventDefault();
    return;
  }
  if (ActivePage.get() == "test" && !TestUI.resultVisible) {
    if (!ManualRestart.get()) {
      if (TestWords.hasTab) {
        if (!event?.shiftKey) return;
      }
      if (Config.mode !== "zen") event?.preventDefault();
      if (
        !Misc.canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText
        )
      ) {
        let message = "Use your mouse to confirm.";
        if (Config.quickTab) {
          message = "Press shift + tab or use your mouse to confirm.";
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
    if (Config.repeatQuotes === "typing" && Config.mode === "quote") {
      withSameWordset = true;
    }

    TestInput.pushKeypressesToHistory();
    const testSeconds = TestStats.calculateTestSeconds(performance.now());
    const afkseconds = TestStats.calculateAfkSeconds(testSeconds);
    // incompleteTestSeconds += ;
    let tt = testSeconds - afkseconds;
    if (tt < 0) tt = 0;
    console.log(
      `increasing incomplete time by ${tt}s (${testSeconds}s - ${afkseconds}s afk)`
    );
    TestStats.incrementIncompleteSeconds(tt);
    TestStats.incrementRestartCount();
    if (tt > 600) {
      Notifications.add(
        `Your time typing just increased by ${Misc.roundTo2(
          tt / 60
        )} minutes. If you think this is incorrect please contact Miodec and dont refresh the website.`,
        -1
      );
    }
    // restartCount++;
  }

  if (Config.mode == "zen") {
    $("#words").empty();
  }

  if (
    PractiseWords.before.mode !== null &&
    !withSameWordset &&
    !practiseMissed
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
  if (TestUI.resultVisible && Config.repeatedPace && withSameWordset) {
    repeatWithPace = true;
  }

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

  $("#showWordHistoryButton").removeClass("loaded");
  $("#restartTestButton").blur();
  Funbox.resetMemoryTimer();
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
  }
  TestUI.setResultVisible(false);
  PageTransition.set(true);
  TestUI.setTestRestarting(true);
  el.stop(true, true).animate(
    {
      opacity: 0,
    },
    noAnim ? 0 : 125,
    async () => {
      if (ActivePage.get() == "test") Focus.set(false);
      TestUI.focusWords();
      $("#monkey .fast").stop(true, true).css("opacity", 0);
      $("#monkey").stop(true, true).css({ animationDuration: "0s" });
      $("#typingTest").css("opacity", 0).removeClass("hidden");
      $("#wordsInput").val(" ");
      let shouldQuoteRepeat = false;
      if (
        Config.mode === "quote" &&
        Config.repeatQuotes === "typing" &&
        failReason !== ""
      ) {
        shouldQuoteRepeat = true;
      }

      await Funbox.rememberSettings();

      if (Config.funbox === "arrows") {
        UpdateConfig.setPunctuation(false, true);
        UpdateConfig.setNumbers(false, true);
      } else if (Config.funbox === "58008") {
        UpdateConfig.setNumbers(false, true);
      } else if (Config.funbox === "specials") {
        UpdateConfig.setPunctuation(false, true);
        UpdateConfig.setNumbers(false, true);
      } else if (Config.funbox === "ascii") {
        UpdateConfig.setPunctuation(false, true);
        UpdateConfig.setNumbers(false, true);
      }
      if (
        withSameWordset &&
        (Config.funbox === "plus_one" || Config.funbox === "plus_two")
      ) {
        const toPush = [];
        if (Config.funbox === "plus_one") {
          toPush.push(TestWords.words.get(0));
          toPush.push(TestWords.words.get(1));
        }
        if (Config.funbox === "plus_two") {
          toPush.push(TestWords.words.get(0));
          toPush.push(TestWords.words.get(1));
          toPush.push(TestWords.words.get(2));
        }
        TestWords.words.reset();
        toPush.forEach((word) => TestWords.words.push(word));
      }
      if (!withSameWordset && !shouldQuoteRepeat) {
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
          Keymap.highlightKey(
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

      if (Config.funbox === "memory") {
        Funbox.startMemoryTimer();
        if (Config.keymapMode === "next") {
          UpdateConfig.setKeymapMode("react");
        }
      }

      if (Config.showAverage !== "off") Last10Average.update();

      const mode2 = Misc.getMode2(Config, TestWords.randomQuote);
      let fbtext = "";
      if (Config.funbox !== "none") {
        fbtext = " " + Config.funbox;
      }
      $(".pageTest #premidTestMode").text(
        `${Config.mode} ${mode2} ${Config.language.replace(/_/g, " ")}${fbtext}`
      );
      $(".pageTest #premidSecondsLeft").text(Config.time);

      if (Config.funbox === "layoutfluid") {
        UpdateConfig.setLayout(
          Config.customLayoutfluid
            ? Config.customLayoutfluid.split("#")[0]
            : "qwerty",
          true
        );
        UpdateConfig.setKeymapLayout(
          Config.customLayoutfluid
            ? Config.customLayoutfluid.split("#")[0]
            : "qwerty",
          true
        );
        Keymap.highlightKey(
          TestWords.words
            .getCurrent()
            .substring(
              TestInput.input.current.length,
              TestInput.input.current.length + 1
            )
            .toString()
        );
      }

      $("#result").addClass("hidden");
      $("#testModesNotice").removeClass("hidden").css({
        opacity: 1,
      });
      // resetPaceCaret();
      ModesNotice.update();
      $("#typingTest")
        .css("opacity", 0)
        .removeClass("hidden")
        .stop(true, true)
        .animate(
          {
            opacity: 1,
          },
          noAnim ? 0 : 125,
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
            // console.log(TestStats.incompleteSeconds);
            // console.log(TestStats.restartCount);
          }
        );
    }
  );
}

function applyFunboxesToWord(word: string, wordset?: Wordset.Wordset): string {
  if (Config.funbox === "rAnDoMcAsE") {
    let randomcaseword = "";
    for (let i = 0; i < word.length; i++) {
      if (i % 2 != 0) {
        randomcaseword += word[i].toUpperCase();
      } else {
        randomcaseword += word[i];
      }
    }
    word = randomcaseword;
  } else if (Config.funbox === "capitals") {
    word = Misc.capitalizeFirstLetterOfEachWord(word);
  } else if (Config.funbox === "gibberish") {
    word = Misc.getGibberish();
  } else if (Config.funbox === "arrows") {
    word = Misc.getArrows();
  } else if (Config.funbox === "58008") {
    word = Misc.getNumbers(7);
  } else if (Config.funbox === "specials") {
    word = Misc.getSpecials();
  } else if (Config.funbox === "ascii") {
    word = Misc.getASCII();
  } else if (wordset !== undefined && Config.funbox === "weakspot") {
    word = WeakSpot.getWord(wordset);
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
  wordset: Wordset.Wordset,
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
        (!Config.punctuation && randomWord == "I"))
    ) {
      regenarationCount++;
      randomWord = wordset.randomWord();
    }
  }

  if (randomWord === undefined) {
    randomWord = wordset.randomWord();
  }

  randomWord = randomWord.replace(/ +/gm, " ");
  randomWord = randomWord.replace(/^ | $/gm, "");
  randomWord = applyLazyModeToWord(randomWord, language);
  randomWord = await applyBritishEnglishToWord(randomWord);
  randomWord = applyFunboxesToWord(randomWord, wordset);

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
    }
  }

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

  if (Config.quoteLength.includes(-3) && !Auth.currentUser) {
    UpdateConfig.setQuoteLength(-1);
  }

  let language = await Misc.getLanguage(Config.language);
  if (language && language.name !== Config.language) {
    UpdateConfig.setLanguage("english");
  }

  if (!language) {
    UpdateConfig.setLanguage("english");
    language = await Misc.getLanguage(Config.language);
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
  if (Config.showAllLines) {
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
  if (Config.funbox === "plus_one") {
    wordsBound = 2;
    if (Config.mode === "words" && Config.words < wordsBound) {
      wordsBound = Config.words;
    }
  }
  if (Config.funbox === "plus_two") {
    wordsBound = 3;
    if (Config.mode === "words" && Config.words < wordsBound) {
      wordsBound = Config.words;
    }
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
    const wordset = Wordset.withWords(wordList, Config.funbox);

    if (
      (Config.funbox == "wikipedia" || Config.funbox == "poetry") &&
      Config.mode != "custom"
    ) {
      let wordCount = 0;

      // If mode is words, get as many sections as you need until the wordCount is fullfilled
      while (
        (Config.mode == "words" && Config.words >= wordCount) ||
        (Config.mode === "time" && wordCount < 100)
      ) {
        const section =
          Config.funbox == "wikipedia"
            ? await Wikipedia.getSection(Config.language)
            : await Poetry.getPoem();

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
    } else {
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
    const quotesCollection = await QuotesController.getQuotes(
      Config.language,
      Config.quoteLength
    );

    if (quotesCollection.length === 0) {
      TestUI.setTestRestarting(false);
      Notifications.add(
        `No ${Config.language.replace(/_\d*k$/g, "")} quotes found`,
        0
      );
      if (Auth.currentUser) {
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

    if (Config.showAllLines) {
      wordsBound = w.length;
    } else {
      wordsBound = Math.min(wordsBound, w.length);
    }

    for (let i = 0; i < wordsBound; i++) {
      if (/\t/g.test(w[i])) {
        TestWords.setHasTab(true);
      }

      w[i] = applyLazyModeToWord(w[i], language);
      w[i] = await applyBritishEnglishToWord(w[i]);
      w[i] = applyFunboxesToWord(w[i]);

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
    Keymap.highlightKey(
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
  if (Config.funbox === "plus_one") bound = 1;
  if (Config.funbox === "plus_two") bound = 2;
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

  if (Config.funbox === "wikipedia" || Config.funbox == "poetry") {
    if (TestWords.words.length - TestWords.words.currentIndex < 20) {
      const section =
        Config.funbox == "wikipedia"
          ? await Wikipedia.getSection(Config.language)
          : await Poetry.getPoem();

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
    } else {
      return;
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
  const wordset = Wordset.withWords(language.words, Config.funbox);

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
  smoothConsistency: number;
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

  const response = await Ape.results.save(completedEvent);

  AccountButton.loading(false);
  Result.hideCrown();

  if (response.status !== 200) {
    retrySaving.canRetry = true;
    $("#retrySavingResultButton").removeClass("hidden");
    return Notifications.add("Result not saved. " + response.message, -1);
  }

  completedEvent._id = response.data.insertedId;
  if (response.data.isPb) {
    completedEvent.isPb = true;
  }

  DB.saveLocalResult(completedEvent);
  DB.updateLocalStats({
    time:
      completedEvent.testDuration +
      completedEvent.incompleteTestSeconds -
      completedEvent.afkDuration,
    started: TestStats.restartCount + 1,
  });

  AnalyticsController.log("testCompleted");

  if (response.data.isPb) {
    //new pb
    Result.showCrown();
    Result.updateCrown();
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

  $("#retrySavingResultButton").addClass("hidden");
  Notifications.add("Result saved", 1);
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
  const smoothedraw = Misc.smooth(rawPerSecond, 1);
  completedEvent.chartData.raw = smoothedraw;
  completedEvent.chartData.unsmoothedRaw = rawPerSecond;

  //smoothed consistency
  const stddev2 = Misc.stdDev(smoothedraw);
  const avg2 = Misc.mean(smoothedraw);
  const smoothConsistency = Misc.roundTo2(Misc.kogasa(stddev2 / avg2));
  completedEvent.smoothConsistency = smoothConsistency;

  //wpm consistency
  const stddev3 = Misc.stdDev(completedEvent.chartData.wpm ?? []);
  const avg3 = Misc.mean(completedEvent.chartData.wpm ?? []);
  const wpmConsistency = Misc.roundTo2(Misc.kogasa(stddev3 / avg3));
  completedEvent.wpmConsistency = wpmConsistency;

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
    DB.getSnapshot().tags?.forEach((tag) => {
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
    if (typeof input === "undefined") {
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

  if (countUndefined(completedEvent) > 0) {
    console.log(completedEvent);
    Notifications.add(
      "Failed to save result: One of the result fields is undefined. Please report this",
      -1
    );
    return;
  }

  ///////// completed event ready

  //afk check
  const kps = TestInput.keypressPerSecond.slice(-5);
  let afkDetected = kps.every((second) => second.afk);
  if (TestInput.bailout) afkDetected = false;

  let tooShort = false;
  let dontSave = false;
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
  } else if (completedEvent.acc < 75 || completedEvent.acc > 100) {
    Notifications.add("Test invalid - accuracy", 0);
    TestStats.setInvalid();
    dontSave = true;
  }

  // test is valid

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

  if (Auth.currentUser == null) {
    $(".pageTest #result #rateQuoteButton").addClass("hidden");
    $(".pageTest #result #reportQuoteButton").addClass("hidden");
    AnalyticsController.log("testCompletedNoLogin");
    if (!dontSave) notSignedInLastResult = completedEvent;
    dontSave = true;
  } else {
    $(".pageTest #result #reportQuoteButton").removeClass("hidden");
  }

  TestStats.setLastResult(completedEvent);

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

  completedEvent.uid = Auth.currentUser?.uid as string;
  Result.updateRateQuote(TestWords.randomQuote);

  AccountButton.loading(true);
  completedEvent.challenge = ChallengeContoller.verify(completedEvent);
  if (completedEvent.challenge === null) delete completedEvent?.challenge;

  completedEvent.hash = objectHash(completedEvent);

  const response = await Ape.results.save(completedEvent);

  AccountButton.loading(false);

  if (response.status !== 200) {
    console.log("Error saving result", completedEvent);
    $("#retrySavingResultButton").removeClass("hidden");
    if (response.message === "Incorrect result hash") {
      console.log(completedEvent);
    }
    retrySaving.completedEvent = completedEvent;
    retrySaving.canRetry = true;
    return Notifications.add("Failed to save result: " + response.message, -1);
  }

  Result.hideCrown();

  completedEvent._id = response.data.insertedId;
  if (response.data.isPb) {
    completedEvent.isPb = true;
  }

  DB.saveLocalResult(completedEvent);
  DB.updateLocalStats({
    time:
      completedEvent.testDuration +
      completedEvent.incompleteTestSeconds -
      completedEvent.afkDuration,
    started: TestStats.restartCount + 1,
  });

  AnalyticsController.log("testCompleted");

  if (response.data.isPb) {
    //new pb
    Result.showCrown();
    Result.updateCrown();
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

  $("#retrySavingResultButton").addClass("hidden");
}

export function fail(reason: string): void {
  failReason = reason;
  // input.pushHistory();
  // corrected.pushHistory();
  TestInput.pushKeypressesToHistory();
  finish(true);
  const testSeconds = TestStats.calculateTestSeconds(performance.now());
  const afkseconds = TestStats.calculateAfkSeconds(testSeconds);
  let tt = testSeconds - afkseconds;
  if (tt < 0) tt = 0;
  TestStats.incrementIncompleteSeconds(tt);
  TestStats.incrementRestartCount();
}

$(document).on("click", "#testModesNotice .text-button.restart", () => {
  restart();
});

$(document).on("keypress", "#restartTestButton", (event) => {
  if (event.key === "Enter") {
    restart();
  }
});

$(document.body).on("click", "#restartTestButton", () => {
  ManualRestart.set();
  if (TestUI.resultCalculating) return;
  if (
    TestActive.get() &&
    Config.repeatQuotes === "typing" &&
    Config.mode === "quote"
  ) {
    restart(true);
  } else {
    restart();
  }
});

$(document.body).on("click", "#retrySavingResultButton", retrySavingResult);

$(document).on("keypress", "#nextTestButton", (event) => {
  if (event.key === "Enter") {
    restart();
  }
});

$(document.body).on("click", "#nextTestButton", () => {
  ManualRestart.set();
  restart();
});

$(document.body).on("click", "#restartTestButtonWithSameWordset", () => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  ManualRestart.set();
  restart(true);
});

$(document).on("keypress", "#restartTestButtonWithSameWordset", (event) => {
  if (Config.mode == "zen") {
    Notifications.add("Repeat test disabled in zen mode");
    return;
  }
  if (event.key === "Enter") {
    restart(true);
  }
});

$(document).on("click", "#top .config .wordCount .text-button", (e) => {
  if (TestUI.testRestarting) return;
  const wrd = $(e.currentTarget).attr("wordCount") ?? "15";
  if (wrd != "custom") {
    UpdateConfig.setWordCount(parseInt(wrd));
    ManualRestart.set();
    restart();
  }
});

$(document).on("click", "#top .config .time .text-button", (e) => {
  if (TestUI.testRestarting) return;
  const mode = $(e.currentTarget).attr("timeConfig") ?? "10";
  if (mode != "custom") {
    UpdateConfig.setTimeConfig(parseInt(mode));
    ManualRestart.set();
    restart();
  }
});

$(document).on("click", "#top .config .quoteLength .text-button", (e) => {
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

$(document).on("click", "#top .config .punctuationMode .text-button", () => {
  if (TestUI.testRestarting) return;
  UpdateConfig.setPunctuation(!Config.punctuation);
  ManualRestart.set();
  restart();
});

$(document).on("click", "#top .config .numbersMode .text-button", () => {
  if (TestUI.testRestarting) return;
  UpdateConfig.setNumbers(!Config.numbers);
  ManualRestart.set();
  restart();
});

$(document).on("click", "#top .config .mode .text-button", (e) => {
  if (TestUI.testRestarting) return;
  if ($(e.currentTarget).hasClass("active")) return;
  const mode = ($(e.currentTarget).attr("mode") ?? "time") as MonkeyTypes.Mode;
  if (mode === undefined) return;
  UpdateConfig.setMode(mode);
  ManualRestart.set();
  restart();
});

$("#practiseWordsPopup .button.missed").on("click", () => {
  PractiseWords.hidePopup();
  PractiseWords.init(true, false);
  restart(false, false, undefined, true);
});

$("#practiseWordsPopup .button.slow").on("click", () => {
  PractiseWords.hidePopup();
  PractiseWords.init(false, true);
  restart(false, false, undefined, true);
});

$("#practiseWordsPopup .button.both").on("click", () => {
  PractiseWords.hidePopup();
  PractiseWords.init(true, true);
  restart(false, false, undefined, true);
});

$(document).on(
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

$(document).on("click", "#top #menu #startTestButton, #top .logo", () => {
  if (ActivePage.get() === "test") restart();
});

// ===============================

ConfigEvent.subscribe((eventKey, eventValue, nosave) => {
  if (ActivePage.get() === "test") {
    if (eventKey === "difficulty" && !nosave) restart(false, nosave);
    if (eventKey === "showAllLines" && !nosave) restart(false, nosave);
    if (eventKey === "keymapMode" && !nosave) restart(false, nosave);
    if (eventKey === "tapeMode" && !nosave) restart(false, nosave);
  }
  if (eventKey === "lazyMode" && eventValue === false && !nosave) {
    rememberLazyMode = false;
  }
});

TimerEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "fail" && eventValue !== undefined) fail(eventValue);
  if (eventKey === "finish") finish();
});
