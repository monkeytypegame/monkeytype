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
import * as ChartController from "./chart-controller";
import * as UI from "./ui";
import * as QuoteSearchPopup from "./quote-search-popup";
import * as PbCrown from "./pb-crown";
import * as TestTimer from "./test-timer";
import * as OutOfFocus from "./out-of-focus";
import * as AccountButton from "./account-button";
import * as DB from "./db";
import * as ThemeColors from "./theme-colors";
import * as Replay from "./replay.js";
import axiosInstance from "./axios-instance";
import * as MonkeyPower from "./monkey-power";
import * as Poetry from "./poetry.js";
import * as TodayTracker from "./today-tracker";
import * as WeakSpot from "./weak-spot";
import * as Wordset from "./wordset";
import * as ChallengeContoller from "./challenge-controller";
import * as RateQuotePopup from "./rate-quote-popup";
import * as BritishEnglish from "./british-english";
import * as LazyMode from "./lazy-mode";

const objecthash = require("object-hash");

let glarsesMode = false;

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
  }

  reset() {
    this.current = "";
    this.history = [];
  }

  resetHistory() {
    this.history = [];
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
    if (
      Config.mode == "custom" &&
      CustomText.isTimeRandom &&
      CustomText.time < wordsBound
    ) {
      wordsBound = 100;
    }
    if (
      Config.mode == "custom" &&
      !CustomText.isWordRandom &&
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
  }
  if (Config.funbox === "plus_two") {
    wordsBound = 3;
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

    if (Config.funbox == "poetry") {
      let poem = await Poetry.getPoem();
      poem.words.forEach((word) => {
        words.push(word);
      });
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

        if (Config.britishEnglish && /english/.test(Config.language)) {
          let britishWord = await BritishEnglish.replace(randomWord);
          if (britishWord) randomWord = britishWord;
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
            if (i == wordsBound - 1) {
              randomWord += ".";
            }
          }
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
      Notifications.add(
        `No ${Config.language.replace(/_\d*k$/g, "")} quotes found`,
        0
      );
      TestUI.setTestRestarting(false);
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
        let britishWord = await BritishEnglish.replace(w[i]);
        if (britishWord) w[i] = britishWord;
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
  if ($(".pageTest").hasClass("active")) {
    await Funbox.activate();
  }
  TestUI.showWords();
  // }
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
  if ($(".pageTest").hasClass("active") && !TestUI.resultVisible) {
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
    UpdateConfig.setMode(PractiseWords.before.mode);
    UpdateConfig.setPunctuation(PractiseWords.before.punctuation);
    UpdateConfig.setNumbers(PractiseWords.before.numbers);
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
  TestUI.focusWords();
  Funbox.resetMemoryTimer();
  RateQuotePopup.clearQuoteStats();
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
      $("#monkey .fast").stop(true, true).css("opacity", 0);
      $("#monkey").stop(true, true).css({ animationDuration: "0s" });
      $("#typingTest").css("opacity", 0).removeClass("hidden");
      $("#wordsInput").val(" ");
      if (!withSameWordset) {
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
      Focus.set(false);
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

export function calculateWpmAndRaw() {
  let chars = 0;
  let correctWordChars = 0;
  let spaces = 0;
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
  if (words.getCurrent() == input.current) {
    correctWordChars += input.current.length;
  }
  if (Config.funbox === "nospace") {
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
      (
      previousWordStripped == randomWord ||
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

  if (
    Config.britishEnglish &&
    Config.language.replace(/_\d*k$/g, "") === "english"
  ) {
    let britishWord = await BritishEnglish.replace(randomWord);
    if (britishWord) randomWord = britishWord;
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

  words.push(randomWord);
  TestUI.addWord(randomWord);
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
  Funbox.activate("none", null);
  $("#wordsInput").blur();

  let stats = TestStats.calculateStats();

  if (TestStats.burstHistory.length !== input.getHistory().length) {
    //auto ended test, need one more calculation for the last word
    let burst = TestStats.calculateBurst();
    TestStats.pushBurstToHistory(burst);
  }

  if (stats.time % 1 != 0 && Config.mode !== "time") {
    TestStats.setLastSecondNotRound();
  }

  if (Config.mode == "zen" || bailout) {
    TestStats.removeAfkData();
  }
  if (stats === undefined) {
    stats = {
      wpm: 0,
      wpmRaw: 0,
      acc: 0,
      correctChars: 0,
      incorrectChars: 0,
      missedChars: 0,
      extraChars: 0,
      time: 0,
      spaces: 0,
      correctSpaces: 0,
    };
  }
  let inf = false;
  if (stats.wpm >= 1000) {
    inf = true;
  }
  TestTimer.clear();

  lastTestWpm = stats.wpm;

  let testtime = parseFloat(stats.time);

  if (TestStats.lastSecondNotRound && !difficultyFailed) {
    let wpmAndRaw = calculateWpmAndRaw();
    TestStats.pushToWpmHistory(wpmAndRaw.wpm);
    TestStats.pushToRawHistory(wpmAndRaw.raw);
    TestStats.pushKeypressesToHistory();
    // errorsPerSecond.push(currentError);
    // currentError = {
    //   count: 0,
    //   words: [],
    // };
  }

  let afkseconds = TestStats.calculateAfkSeconds(testtime);
  let afkSecondsPercent = Misc.roundTo2((afkseconds / testtime) * 100);

  ChartController.result.options.annotation.annotations = [];

  $("#result #resultWordsHistory").addClass("hidden");

  if (Config.alwaysShowDecimalPlaces) {
    if (Config.alwaysShowCPM == false) {
      $("#result .stats .wpm .top .text").text("wpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(
          Misc.roundTo2(stats.wpm).toFixed(2)
        );
      }
      $("#result .stats .raw .bottom").text(
        Misc.roundTo2(stats.wpmRaw).toFixed(2)
      );
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm * 5).toFixed(2) + " cpm"
      );
    } else {
      $("#result .stats .wpm .top .text").text("cpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(
          Misc.roundTo2(stats.wpm * 5).toFixed(2)
        );
      }
      $("#result .stats .raw .bottom").text(
        Misc.roundTo2(stats.wpmRaw * 5).toFixed(2)
      );
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm).toFixed(2) + " wpm"
      );
    }

    $("#result .stats .acc .bottom").text(
      stats.acc == 100 ? "100%" : Misc.roundTo2(stats.acc).toFixed(2) + "%"
    );
    let time = Misc.roundTo2(testtime).toFixed(2) + "s";
    if (testtime > 61) {
      time = Misc.secondsToString(Misc.roundTo2(testtime));
    }
    $("#result .stats .time .bottom .text").text(time);
    $("#result .stats .raw .bottom").removeAttr("aria-label");
    $("#result .stats .acc .bottom").removeAttr("aria-label");
    $("#result .stats .time .bottom").attr(
      "aria-label",
      `${afkseconds}s afk ${afkSecondsPercent}%`
    );
  } else {
    //not showing decimal places
    if (Config.alwaysShowCPM == false) {
      $("#result .stats .wpm .top .text").text("wpm");
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        stats.wpm + ` (${Misc.roundTo2(stats.wpm * 5)} cpm)`
      );
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Math.round(stats.wpm));
      }
      $("#result .stats .raw .bottom").text(Math.round(stats.wpmRaw));
      $("#result .stats .raw .bottom").attr("aria-label", stats.wpmRaw);
    } else {
      $("#result .stats .wpm .top .text").text("cpm");
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm * 5) + ` (${Misc.roundTo2(stats.wpm)} wpm)`
      );
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Math.round(stats.wpm * 5));
      }
      $("#result .stats .raw .bottom").text(Math.round(stats.wpmRaw * 5));
      $("#result .stats .raw .bottom").attr("aria-label", stats.wpmRaw * 5);
    }

    $("#result .stats .acc .bottom").text(Math.floor(stats.acc) + "%");
    $("#result .stats .acc .bottom").attr("aria-label", stats.acc + "%");
    let time = Math.round(testtime) + "s";
    if (testtime > 61) {
      time = Misc.secondsToString(Math.round(testtime));
    }
    $("#result .stats .time .bottom .text").text(time);
    $("#result .stats .time .bottom").attr(
      "aria-label",
      `${Misc.roundTo2(testtime)}s (${afkseconds}s afk ${afkSecondsPercent}%)`
    );
  }
  $("#result .stats .time .bottom .afk").text("");
  if (afkSecondsPercent > 0) {
    $("#result .stats .time .bottom .afk").text(afkSecondsPercent + "% afk");
  }
  if (!difficultyFailed) {
    TodayTracker.addSeconds(
      testtime +
        (TestStats.incompleteSeconds < 0
          ? 0
          : Misc.roundTo2(TestStats.incompleteSeconds)) -
        afkseconds
    );
  }
  $("#result .stats .time .bottom .timeToday").text(TodayTracker.getString());
  $("#result .stats .key .bottom").text(testtime + "s");
  $("#words").removeClass("blurred");
  OutOfFocus.hide();
  $("#result .stats .key .bottom").text(
    stats.correctChars +
      stats.correctSpaces +
      "/" +
      stats.incorrectChars +
      "/" +
      stats.extraChars +
      "/" +
      stats.missedChars
  );

  setTimeout(function () {
    $("#resultExtraButtons").removeClass("hidden").css("opacity", 0).animate(
      {
        opacity: 1,
      },
      125
    );
  }, 125);

  $("#testModesNotice").css("opacity", 0);
  $("#result .stats .leaderboards .bottom").text("");
  $("#result .stats .leaderboards").addClass("hidden");

  let mode2 = "";
  if (Config.mode === "time") {
    mode2 = Config.time;
  } else if (Config.mode === "words") {
    mode2 = Config.words;
  } else if (Config.mode === "custom") {
    mode2 = "custom";
  } else if (Config.mode === "quote") {
    mode2 = randomQuote.id;
  } else if (Config.mode === "zen") {
    mode2 = "zen";
  }

  let labels = [];
  for (let i = 1; i <= TestStats.wpmHistory.length; i++) {
    if (TestStats.lastSecondNotRound && i === TestStats.wpmHistory.length) {
      labels.push(Misc.roundTo2(testtime).toString());
    } else {
      labels.push(i.toString());
    }
  }

  ChartController.result.updateColors();

  ChartController.result.data.labels = labels;

  let rawWpmPerSecondRaw = TestStats.keypressPerSecond.map((f) =>
    Math.round((f.count / 5) * 60)
  );

  let rawWpmPerSecond = Misc.smooth(rawWpmPerSecondRaw, 1);

  let stddev = Misc.stdDev(rawWpmPerSecondRaw);
  let avg = Misc.mean(rawWpmPerSecondRaw);

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

  if (Config.alwaysShowDecimalPlaces) {
    $("#result .stats .consistency .bottom").text(
      Misc.roundTo2(consistency).toFixed(2) + "%"
    );
    $("#result .stats .consistency .bottom").attr(
      "aria-label",
      `${keyConsistency.toFixed(2)}% key`
    );
  } else {
    $("#result .stats .consistency .bottom").text(
      Math.round(consistency) + "%"
    );
    $("#result .stats .consistency .bottom").attr(
      "aria-label",
      `${consistency}% (${keyConsistency}% key)`
    );
  }

  ChartController.result.options.scales.yAxes[0].scaleLabel.labelString = Config.alwaysShowCPM
    ? "Character per Minute"
    : "Words per Minute";
  let chartData1 = Config.alwaysShowCPM
    ? TestStats.wpmHistory.map((a) => a * 5)
    : TestStats.wpmHistory;
  let chartData2 = Config.alwaysShowCPM
    ? rawWpmPerSecond.map((a) => a * 5)
    : rawWpmPerSecond;

  ChartController.result.data.datasets[0].data = chartData1;
  ChartController.result.data.datasets[1].data = chartData2;

  let maxChartVal = Math.max(
    ...[Math.max(...chartData2), Math.max(...chartData1)]
  );
  if (!Config.startGraphsAtZero) {
    ChartController.result.options.scales.yAxes[0].ticks.min = Math.min(
      ...chartData1
    );
    ChartController.result.options.scales.yAxes[1].ticks.min = Math.min(
      ...chartData1
    );
  } else {
    ChartController.result.options.scales.yAxes[0].ticks.min = 0;
    ChartController.result.options.scales.yAxes[1].ticks.min = 0;
  }

  // let errorsNoZero = [];

  // for (let i = 0; i < errorsPerSecond.length; i++) {
  //   errorsNoZero.push({
  //     x: i + 1,
  //     y: errorsPerSecond[i].count,
  //   });
  // }

  let errorsArray = [];
  for (let i = 0; i < TestStats.keypressPerSecond.length; i++) {
    errorsArray.push(TestStats.keypressPerSecond[i].errors);
  }

  ChartController.result.data.datasets[2].data = errorsArray;

  let kps = TestStats.keypressPerSecond.slice(-5);

  let afkDetected = kps.every((second) => second.afk);

  if (bailout) afkDetected = false;

  $("#result .stats .tags").addClass("hidden");

  let lang = Config.language;

  let quoteLength = -1;
  if (Config.mode === "quote") {
    quoteLength = randomQuote.group;
    lang = Config.language.replace(/_\d*k$/g, "");
  }

  $(".pageTest #result #rateQuoteButton .icon")
    .removeClass("fas")
    .addClass("far");
  $(".pageTest #result #rateQuoteButton .rating").text("");
  $(".pageTest #result #rateQuoteButton").addClass("hidden");

  if (difficultyFailed) {
    Notifications.add(`Test failed - ${failReason}`, 0, 1);
  } else if (afkDetected) {
    Notifications.add("Test invalid - AFK detected", 0);
  } else if (isRepeated) {
    Notifications.add("Test invalid - repeated", 0);
  } else if (
    (Config.mode === "time" && mode2 < 15 && mode2 > 0) ||
    (Config.mode === "time" && mode2 == 0 && testtime < 15) ||
    (Config.mode === "words" && mode2 < 10 && mode2 > 0) ||
    (Config.mode === "words" && mode2 == 0 && testtime < 15) ||
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
    (Config.mode === "zen" && testtime < 15)
  ) {
    Notifications.add("Test too short", 0);
  } else {
    let activeTags = [];
    let activeTagsIds = [];
    try {
      DB.getSnapshot().tags.forEach((tag) => {
        if (tag.active === true) {
          activeTags.push(tag);
          activeTagsIds.push(tag._id);
        }
      });
    } catch (e) {}

    let chartData = {
      wpm: TestStats.wpmHistory,
      raw: rawWpmPerSecond,
      err: errorsArray,
    };

    if (testtime > 122) {
      chartData = "toolong";
      TestStats.setKeypressTimingsTooLong();
    }

    let cdata = null;
    if (Config.mode === "custom") {
      cdata = {};
      cdata.textLen = CustomText.text.length;
      cdata.isWordRandom = CustomText.isWordRandom;
      cdata.isTimeRandom = CustomText.isTimeRandom;
      cdata.word =
        CustomText.word !== "" && !isNaN(CustomText.word)
          ? CustomText.word
          : null;
      cdata.time =
        CustomText.time !== "" && !isNaN(CustomText.time)
          ? CustomText.time
          : null;
    }

    let completedEvent = {
      wpm: stats.wpm,
      rawWpm: stats.wpmRaw,
      // correctChars: stats.correctChars + stats.correctSpaces,
      // incorrectChars: stats.incorrectChars,
      // allChars: stats.allChars,
      charStats: [
        stats.correctChars + stats.correctSpaces,
        stats.incorrectChars,
        stats.extraChars,
        stats.missedChars,
      ],
      acc: stats.acc,
      mode: Config.mode,
      mode2: mode2,
      quoteLength: quoteLength,
      punctuation: Config.punctuation,
      numbers: Config.numbers,
      lazyMode: Config.lazyMode,
      timestamp: Date.now(),
      language: lang,
      restartCount: TestStats.restartCount,
      incompleteTestSeconds:
        TestStats.incompleteSeconds < 0
          ? 0
          : Misc.roundTo2(TestStats.incompleteSeconds),
      difficulty: Config.difficulty,
      testDuration: testtime,
      afkDuration: afkseconds,
      blindMode: Config.blindMode,
      // theme: Config.theme,
      tags: activeTagsIds,
      keySpacing: TestStats.keypressTimings.spacing.array,
      keyDuration: TestStats.keypressTimings.duration.array,
      consistency: consistency,
      keyConsistency: keyConsistency,
      funbox: Config.funbox,
      bailedOut: bailout,
      chartData: chartData,
      customText: cdata,
    };

    if (Config.mode !== "custom") {
      delete completedEvent.CustomText;
    }

    if (
      Config.difficulty == "normal" ||
      ((Config.difficulty == "master" || Config.difficulty == "expert") &&
        !difficultyFailed)
    ) {
      // restartCount = 0;
      // incompleteTestSeconds = 0;
      TestStats.resetIncomplete();
    }
    if (
      stats.wpm > 0 &&
      stats.wpm < 350 &&
      stats.acc > 50 &&
      stats.acc <= 100
    ) {
      if (firebase.auth().currentUser != null) {
        completedEvent.uid = firebase.auth().currentUser.uid;
        if (Config.mode === "quote") {
          let userqr = DB.getSnapshot().quoteRatings?.[randomQuote.language]?.[
            randomQuote.id
          ];
          if (userqr) {
            $(".pageTest #result #rateQuoteButton .icon")
              .removeClass("far")
              .addClass("fas");
          }
          RateQuotePopup.getQuoteStats(randomQuote).then((quoteStats) => {
            if (quoteStats !== null) {
              $(".pageTest #result #rateQuoteButton .rating").text(
                quoteStats.average
              );
            }
            $(".pageTest #result #rateQuoteButton")
              .css({ opacity: 0 })
              .removeClass("hidden")
              .css({ opacity: 1 });
          });
        }

        //check local pb
        AccountButton.loading(true);
        let dontShowCrown = false;
        let pbDiff = 0;
        DB.getLocalPB(
          Config.mode,
          mode2,
          Config.punctuation,
          Config.language,
          Config.difficulty,
          Config.lazyMode,
          Config.funbox
        ).then((lpb) => {
          DB.getUserHighestWpm(
            Config.mode,
            mode2,
            Config.punctuation,
            Config.language,
            Config.difficulty,
            Config.lazyMode
          ).then(async (highestwpm) => {
            PbCrown.hide();
            $("#result .stats .wpm .crown").attr("aria-label", "");
            if (lpb < stats.wpm && stats.wpm < highestwpm) {
              dontShowCrown = true;
            }
            if (
              Config.funbox !== "none" &&
              Config.funbox !== "plus_one" &&
              Config.funbox !== "plus_two"
            ) {
              dontShowCrown = true;
            }
            if (Config.mode == "quote") dontShowCrown = true;
            if (lpb < stats.wpm) {
              //new pb based on local
              pbDiff = Math.abs(stats.wpm - lpb);
              if (!dontShowCrown) {
                PbCrown.show();
                $("#result .stats .wpm .crown").attr(
                  "aria-label",
                  "+" + Misc.roundTo2(pbDiff)
                );
              }
            }
            let themecolors = await ThemeColors.get();
            let chartlpb = Misc.roundTo2(
              Config.alwaysShowCPM ? lpb * 5 : lpb
            ).toFixed(2);
            if (lpb > 0) {
              ChartController.result.options.annotation.annotations.push({
                enabled: false,
                type: "line",
                mode: "horizontal",
                scaleID: "wpm",
                value: chartlpb,
                borderColor: themecolors["sub"],
                borderWidth: 1,
                borderDash: [2, 2],
                label: {
                  backgroundColor: themecolors["sub"],
                  fontFamily: Config.fontFamily.replace(/_/g, " "),
                  fontSize: 11,
                  fontStyle: "normal",
                  fontColor: themecolors["bg"],
                  xPadding: 6,
                  yPadding: 6,
                  cornerRadius: 3,
                  position: "center",
                  enabled: true,
                  content: `PB: ${chartlpb}`,
                },
              });
              if (
                maxChartVal >= parseFloat(chartlpb) - 20 &&
                maxChartVal <= parseFloat(chartlpb) + 20
              ) {
                maxChartVal = parseFloat(chartlpb) + 20;
              }
              ChartController.result.options.scales.yAxes[0].ticks.max = Math.round(
                maxChartVal
              );
              ChartController.result.options.scales.yAxes[1].ticks.max = Math.round(
                maxChartVal
              );
              ChartController.result.update({ duration: 0 });
            }

            if (activeTags.length == 0) {
              $("#result .stats .tags").addClass("hidden");
            } else {
              $("#result .stats .tags").removeClass("hidden");
            }
            $("#result .stats .tags .bottom").text("");
            let annotationSide = "left";
            let labelAdjust = 15;
            activeTags.forEach(async (tag) => {
              let tpb = await DB.getLocalTagPB(
                tag._id,
                Config.mode,
                mode2,
                Config.punctuation,
                Config.language,
                Config.difficulty,
                Config.lazyMode
              );
              $("#result .stats .tags .bottom").append(`
                <div tagid="${tag._id}" aria-label="PB: ${tpb}" data-balloon-pos="up">${tag.name}<i class="fas fa-crown hidden"></i></div>
              `);
              if (Config.mode != "quote") {
                if (tpb < stats.wpm) {
                  //new pb for that tag
                  DB.saveLocalTagPB(
                    tag._id,
                    Config.mode,
                    mode2,
                    Config.punctuation,
                    Config.language,
                    Config.difficulty,
                    Config.lazyMode,
                    stats.wpm,
                    stats.acc,
                    stats.wpmRaw,
                    consistency
                  );
                  $(
                    `#result .stats .tags .bottom div[tagid="${tag._id}"] .fas`
                  ).removeClass("hidden");
                  $(
                    `#result .stats .tags .bottom div[tagid="${tag._id}"]`
                  ).attr("aria-label", "+" + Misc.roundTo2(stats.wpm - tpb));
                  // console.log("new pb for tag " + tag.name);
                } else {
                  ChartController.result.options.annotation.annotations.push({
                    enabled: false,
                    type: "line",
                    mode: "horizontal",
                    scaleID: "wpm",
                    value: Config.alwaysShowCPM ? tpb * 5 : tpb,
                    borderColor: themecolors["sub"],
                    borderWidth: 1,
                    borderDash: [2, 2],
                    label: {
                      backgroundColor: themecolors["sub"],
                      fontFamily: Config.fontFamily.replace(/_/g, " "),
                      fontSize: 11,
                      fontStyle: "normal",
                      fontColor: themecolors["bg"],
                      xPadding: 6,
                      yPadding: 6,
                      cornerRadius: 3,
                      position: annotationSide,
                      xAdjust: labelAdjust,
                      enabled: true,
                      content: `${tag.name} PB: ${Misc.roundTo2(
                        Config.alwaysShowCPM ? tpb * 5 : tpb
                      ).toFixed(2)}`,
                    },
                  });
                  if (annotationSide === "left") {
                    annotationSide = "right";
                    labelAdjust = -15;
                  } else {
                    annotationSide = "left";
                    labelAdjust = 15;
                  }
                }
              }
            });
            if (
              (completedEvent.funbox === "none" ||
                completedEvent.funbox === "plus_one" ||
                completedEvent.funbox === "plus_two") &&
              completedEvent.language === "english" &&
              completedEvent.mode === "time" &&
              ["15", "60"].includes(String(completedEvent.mode2))
            ) {
              //TODO bring back when leaderboards fixed
              // $("#result .stats .leaderboards").removeClass("hidden");
              // $("#result .stats .leaderboards .bottom").html(
              //   `checking <i class="fas fa-spin fa-fw fa-circle-notch"></i>`
              // );
            }
            completedEvent.challenge = ChallengeContoller.verify(
              completedEvent
            );
            completedEvent.hash = objecthash(completedEvent);
            axiosInstance
              .post("/results/add", {
                result: completedEvent,
              })
              .then((response) => {
                AccountButton.loading(false);

                if (response.status !== 200) {
                  Notifications.add(
                    "Result not saved. " + response.data.message,
                    -1
                  );
                } else {
                  completedEvent._id = response.data.insertedId;
                  if (
                    response.data.isPb &&
                    ["english"].includes(completedEvent.language)
                  ) {
                    completedEvent.isPb = true;
                  }
                  if (
                    DB.getSnapshot() !== null &&
                    DB.getSnapshot().results !== undefined
                  ) {
                    DB.getSnapshot().results.unshift(completedEvent);
                    if (DB.getSnapshot().globalStats.time == undefined) {
                      DB.getSnapshot().globalStats.time =
                        testtime +
                        completedEvent.incompleteTestSeconds -
                        afkseconds;
                    } else {
                      DB.getSnapshot().globalStats.time +=
                        testtime +
                        completedEvent.incompleteTestSeconds -
                        afkseconds;
                    }
                    if (DB.getSnapshot().globalStats.started == undefined) {
                      DB.getSnapshot().globalStats.started =
                        TestStats.restartCount + 1;
                    } else {
                      DB.getSnapshot().globalStats.started +=
                        TestStats.restartCount + 1;
                    }
                    if (DB.getSnapshot().globalStats.completed == undefined) {
                      DB.getSnapshot().globalStats.completed = 1;
                    } else {
                      DB.getSnapshot().globalStats.completed += 1;
                    }
                  }
                  try {
                    firebase
                      .analytics()
                      .logEvent("testCompleted", completedEvent);
                  } catch (e) {
                    console.log("Analytics unavailable");
                  }

                  if (response.data.isPb) {
                    //new pb
                    PbCrown.show();
                    $("#result .stats .wpm .crown").attr(
                      "aria-label",
                      "+" + Misc.roundTo2(pbDiff)
                    );
                    DB.saveLocalPB(
                      Config.mode,
                      mode2,
                      Config.punctuation,
                      Config.language,
                      Config.difficulty,
                      Config.lazyMode,
                      stats.wpm,
                      stats.acc,
                      stats.wpmRaw,
                      consistency
                    );
                  } else {
                    PbCrown.hide();
                    // if (localPb) {
                    //   Notifications.add(
                    //     "Local PB data is out of sync! Refresh the page to resync it or contact Miodec on Discord.",
                    //     15000
                    //   );
                    // }
                  }
                }
              })
              .catch((e) => {
                AccountButton.loading(false);
                let msg = e?.response?.data?.message ?? e.message;
                Notifications.add("Failed to save result: " + msg, -1);
              });
          });
        });
      } else {
        $(".pageTest #result #rateQuoteButton").addClass("hidden");
        try {
          firebase.analytics().logEvent("testCompletedNoLogin", completedEvent);
        } catch (e) {
          console.log("Analytics unavailable");
        }
        notSignedInLastResult = completedEvent;
      }
    } else {
      Notifications.add("Test invalid", 0);
      TestStats.setInvalid();
      try {
        firebase.analytics().logEvent("testCompletedInvalid", completedEvent);
      } catch (e) {
        console.log("Analytics unavailable");
      }
    }
  }

  if (firebase.auth().currentUser != null) {
    $("#result .loginTip").addClass("hidden");
  } else {
    $("#result .stats .leaderboards").addClass("hidden");
    $("#result .loginTip").removeClass("hidden");
  }

  let testType = "";

  if (Config.mode === "quote") {
    let qlen = "";
    if (Config.quoteLength === 0) {
      qlen = "short ";
    } else if (Config.quoteLength === 1) {
      qlen = "medium ";
    } else if (Config.quoteLength === 2) {
      qlen = "long ";
    } else if (Config.quoteLength === 3) {
      qlen = "thicc ";
    }
    testType += qlen + Config.mode;
  } else {
    testType += Config.mode;
  }
  if (Config.mode == "time") {
    testType += " " + Config.time;
  } else if (Config.mode == "words") {
    testType += " " + Config.words;
  }
  if (
    Config.mode != "custom" &&
    Config.funbox !== "gibberish" &&
    Config.funbox !== "ascii" &&
    Config.funbox !== "58008"
  ) {
    testType += "<br>" + lang.replace(/_/g, " ");
  }
  if (Config.punctuation) {
    testType += "<br>punctuation";
  }
  if (Config.numbers) {
    testType += "<br>numbers";
  }
  if (Config.blindMode) {
    testType += "<br>blind";
  }
  if (Config.lazyMode) {
    testType += "<br>lazy";
  }
  if (Config.funbox !== "none") {
    testType += "<br>" + Config.funbox.replace(/_/g, " ");
  }
  if (Config.difficulty == "expert") {
    testType += "<br>expert";
  } else if (Config.difficulty == "master") {
    testType += "<br>master";
  }

  $("#result .stats .testType .bottom").html(testType);

  let otherText = "";
  // if (Config.layout !== "default") {
  //   otherText += "<br>" + Config.layout;
  // }
  if (difficultyFailed) {
    otherText += `<br>failed (${failReason})`;
  }
  if (afkDetected) {
    otherText += "<br>afk detected";
  }
  if (TestStats.invalid) {
    otherText += "<br>invalid";
  }
  if (isRepeated) {
    otherText += "<br>repeated";
  }
  if (bailout) {
    otherText += "<br>bailed out";
  }

  if (otherText == "") {
    $("#result .stats .info").addClass("hidden");
  } else {
    $("#result .stats .info").removeClass("hidden");
    otherText = otherText.substring(4);
    $("#result .stats .info .bottom").html(otherText);
  }

  if (
    $("#result .stats .tags").hasClass("hidden") &&
    $("#result .stats .info").hasClass("hidden")
  ) {
    $("#result .stats .infoAndTags").addClass("hidden");
  } else {
    $("#result .stats .infoAndTags").removeClass("hidden");
  }

  if (Config.mode === "quote") {
    $("#result .stats .source").removeClass("hidden");
    $("#result .stats .source .bottom").html(randomQuote.source);
  } else {
    $("#result .stats .source").addClass("hidden");
  }
  let fc = await ThemeColors.get("sub");
  if (Config.funbox !== "none") {
    let content = Config.funbox;
    if (Config.funbox === "layoutfluid") {
      content += " " + Config.customLayoutfluid.replace(/#/g, " ");
    }
    ChartController.result.options.annotation.annotations.push({
      enabled: false,
      type: "line",
      mode: "horizontal",
      scaleID: "wpm",
      value: 0,
      borderColor: "transparent",
      borderWidth: 1,
      borderDash: [2, 2],
      label: {
        backgroundColor: "transparent",
        fontFamily: Config.fontFamily.replace(/_/g, " "),
        fontSize: 11,
        fontStyle: "normal",
        fontColor: fc,
        xPadding: 6,
        yPadding: 6,
        cornerRadius: 3,
        position: "left",
        enabled: true,
        content: `${content}`,
        yAdjust: -11,
      },
    });
  }

  ChartController.result.options.scales.yAxes[0].ticks.max = maxChartVal;
  ChartController.result.options.scales.yAxes[1].ticks.max = maxChartVal;

  ChartController.result.update({ duration: 0 });
  ChartController.result.resize();

  if (glarsesMode) {
    $("#middle #result .glarsesmessage").remove();
    $("#middle #result").prepend(`

      <div class='glarsesmessage' style="
        text-align: center;
        grid-column: 1/3;
        font-size: 2rem;
        padding: 2rem 0;
      ">Test completed</div>

    `);
    $("#middle #result .stats").remove();
    $("#middle #result .chart").remove();
    $("#middle #result #resultWordsHistory").remove();
    $("#middle #result #resultReplay").remove();
    $("#middle #result .loginTip").remove();

    console.log(
      `Test Completed: ${stats.wpm} wpm ${stats.acc}% acc ${stats.wpmRaw} raw ${consistency}% consistency`
    );
  }

  UI.swapElements(
    $("#typingTest"),
    $("#result"),
    250,
    () => {
      TestUI.setResultCalculating(false);
      $("#words").empty();
      ChartController.result.resize();

      if (Config.alwaysShowWordsHistory && Config.burstHeatmap) {
        TestUI.applyBurstHeatmap();
      }
      $("#result").focus();
      $("#testModesNotice").addClass("hidden");
    },
    () => {
      if (Config.alwaysShowWordsHistory) {
        TestUI.toggleResultWords();
      }
      Keymap.hide();
    }
  );
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
