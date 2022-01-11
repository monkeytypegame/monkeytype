import * as TestUI from "./test-ui";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Misc from "./misc";
import * as Notifications from "./notifications";
import * as CustomText from "./custom-text";
import * as TestStats from "./test-stats";
import * as PractiseWords from "./practise-words";
import * as ShiftTracker from "./shift-tracker";
import * as Focus from "./focus";
import * as Funbox from "./funbox";
import * as Keymap from "./keymap";
import * as ThemeController from "./theme-controller";
import * as PaceCaret from "./pace-caret";
import * as Caret from "./caret";
import * as LiveWpm from "./live-wpm";
import * as LiveAcc from "./live-acc";
import * as LiveBurst from "./live-burst";
import * as TimerProgress from "./timer-progress";
import * as UI from "./ui";
import * as QuoteSearchPopup from "./quote-search-popup";
import * as QuoteSubmitPopup from "./quote-submit-popup";
import * as PbCrown from "./pb-crown";
import * as TestTimer from "./test-timer";
import * as OutOfFocus from "./out-of-focus";
import * as AccountButton from "./account-button";
import * as DB from "./db";
import * as Replay from "./replay.js";
import axiosInstance from "./axios-instance";
import * as MonkeyPower from "./monkey-power";
import * as Poetry from "./poetry.js";
import * as Wikipedia from "./wikipedia.js";
import * as TodayTracker from "./today-tracker";
import * as WeakSpot from "./weak-spot";
import * as Wordset from "./wordset";
import * as ChallengeContoller from "./challenge-controller";
import * as RateQuotePopup from "./rate-quote-popup";
import * as BritishEnglish from "./british-english";
import * as LazyMode from "./lazy-mode";
import * as Result from "./result";

const objecthash = require("object-hash");

export let glarsesMode = false;

let failReason = "";

export function toggleGlarses() {
  glarsesMode = true;
  console.log(
    "Glarses Mode On - test result will be hidden. You can check the stats in the console (here)"
  );
  console.log("To disable Glarses Mode refresh the page.");
}

export let notSignedInLastResult = null;

export function clearNotSignedInResult() {
  notSignedInLastResult = null;
}

export function setNotSignedInUid(uid) {
  notSignedInLastResult.uid = uid;
  delete notSignedInLastResult.hash;
  notSignedInLastResult.hash = objecthash(notSignedInLastResult);
}

class Words {
  constructor() {
    this.list = [];
    this.length = 0;
    this.currentIndex = 0;
  }
  get(i) {
    if (i === undefined) {
      return this.list;
    } else {
      return this.list[i];
    }
  }
  getCurrent() {
    return this.list[this.currentIndex];
  }
  getLast() {
    return this.list[this.list.length - 1];
  }
  push(word) {
    this.list.push(word);
    this.length = this.list.length;
  }
  reset() {
    this.list = [];
    this.currentIndex = 0;
    this.length = this.list.length;
  }
  resetCurrentIndex() {
    this.currentIndex = 0;
  }
  decreaseCurrentIndex() {
    this.currentIndex--;
  }
  increaseCurrentIndex() {
    this.currentIndex++;
  }
  clean() {
    for (let s of this.list) {
      if (/ +/.test(s)) {
        let id = this.list.indexOf(s);
        let tempList = s.split(" ");
        this.list.splice(id, 1);
        for (let i = 0; i < tempList.length; i++) {
          this.list.splice(id + i, 0, tempList[i]);
        }
      }
    }
  }
}

class Input {
  constructor() {
    this.current = "";
    this.history = [];
    this.length = 0;
  }

  reset() {
    this.current = "";
    this.history = [];
    this.length = 0;
  }

  resetHistory() {
    this.history = [];
    this.length = 0;
  }

  setCurrent(val) {
    this.current = val;
    this.length = this.current.length;
  }

  appendCurrent(val) {
    this.current += val;
    this.length = this.current.length;
  }

  resetCurrent() {
    this.current = "";
  }

  getCurrent() {
    return this.current;
  }

  pushHistory() {
    this.history.push(this.current);
    this.historyLength = this.history.length;
    this.resetCurrent();
  }

  popHistory() {
    return this.history.pop();
  }

  getHistory(i) {
    if (i === undefined) {
      return this.history;
    } else {
      return this.history[i];
    }
  }
}

class Corrected {
  constructor() {
    this.current = "";
    this.history = [];
  }
  setCurrent(val) {
    this.current = val;
  }

  appendCurrent(val) {
    this.current += val;
  }

  resetCurrent() {
    this.current = "";
  }

  resetHistory() {
    this.history = [];
  }

  reset() {
    this.resetCurrent();
    this.resetHistory();
  }

  getHistory(i) {
    return this.history[i];
  }

  popHistory() {
    return this.history.pop();
  }

  pushHistory() {
    this.history.push(this.current);
    this.current = "";
  }
}

export let active = false;
export let words = new Words();
export let input = new Input();
export let corrected = new Corrected();
export let currentWordIndex = 0;
export let isRepeated = false;
export let isPaceRepeat = false;
export let lastTestWpm = 0;
export let hasTab = false;
export let randomQuote = null;
export let bailout = false;

export function setActive(tf) {
  active = tf;
  if (!tf) MonkeyPower.reset();
}

export function setRepeated(tf) {
  isRepeated = tf;
}

export function setPaceRepeat(tf) {
  isPaceRepeat = tf;
}

export function setHasTab(tf) {
  hasTab = tf;
}

export function setBailout(tf) {
  bailout = tf;
}

export function setRandomQuote(rq) {
  randomQuote = rq;
}

let spanishSentenceTracker = "";
export function punctuateWord(previousWord, currentWord, index, maxindex) {
  let word = currentWord;

  let currentLanguage = Config.language.split("_")[0];

  if (Config.funbox === "58008") {
    if (currentWord.length > 3) {
      if (Math.random() < 0.75) {
        let special = ["/", "*", "-", "+"][Math.floor(Math.random() * 4)];
        word = Misc.setCharAt(word, Math.floor(word.length / 2), special);
      }
    }
  } else {
    if (
      (index == 0 ||
        Misc.getLastChar(previousWord) == "." ||
        Misc.getLastChar(previousWord) == "?" ||
        Misc.getLastChar(previousWord) == "!") &&
      currentLanguage != "code"
    ) {
      //always capitalise the first word or if there was a dot unless using a code alphabet

      word = Misc.capitalizeFirstLetter(word);

      if (currentLanguage == "spanish" || currentLanguage == "catalan") {
        let rand = Math.random();
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
        Misc.getLastChar(previousWord) != "." &&
        Misc.getLastChar(previousWord) != "," &&
        index != maxindex - 2) ||
      index == maxindex - 1
    ) {
      if (currentLanguage == "spanish" || currentLanguage == "catalan") {
        if (spanishSentenceTracker == "?" || spanishSentenceTracker == "!") {
          word += spanishSentenceTracker;
          spanishSentenceTracker = "";
        }
      } else {
        let rand = Math.random();
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
      Misc.getLastChar(previousWord) != "," &&
      Misc.getLastChar(previousWord) != "." &&
      currentLanguage !== "russian"
    ) {
      word = `"${word}"`;
    } else if (
      Math.random() < 0.011 &&
      Misc.getLastChar(previousWord) != "," &&
      Misc.getLastChar(previousWord) != "." &&
      currentLanguage !== "russian" &&
      currentLanguage !== "ukrainian"
    ) {
      word = `'${word}'`;
    } else if (
      Math.random() < 0.012 &&
      Misc.getLastChar(previousWord) != "," &&
      Misc.getLastChar(previousWord) != "."
    ) {
      if (currentLanguage == "code") {
        let r = Math.random();
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
      Misc.getLastChar(previousWord) != "," &&
      Misc.getLastChar(previousWord) != "." &&
      Misc.getLastChar(previousWord) != ";" &&
      Misc.getLastChar(previousWord) != ":"
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
      Misc.getLastChar(previousWord) != "," &&
      Misc.getLastChar(previousWord) != "." &&
      previousWord != "-"
    ) {
      word = "-";
    } else if (
      Math.random() < 0.015 &&
      Misc.getLastChar(previousWord) != "," &&
      Misc.getLastChar(previousWord) != "." &&
      Misc.getLastChar(previousWord) != ";" &&
      Misc.getLastChar(previousWord) != ":"
    ) {
      if (currentLanguage == "french") {
        word = ";";
      } else if (currentLanguage == "greek") {
        word = "·";
      } else {
        word += ";";
      }
    } else if (Math.random() < 0.2 && Misc.getLastChar(previousWord) != ",") {
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
      let specials = ["{", "}", "[", "]", "(", ")", ";", "=", "+", "%", "/"];

      word = specials[Math.floor(Math.random() * 10)];
    }
  }
  return word;
}

export function startTest() {
  if (UI.pageTransition) {
    return false;
  }
  if (!Config.dbConfigLoaded) {
    UpdateConfig.setChangedBeforeDb(true);
  }
  try {
    if (firebase.auth().currentUser != null) {
      firebase.analytics().logEvent("testStarted");
    } else {
      firebase.analytics().logEvent("testStartedNoLogin");
    }
  } catch (e) {
    console.log("Analytics unavailable");
  }
  setActive(true);
  Replay.startReplayRecording();
  Replay.replayGetWordsList(words.list);
  TestStats.resetKeypressTimings();
  TimerProgress.restart();
  TimerProgress.show();
  $("#liveWpm").text("0");
  LiveWpm.show();
  LiveAcc.show();
  LiveBurst.show();
  TimerProgress.update(TestTimer.time);
  TestTimer.clear();

  if (Config.funbox === "memory") {
    Funbox.resetMemoryTimer();
    $("#wordsWrapper").addClass("hidden");
  }

  try {
    if (Config.paceCaret !== "off" || (Config.repeatedPace && isPaceRepeat))
      PaceCaret.start();
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  TestStats.setStart(performance.now());
  TestTimer.start();
  return true;
}

export function restart(
  withSameWordset = false,
  nosave = false,
  event,
  practiseMissed = false
) {
  if (TestUI.testRestarting || TestUI.resultCalculating) {
    try {
      event.preventDefault();
    } catch {}
    return;
  }
  if (UI.getActivePage() == "pageTest" && !TestUI.resultVisible) {
    if (!ManualRestart.get()) {
      if (hasTab) {
        try {
          if (!event.shiftKey) return;
        } catch {}
      }
      try {
        if (Config.mode !== "zen") event.preventDefault();
      } catch {}
      if (
        !Misc.canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText
        )
      ) {
        let message = "Use your mouse to confirm.";
        if (Config.quickTab)
          message = "Press shift + tab or use your mouse to confirm.";
        Notifications.add("Quick restart disabled. " + message, 0, 3);
        return;
      }
      // }else{
      //   return;
      // }
    }
  }
  if (active) {
    TestStats.pushKeypressesToHistory();
    let testSeconds = TestStats.calculateTestSeconds(performance.now());
    let afkseconds = TestStats.calculateAfkSeconds(testSeconds);
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
    UpdateConfig.setPunctuation(PractiseWords.before.punctuation);
    UpdateConfig.setNumbers(PractiseWords.before.numbers);
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
  corrected.reset();
  ShiftTracker.reset();
  Caret.hide();
  setActive(false);
  Replay.stopReplayRecording();
  LiveWpm.hide();
  LiveAcc.hide();
  LiveBurst.hide();
  TimerProgress.hide();
  Replay.pauseReplay();
  setBailout(false);
  PaceCaret.reset();
  $("#showWordHistoryButton").removeClass("loaded");
  $("#restartTestButton").blur();
  Funbox.resetMemoryTimer();
  RateQuotePopup.clearQuoteStats();
  if (UI.getActivePage() == "pageTest" && window.scrollY > 0)
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      !UI.pageTransition &&
      !Config.customTheme
    ) {
      ThemeController.randomizeTheme();
    }
  }
  TestUI.setResultVisible(false);
  UI.setPageTransition(true);
  TestUI.setTestRestarting(true);
  el.stop(true, true).animate(
    {
      opacity: 0,
    },
    125,
    async () => {
      Focus.set(false);
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
      if (!withSameWordset && !shouldQuoteRepeat) {
        setRepeated(false);
        setPaceRepeat(repeatWithPace);
        setHasTab(false);
        await init();
        PaceCaret.init(nosave);
      } else {
        setRepeated(true);
        setPaceRepeat(repeatWithPace);
        setActive(false);
        Replay.stopReplayRecording();
        words.resetCurrentIndex();
        input.reset();
        if (Config.funbox === "plus_one" || Config.funbox === "plus_two") {
          Notifications.add(
            "Sorry, this funbox won't work with repeated tests.",
            0
          );
          await Funbox.activate("none");
        } else {
          await Funbox.activate();
        }
        TestUI.showWords();
        PaceCaret.init();
      }
      failReason = "";
      if (Config.mode === "quote") {
        setRepeated(false);
      }
      if (Config.keymapMode !== "off") {
        Keymap.show();
      } else {
        Keymap.hide();
      }
      document.querySelector("#miniTimerAndLiveWpm .wpm").innerHTML = "0";
      document.querySelector("#miniTimerAndLiveWpm .acc").innerHTML = "100%";
      document.querySelector("#miniTimerAndLiveWpm .burst").innerHTML = "0";
      document.querySelector("#liveWpm").innerHTML = "0";
      document.querySelector("#liveAcc").innerHTML = "100%";
      document.querySelector("#liveBurst").innerHTML = "0";

      if (Config.funbox === "memory") {
        Funbox.startMemoryTimer();
        if (Config.keymapMode === "next") {
          UpdateConfig.setKeymapMode("react");
        }
      }

      let mode2 = "";
      if (Config.mode === "time") {
        mode2 = Config.time;
      } else if (Config.mode === "words") {
        mode2 = Config.words;
      } else if (Config.mode === "custom") {
        mode2 = "custom";
      } else if (Config.mode === "quote") {
        mode2 = randomQuote.id;
      }
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
          words
            .getCurrent()
            .substring(input.current.length, input.current.length + 1)
            .toString()
            .toUpperCase()
        );
      }

      $("#result").addClass("hidden");
      $("#testModesNotice").removeClass("hidden").css({
        opacity: 1,
      });
      // resetPaceCaret();
      $("#typingTest")
        .css("opacity", 0)
        .removeClass("hidden")
        .stop(true, true)
        .animate(
          {
            opacity: 1,
          },
          125,
          () => {
            TestUI.setTestRestarting(false);
            // resetPaceCaret();
            PbCrown.hide();
            TestTimer.clear();
            if ($("#commandLineWrapper").hasClass("hidden"))
              TestUI.focusWords();
            // ChartController.result.update();
            TestUI.updateModesNotice();
            UI.setPageTransition(false);
            // console.log(TestStats.incompleteSeconds);
            // console.log(TestStats.restartCount);
          }
        );
    }
  );
}

export async function init() {
  setActive(false);
  Replay.stopReplayRecording();
  words.reset();
  TestUI.setCurrentWordElementIndex(0);
  // accuracy = {
  //   correct: 0,
  //   incorrect: 0,
  // };

  input.resetHistory();
  input.resetCurrent();

  let language = await Misc.getLanguage(Config.language);
  if (language && language.name !== Config.language) {
    UpdateConfig.setLanguage("english");
  }

  if (!language) {
    UpdateConfig.setLanguage("english");
    language = await Misc.getLanguage(Config.language);
  }

  if (Config.lazyMode === true && language.noLazyMode) {
    Notifications.add("This language does not support lazy mode.", 0);
    UpdateConfig.setLazyMode(false);
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
    const wordset = Wordset.withWords(wordList);

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
        let section =
          Config.funbox == "wikipedia"
            ? await Wikipedia.getSection()
            : await Poetry.getPoem();
        for (let word of section.words) {
          if (wordCount >= Config.words && Config.mode == "words") {
            wordCount++;
            break;
          }
          wordCount++;
          words.push(word);
        }
      }
    } else {
      for (let i = 0; i < wordsBound; i++) {
        let randomWord = wordset.randomWord();
        const previousWord = words.get(i - 1);
        const previousWord2 = words.get(i - 2);
        if (
          Config.mode == "custom" &&
          !CustomText.isWordRandom &&
          !CustomText.isTimeRandom
        ) {
          randomWord = CustomText.text[i];
        } else if (
          Config.mode == "custom" &&
          (wordset.length < 3 || PractiseWords.before.mode !== null)
        ) {
          randomWord = wordset.randomWord();
        } else {
          let regenarationCount = 0; //infinite loop emergency stop button
          while (
            regenarationCount < 100 &&
            (randomWord == previousWord ||
              randomWord == previousWord2 ||
              (!Config.punctuation && randomWord == "I"))
          ) {
            regenarationCount++;
            randomWord = wordset.randomWord();
          }
        }

        if (randomWord === undefined) {
          randomWord = wordset.randomWord();
        }

        if (Config.lazyMode === true && !language.noLazyMode) {
          randomWord = LazyMode.replaceAccents(randomWord, language.accents);
        }

        randomWord = randomWord.replace(/ +/gm, " ");
        randomWord = randomWord.replace(/^ | $/gm, "");

        if (Config.funbox === "rAnDoMcAsE") {
          let randomcaseword = "";
          for (let i = 0; i < randomWord.length; i++) {
            if (i % 2 != 0) {
              randomcaseword += randomWord[i].toUpperCase();
            } else {
              randomcaseword += randomWord[i];
            }
          }
          randomWord = randomcaseword;
        } else if (Config.funbox === "arrows") {
          UpdateConfig.setPunctuation(false, true);
          UpdateConfig.setNumbers(false, true);
          randomWord = Misc.getArrows();
        } else if (Config.funbox === "gibberish") {
          randomWord = Misc.getGibberish();
        } else if (Config.funbox === "58008") {
          // UpdateConfig.setPunctuation(false, true);
          UpdateConfig.setNumbers(false, true);
          randomWord = Misc.getNumbers(7);
        } else if (Config.funbox === "specials") {
          UpdateConfig.setPunctuation(false, true);
          UpdateConfig.setNumbers(false, true);
          randomWord = Misc.getSpecials();
        } else if (Config.funbox === "ascii") {
          UpdateConfig.setPunctuation(false, true);
          UpdateConfig.setNumbers(false, true);
          randomWord = Misc.getASCII();
        } else if (Config.funbox === "weakspot") {
          randomWord = WeakSpot.getWord(wordset);
        }

        if (Config.punctuation) {
          randomWord = punctuateWord(previousWord, randomWord, i, wordsBound);
        }
        if (Config.numbers) {
          if (
            Math.random() < 0.1 &&
            i !== 0 &&
            Misc.getLastChar(previousWord) !== "."
          ) {
            randomWord = Misc.getNumbers(4);
            if (i == wordsBound - 1 && Config.punctuation) {
              randomWord += ".";
            }
          }
        }

        if (Config.britishEnglish && /english/.test(Config.language)) {
          randomWord = await BritishEnglish.replace(randomWord);
        }

        if (/\t/g.test(randomWord)) {
          setHasTab(true);
        }

        if (/ +/.test(randomWord)) {
          let randomList = randomWord.split(" ");
          let id = 0;
          while (id < randomList.length) {
            words.push(randomList[id]);
            id++;

            if (
              words.length == wordsBound &&
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
            i = words.length - 1;
          }
        } else {
          words.push(randomWord);
        }
      }
    }
  } else if (Config.mode == "quote") {
    // setLanguage(Config.language.replace(/_\d*k$/g, ""), true);

    let quotes = await Misc.getQuotes(Config.language.replace(/_\d*k$/g, ""));

    if (quotes.length === 0) {
      TestUI.setTestRestarting(false);
      Notifications.add(
        `No ${Config.language.replace(/_\d*k$/g, "")} quotes found`,
        0
      );
      if (firebase.auth().currentUser) {
        QuoteSubmitPopup.show(false);
      }
      UpdateConfig.setMode("words");
      restart();
      return;
    }

    let rq;
    if (Config.quoteLength != -2) {
      let quoteLengths = Config.quoteLength;
      let groupIndex;
      if (quoteLengths.length > 1) {
        groupIndex =
          quoteLengths[Math.floor(Math.random() * quoteLengths.length)];
        while (quotes.groups[groupIndex].length === 0) {
          groupIndex =
            quoteLengths[Math.floor(Math.random() * quoteLengths.length)];
        }
      } else {
        groupIndex = quoteLengths[0];
        if (quotes.groups[groupIndex].length === 0) {
          Notifications.add("No quotes found for selected quote length", 0);
          TestUI.setTestRestarting(false);
          return;
        }
      }

      rq =
        quotes.groups[groupIndex][
          Math.floor(Math.random() * quotes.groups[groupIndex].length)
        ];
      if (randomQuote != null && rq.id === randomQuote.id) {
        rq =
          quotes.groups[groupIndex][
            Math.floor(Math.random() * quotes.groups[groupIndex].length)
          ];
      }
    } else {
      quotes.groups.forEach((group) => {
        let filtered = group.filter(
          (quote) => quote.id == QuoteSearchPopup.selectedId
        );
        if (filtered.length > 0) {
          rq = filtered[0];
        }
      });
      if (rq == undefined) {
        rq = quotes.groups[0][0];
        Notifications.add("Quote Id Does Not Exist", 0);
      }
    }
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

    setRandomQuote(rq);

    let w = randomQuote.textSplit;

    wordsBound = Math.min(wordsBound, w.length);

    for (let i = 0; i < wordsBound; i++) {
      if (/\t/g.test(w[i])) {
        setHasTab(true);
      }
      if (
        Config.britishEnglish &&
        Config.language.replace(/_\d*k$/g, "") === "english"
      ) {
        w[i] = await BritishEnglish.replace(w[i]);
      }

      if (Config.lazyMode === true && !language.noLazyMode) {
        w[i] = LazyMode.replaceAccents(w[i], language.accents);
      }

      words.push(w[i]);
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
  if (UI.getActivePage() == "pageTest") {
    await Funbox.activate();
  }
  TestUI.showWords();
  // }
}

export function calculateWpmAndRaw() {
  let chars = 0;
  let correctWordChars = 0;
  let spaces = 0;
  //check input history
  for (let i = 0; i < input.history.length; i++) {
    let word = Config.mode == "zen" ? input.getHistory(i) : words.get(i);
    if (input.getHistory(i) == word) {
      //the word is correct
      //+1 for space
      correctWordChars += word.length;
      if (
        i < input.history.length - 1 &&
        Misc.getLastChar(input.getHistory(i)) !== "\n"
      ) {
        spaces++;
      }
    }
    chars += input.getHistory(i).length;
  }
  if (input.current !== "") {
    let word = Config.mode == "zen" ? input.current : words.getCurrent();
    //check whats currently typed
    let toAdd = {
      correct: 0,
      incorrect: 0,
      missed: 0,
    };
    for (let c = 0; c < word.length; c++) {
      if (c < input.current.length) {
        //on char that still has a word list pair
        if (input.current[c] == word[c]) {
          toAdd.correct++;
        } else {
          toAdd.incorrect++;
        }
      } else {
        //on char that is extra
        toAdd.missed++;
      }
    }
    chars += toAdd.correct;
    chars += toAdd.incorrect;
    chars += toAdd.missed;
    if (toAdd.incorrect == 0) {
      //word is correct so far, add chars
      correctWordChars += toAdd.correct;
    }
  }
  if (Config.funbox === "nospace" || Config.funbox === "arrows") {
    spaces = 0;
  }
  chars += input.current.length;
  let testSeconds = TestStats.calculateTestSeconds(performance.now());
  let wpm = Math.round(((correctWordChars + spaces) * (60 / testSeconds)) / 5);
  let raw = Math.round(((chars + spaces) * (60 / testSeconds)) / 5);
  return {
    wpm: wpm,
    raw: raw,
  };
}

export async function addWord() {
  let bound = 100;
  if (Config.funbox === "wikipedia" || Config.funbox == "poetry") {
    if (Config.mode == "time" && words.length - words.currentIndex < 20) {
      let section =
        Config.funbox == "wikipedia"
          ? await Wikipedia.getSection()
          : await Poetry.getPoem();
      let wordCount = 0;
      for (let word of section.words) {
        if (wordCount >= Config.words && Config.mode == "words") {
          break;
        }
        wordCount++;
        words.push(word);
        TestUI.addWord(word);
      }
    } else {
      return;
    }
  }

  if (Config.funbox === "plus_one") bound = 1;
  if (Config.funbox === "plus_two") bound = 2;
  if (
    words.length - input.history.length > bound ||
    (Config.mode === "words" &&
      words.length >= Config.words &&
      Config.words > 0) ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      words.length >= CustomText.word &&
      CustomText.word != 0) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      words.length >= CustomText.text.length) ||
    (Config.mode === "quote" && words.length >= randomQuote.textSplit.length)
  )
    return;
  const language =
    Config.mode !== "custom"
      ? await Misc.getCurrentLanguage()
      : {
          //borrow the direction of the current language
          leftToRight: await Misc.getCurrentLanguage().leftToRight,
          words: CustomText.text,
        };
  const wordset = Wordset.withWords(language.words);
  let randomWord = wordset.randomWord();
  const previousWord = words.getLast();
  const previousWordStripped = previousWord
    .replace(/[.?!":\-,]/g, "")
    .toLowerCase();
  const previousWord2Stripped = words
    .get(words.length - 2)
    .replace(/[.?!":\-,]/g, "")
    .toLowerCase();

  if (
    Config.mode === "custom" &&
    (CustomText.isWordRandom || CustomText.isTimeRandom) &&
    wordset.length < 3
  ) {
    randomWord = wordset.randomWord();
  } else if (
    Config.mode == "custom" &&
    !CustomText.isWordRandom &&
    !CustomText.isTimeRandom
  ) {
    randomWord = CustomText.text[words.length];
  } else if (Config.mode === "quote") {
    randomWord = randomQuote.textSplit[words.length];
  } else {
    let regenarationCount = 0; //infinite loop emergency stop button
    while (
      regenarationCount < 100 &&
      (previousWordStripped == randomWord ||
        previousWord2Stripped == randomWord ||
        randomWord.indexOf(" ") > -1 ||
        (!Config.punctuation && randomWord == "I"))
    ) {
      regenarationCount++;
      randomWord = wordset.randomWord();
    }
  }

  if (randomWord === undefined) {
    randomWord = wordset.randomWord();
  }

  if (Config.lazyMode === true && !language.noLazyMode) {
    randomWord = LazyMode.replaceAccents(randomWord, language.accents);
  }

  if (Config.funbox === "rAnDoMcAsE") {
    let randomcaseword = "";
    for (let i = 0; i < randomWord.length; i++) {
      if (i % 2 != 0) {
        randomcaseword += randomWord[i].toUpperCase();
      } else {
        randomcaseword += randomWord[i];
      }
    }
    randomWord = randomcaseword;
  } else if (Config.funbox === "gibberish") {
    randomWord = Misc.getGibberish();
  } else if (Config.funbox === "arrows") {
    randomWord = Misc.getArrows();
  } else if (Config.funbox === "58008") {
    randomWord = Misc.getNumbers(7);
  } else if (Config.funbox === "specials") {
    randomWord = Misc.getSpecials();
  } else if (Config.funbox === "ascii") {
    randomWord = Misc.getASCII();
  } else if (Config.funbox === "weakspot") {
    randomWord = WeakSpot.getWord(wordset);
  }

  if (Config.punctuation) {
    randomWord = punctuateWord(previousWord, randomWord, words.length, 0);
  }
  if (Config.numbers) {
    if (Math.random() < 0.1) {
      randomWord = Misc.getNumbers(4);
    }
  }

  if (
    Config.britishEnglish &&
    Config.language.replace(/_\d*k$/g, "") === "english"
  ) {
    randomWord = await BritishEnglish.replace(randomWord);
  }

  let split = randomWord.split(" ");
  if (split.length > 1) {
    split.forEach((word) => {
      words.push(word);
      TestUI.addWord(word);
    });
  } else {
    words.push(randomWord);
    TestUI.addWord(randomWord);
  }
}

var retrySaving = {
  completedEvent: null,
  canRetry: false,
};

export function retrySavingResult() {
  if (!retrySaving.completedEvent) {
    Notifications.add(
      "Could not retry saving the result as the result no longer exists.",
      0,
      -1
    );
  }
  if (!retrySaving.canRetry) {
    return;
  }

  retrySaving.canRetry = false;
  $("#retrySavingResultButton").addClass("hidden");

  AccountButton.loading(true);

  Notifications.add("Retrying to save...");

  var { completedEvent } = retrySaving;

  axiosInstance
    .post("/results/add", {
      result: completedEvent,
    })
    .then((response) => {
      AccountButton.loading(false);
      Result.hideCrown();

      if (response.status !== 200) {
        Notifications.add("Result not saved. " + response.data.message, -1);
      } else {
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

        try {
          firebase.analytics().logEvent("testCompleted", completedEvent);
        } catch (e) {
          console.log("Analytics unavailable");
        }

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
            completedEvent.wpmRaw,
            completedEvent.consistency
          );
        }
      }

      $("#retrySavingResultButton").addClass("hidden");
      Notifications.add("Result saved", 1);
    })
    .catch((e) => {
      AccountButton.loading(false);
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to save result: " + msg, -1);
      $("#retrySavingResultButton").removeClass("hidden");
      retrySaving.canRetry = true;
    });
}

function buildCompletedEvent(difficultyFailed) {
  //build completed event object
  let completedEvent = {
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
    keySpacing: TestStats.keypressTimings.spacing.array,
    keyDuration: TestStats.keypressTimings.duration.array,
    consistency: undefined,
    keyConsistency: undefined,
    funbox: Config.funbox,
    bailedOut: bailout,
    chartData: {
      wpm: TestStats.wpmHistory,
      raw: undefined,
      err: undefined,
    },
    customText: undefined,
    testDuration: undefined,
    afkDuration: undefined,
  };

  // stats
  let stats = TestStats.calculateStats();
  if (stats.time % 1 != 0 && Config.mode !== "time") {
    TestStats.setLastSecondNotRound();
  }
  lastTestWpm = stats.wpm;
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
    let wpmAndRaw = calculateWpmAndRaw();
    TestStats.pushToWpmHistory(wpmAndRaw.wpm);
    TestStats.pushToRawHistory(wpmAndRaw.raw);
    TestStats.pushKeypressesToHistory();
  }

  //consistency
  let rawPerSecond = TestStats.keypressPerSecond.map((f) =>
    Math.round((f.count / 5) * 60)
  );
  let stddev = Misc.stdDev(rawPerSecond);
  let avg = Misc.mean(rawPerSecond);
  let consistency = Misc.roundTo2(Misc.kogasa(stddev / avg));
  let keyconsistencyarray = TestStats.keypressTimings.spacing.array.slice();
  keyconsistencyarray = keyconsistencyarray.splice(
    0,
    keyconsistencyarray.length - 1
  );
  let keyConsistency = Misc.roundTo2(
    Misc.kogasa(
      Misc.stdDev(keyconsistencyarray) / Misc.mean(keyconsistencyarray)
    )
  );
  if (isNaN(consistency)) {
    consistency = 0;
  }
  completedEvent.keyConsistency = keyConsistency;
  completedEvent.consistency = consistency;
  let smoothedraw = Misc.smooth(rawPerSecond, 1);
  completedEvent.chartData.raw = smoothedraw;

  //smoothed consistency
  let stddev2 = Misc.stdDev(smoothedraw);
  let avg2 = Misc.mean(smoothedraw);
  let smoothConsistency = Misc.roundTo2(Misc.kogasa(stddev2 / avg2));
  completedEvent.smoothConsistency = smoothConsistency;

  //wpm consistency
  let stddev3 = Misc.stdDev(completedEvent.chartData.wpm);
  let avg3 = Misc.mean(completedEvent.chartData.wpm);
  let wpmConsistency = Misc.roundTo2(Misc.kogasa(stddev3 / avg3));
  completedEvent.wpmConsistency = wpmConsistency;

  completedEvent.testDuration = parseFloat(stats.time);
  completedEvent.afkDuration = TestStats.calculateAfkSeconds(
    completedEvent.testDuration
  );

  completedEvent.chartData.err = [];
  for (let i = 0; i < TestStats.keypressPerSecond.length; i++) {
    completedEvent.chartData.err.push(TestStats.keypressPerSecond[i].errors);
  }

  if (Config.mode === "quote") {
    completedEvent.quoteLength = randomQuote.group;
    completedEvent.lang = Config.language.replace(/_\d*k$/g, "");
  }

  if (Config.mode === "time") {
    completedEvent.mode2 = Config.time;
  } else if (Config.mode === "words") {
    completedEvent.mode2 = Config.words;
  } else if (Config.mode === "custom") {
    completedEvent.mode2 = "custom";
  } else if (Config.mode === "quote") {
    completedEvent.mode2 = randomQuote.id;
  } else if (Config.mode === "zen") {
    completedEvent.mode2 = "zen";
  }

  if (completedEvent.testDuration > 122) {
    completedEvent.chartData = "toolong";
    TestStats.setKeypressTimingsTooLong();
  }

  if (Config.mode === "custom") {
    completedEvent.customText = {};
    completedEvent.customText.textLen = CustomText.text.length;
    completedEvent.customText.isWordRandom = CustomText.isWordRandom;
    completedEvent.customText.isTimeRandom = CustomText.isTimeRandom;
    completedEvent.customText.word =
      CustomText.word !== "" && !isNaN(CustomText.word)
        ? CustomText.word
        : null;
    completedEvent.customText.time =
      CustomText.time !== "" && !isNaN(CustomText.time)
        ? CustomText.time
        : null;
  } else {
    delete completedEvent.customText;
  }

  //tags
  let activeTagsIds = [];
  try {
    DB.getSnapshot().tags.forEach((tag) => {
      if (tag.active === true) {
        activeTagsIds.push(tag._id);
      }
    });
  } catch (e) {}
  completedEvent.tags = activeTagsIds;

  if (completedEvent.mode != "custom") delete completedEvent.customText;

  return completedEvent;
}

export async function finish(difficultyFailed = false) {
  if (!active) return;
  if (Config.mode == "zen" && input.current.length != 0) {
    input.pushHistory();
    corrected.pushHistory();
    Replay.replayGetWordsList(input.history);
  }

  TestStats.recordKeypressSpacing(); //this is needed in case there is afk time at the end - to make sure test duration makes sense

  TestUI.setResultCalculating(true);
  TestUI.setResultVisible(true);
  TestStats.setEnd(performance.now());
  setActive(false);
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
  Funbox.activate("none", null);

  //need one more calculation for the last word if test auto ended
  if (TestStats.burstHistory.length !== input.getHistory().length) {
    let burst = TestStats.calculateBurst();
    TestStats.pushBurstToHistory(burst);
  }

  //remove afk from zen
  if (Config.mode == "zen" || bailout) {
    TestStats.removeAfkData();
  }

  const completedEvent = buildCompletedEvent(difficultyFailed);

  //todo check if any fields are undefined

  ///////// completed event ready

  //afk check
  let kps = TestStats.keypressPerSecond.slice(-5);
  let afkDetected = kps.every((second) => second.afk);
  if (bailout) afkDetected = false;

  let tooShort = false;
  let dontSave = false;
  //fail checks
  if (difficultyFailed) {
    Notifications.add(`Test failed - ${failReason}`, 0, 1);
    dontSave = true;
  } else if (afkDetected) {
    Notifications.add("Test invalid - AFK detected", 0);
    dontSave = true;
  } else if (isRepeated) {
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
  }
  if (
    completedEvent.wpm < 0 ||
    completedEvent.wpm > 350 ||
    completedEvent.acc < 75 ||
    completedEvent.acc > 100
  ) {
    Notifications.add("Test invalid", 0);
    TestStats.setInvalid();
    try {
      firebase.analytics().logEvent("testCompletedInvalid", completedEvent);
    } catch (e) {
      console.log("Analytics unavailable");
    }
    dontSave = true;
  }

  // test is valid

  TodayTracker.addSeconds(
    completedEvent.testDuration +
      (TestStats.incompleteSeconds < 0
        ? 0
        : Misc.roundTo2(TestStats.incompleteSeconds)) -
      completedEvent.afkDuration
  );
  Result.updateTodayTracker();

  if (firebase.auth().currentUser == null) {
    $(".pageTest #result #rateQuoteButton").addClass("hidden");
    try {
      firebase.analytics().logEvent("testCompletedNoLogin", completedEvent);
    } catch (e) {
      console.log("Analytics unavailable");
    }
    notSignedInLastResult = completedEvent;
    dontSave = true;
  }

  Result.update(
    completedEvent,
    difficultyFailed,
    failReason,
    afkDetected,
    isRepeated,
    tooShort,
    randomQuote
  );

  if (dontSave) return;

  // user is logged in

  if (
    Config.difficulty == "normal" ||
    ((Config.difficulty == "master" || Config.difficulty == "expert") &&
      !difficultyFailed)
  ) {
    TestStats.resetIncomplete();
  }

  completedEvent.uid = firebase.auth().currentUser.uid;
  Result.updateRateQuote(randomQuote);

  Result.updateGraphPBLine();

  AccountButton.loading(true);
  completedEvent.challenge = ChallengeContoller.verify(completedEvent);
  if (!completedEvent.challenge) delete completedEvent.challenge;
  completedEvent.hash = objecthash(completedEvent);
  axiosInstance
    .post("/results/add", {
      result: completedEvent,
    })
    .then((response) => {
      AccountButton.loading(false);
      Result.hideCrown();

      if (response.status !== 200) {
        Notifications.add("Result not saved. " + response.data.message, -1);
      } else {
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

        try {
          firebase.analytics().logEvent("testCompleted", completedEvent);
        } catch (e) {
          console.log("Analytics unavailable");
        }

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
            completedEvent.wpmRaw,
            completedEvent.consistency
          );
        }
      }

      $("#retrySavingResultButton").addClass("hidden");
    })
    .catch((e) => {
      AccountButton.loading(false);
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to save result: " + msg, -1);
      $("#retrySavingResultButton").removeClass("hidden");

      retrySaving.completedEvent = completedEvent;
      retrySaving.canRetry = true;
    });
}

export function fail(reason) {
  failReason = reason;
  // input.pushHistory();
  // corrected.pushHistory();
  TestStats.pushKeypressesToHistory();
  finish(true);
  let testSeconds = TestStats.calculateTestSeconds(performance.now());
  let afkseconds = TestStats.calculateAfkSeconds(testSeconds);
  let tt = testSeconds - afkseconds;
  if (tt < 0) tt = 0;
  TestStats.incrementIncompleteSeconds(tt);
  TestStats.incrementRestartCount();
}
