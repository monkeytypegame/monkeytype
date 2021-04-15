import * as TestUI from "./test-ui";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Misc from "./misc";
import * as Notifications from "./notifications";
import * as CustomText from "./custom-text";
import * as TestStats from "./test-stats";
import * as PractiseMissed from "./practise-missed";
import * as ShiftTracker from "./shift-tracker";
import * as Focus from "./focus";
import * as Funbox from "./funbox";
import * as Keymap from "./keymap";
import * as ThemeController from "./theme-controller";
import * as PaceCaret from "./pace-caret";
import * as Caret from "./caret";
import * as LiveWpm from "./live-wpm";
import * as LiveAcc from "./live-acc";
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
import * as CloudFunctions from "./cloud-functions";
import * as TestLeaderboards from "./test-leaderboards";

export let notSignedInLastResult = null;

export function setNotSignedInUid(uid) {
  notSignedInLastResult.uid = uid;
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

  pushHistory() {
    this.history.push(this.current);
    this.historyLength = this.history.length;
    this.resetCurrent();
  }

  popHistory() {
    return this.history.pop();
  }

  getHistory(i) {
    return this.history[i];
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
export let hasTab = false;
export let randomQuote = null;
export let bailout = false;

export function setActive(tf) {
  active = tf;
}

export function setRepeated(tf) {
  isRepeated = tf;
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

export function punctuateWord(previousWord, currentWord, index, maxindex) {
  let word = currentWord;

  if (
    (index == 0 ||
      Misc.getLastChar(previousWord) == "." ||
      Misc.getLastChar(previousWord) == "?" ||
      Misc.getLastChar(previousWord) == "!") &&
    Config.language.split("_")[0] != "code"
  ) {
    //always capitalise the first word or if there was a dot unless using a code alphabet
    word = Misc.capitalizeFirstLetter(word);
  } else if (
    (Math.random() < 0.1 &&
      Misc.getLastChar(previousWord) != "." &&
      Misc.getLastChar(previousWord) != "," &&
      index != maxindex - 2) ||
    index == maxindex - 1
  ) {
    let rand = Math.random();
    if (rand <= 0.8) {
      word += ".";
    } else if (rand > 0.8 && rand < 0.9) {
      if (Config.language.split("_")[0] == "french") {
        word = "?";
      } else {
        word += "?";
      }
    } else {
      if (Config.language.split("_")[0] == "french") {
        word = "!";
      } else {
        word += "!";
      }
    }
  } else if (
    Math.random() < 0.01 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    Config.language.split("_")[0] !== "russian"
  ) {
    word = `"${word}"`;
  } else if (
    Math.random() < 0.011 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "." &&
    Config.language.split("_")[0] !== "russian"
  ) {
    word = `'${word}'`;
  } else if (
    Math.random() < 0.012 &&
    Misc.getLastChar(previousWord) != "," &&
    Misc.getLastChar(previousWord) != "."
  ) {
    if (Config.language.split("_")[0] == "code") {
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
  } else if (Math.random() < 0.013) {
    if (Config.language.split("_")[0] == "french") {
      word = ":";
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
    Misc.getLastChar(previousWord) != ";"
  ) {
    if (Config.language.split("_")[0] == "french") {
      word = ";";
    } else {
      word += ";";
    }
  } else if (Math.random() < 0.2 && Misc.getLastChar(previousWord) != ",") {
    word += ",";
  } else if (Math.random() < 0.25 && Config.language.split("_")[0] == "code") {
    let specials = ["{", "}", "[", "]", "(", ")", ";", "=", "%", "/"];

    word = specials[Math.floor(Math.random() * 10)];
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
  TestStats.resetKeypressTimings();
  TimerProgress.restart();
  TimerProgress.show();
  $("#liveWpm").text("0");
  LiveWpm.show();
  LiveAcc.show();
  TimerProgress.update(TestTimer.time);
  TestTimer.clear();

  if (Funbox.active === "memory") {
    Funbox.resetMemoryTimer();
    $("#wordsWrapper").addClass("hidden");
  }

  try {
    if (Config.paceCaret !== "off") PaceCaret.start();
  } catch (e) {}
  //use a recursive self-adjusting timer to avoid time drift
  TestStats.setStart(performance.now());
  TestTimer.start();
  return true;
}

export async function init() {
  setActive(false);
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

  if (
    Config.mode == "time" ||
    Config.mode == "words" ||
    Config.mode == "custom"
  ) {
    let wordsBound = 100;
    if (Config.showAllLines) {
      if (Config.mode === "custom") {
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
    if (Funbox.active === "plus_one") {
      wordsBound = 2;
    }
    let wordset = language.words;
    if (Config.mode == "custom") {
      wordset = CustomText.text;
    }
    for (let i = 0; i < wordsBound; i++) {
      let randomWord = wordset[Math.floor(Math.random() * wordset.length)];
      const previousWord = words.get(i - 1);
      const previousWord2 = words.get(i - 2);
      if (
        Config.mode == "custom" &&
        (CustomText.isWordRandom || CustomText.isTimeRandom)
      ) {
        randomWord = wordset[Math.floor(Math.random() * wordset.length)];
      } else if (Config.mode == "custom" && !CustomText.isWordRandom) {
        randomWord = CustomText.text[i];
      } else {
        while (
          randomWord == previousWord ||
          randomWord == previousWord2 ||
          (!Config.punctuation && randomWord == "I") ||
          randomWord.indexOf(" ") > -1
        ) {
          randomWord = wordset[Math.floor(Math.random() * wordset.length)];
        }
      }

      if (Funbox.funboxSaved === "rAnDoMcAsE") {
        let randomcaseword = "";
        for (let i = 0; i < randomWord.length; i++) {
          if (i % 2 != 0) {
            randomcaseword += randomWord[i].toUpperCase();
          } else {
            randomcaseword += randomWord[i];
          }
        }
        randomWord = randomcaseword;
      } else if (Funbox.funboxSaved === "gibberish") {
        randomWord = Misc.getGibberish();
      } else if (Funbox.funboxSaved === "58008") {
        UpdateConfig.setPunctuation(false, true);
        UpdateConfig.setNumbers(false, true);
        randomWord = Misc.getNumbers(7);
      } else if (Funbox.funboxSaved === "specials") {
        UpdateConfig.setPunctuation(false, true);
        UpdateConfig.setNumbers(false, true);
        randomWord = Misc.getSpecials();
      } else if (Funbox.funboxSaved === "ascii") {
        UpdateConfig.setPunctuation(false, true);
        UpdateConfig.setNumbers(false, true);
        randomWord = Misc.getASCII();
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

      words.push(randomWord);
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

    setRandomQuote(rq);

    let w = randomQuote.text.trim().split(" ");
    for (let i = 0; i < w.length; i++) {
      if (/\t/g.test(w[i])) {
        setHasTab(true);
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
  } else {
    $("#words").removeClass("withLigatures");
  }
  // if (Config.mode == "zen") {
  //   // Creating an empty active word element for zen mode
  //   $("#words").append('<div class="word active"></div>');
  //   $("#words").css("height", "auto");
  //   $("#wordsWrapper").css("height", "auto");
  // } else {
  TestUI.showWords();
  // }
  if ($(".pageTest").hasClass("active")) {
    Funbox.activate();
  }
}

export function restart(withSameWordset = false, nosave = false, event) {
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
    let afkseconds = TestStats.calculateAfkSeconds();
    // incompleteTestSeconds += ;
    TestStats.incrementIncompleteSeconds(testSeconds - afkseconds);
    TestStats.incrementRestartCount();
    // restartCount++;
  }

  if (Config.mode == "zen") {
    $("#words").empty();
  }

  if (PractiseMissed.before.mode !== null && !withSameWordset) {
    Notifications.add("Reverting to previous settings.", 0);
    UpdateConfig.setMode(PractiseMissed.before.mode);
    UpdateConfig.setPunctuation(PractiseMissed.before.punctuation);
    UpdateConfig.setNumbers(PractiseMissed.before.numbers);
    PractiseMissed.resetBefore();
  }

  ManualRestart.reset();
  TestTimer.clear();
  TestStats.restart();
  corrected.reset();
  ShiftTracker.reset();
  Focus.set(false);
  Caret.hide();
  setActive(false);
  LiveWpm.hide();
  LiveAcc.hide();
  TimerProgress.hide();
  setBailout(false);
  PaceCaret.reset();
  $("#showWordHistoryButton").removeClass("loaded");
  TestUI.focusWords();
  Funbox.resetMemoryTimer();

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
      ThemeController.randomiseTheme();
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
      if (!withSameWordset) {
        setRepeated(false);
        setHasTab(false);
        await init();
        PaceCaret.init(nosave);
      } else {
        setRepeated(true);
        setActive(false);
        words.resetCurrentIndex();
        input.reset();
        PaceCaret.init();
        TestUI.showWords();
        Funbox.activate();
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
      document.querySelector("#liveWpm").innerHTML = "0";
      document.querySelector("#liveAcc").innerHTML = "100%";

      if (Funbox.active === "memory") {
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
      if (Funbox.active !== "none") {
        fbtext = " " + Funbox.active;
      }
      $(".pageTest #premidTestMode").text(
        `${Config.mode} ${mode2} ${Config.language}${fbtext}`
      );
      $(".pageTest #premidSecondsLeft").text(Config.time);

      if (Funbox.active === "layoutfluid") {
        UpdateConfig.setLayout("qwerty");
        UpdateConfig.setKeymapLayout("qwerty");
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
            ChartController.result.update();
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
  if (Funbox.active === "nospace") {
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

export function addWord() {
  let bound = 100;
  if (Funbox.active === "plus_one") bound = 1;
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
      words.length >= CustomText.text.length)
  )
    return;
  const language =
    Config.mode !== "custom"
      ? Misc.getCurrentLanguage()
      : {
          //borrow the direction of the current language
          leftToRight: Misc.getCurrentLanguage().leftToRight,
          words: CustomText.text,
        };
  const wordset = language.words;
  let randomWord = wordset[Math.floor(Math.random() * wordset.length)];
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
    CustomText.isWordRandom &&
    wordset.length < 3
  ) {
    randomWord = wordset[Math.floor(Math.random() * wordset.length)];
  } else if (Config.mode == "custom" && !CustomText.isWordRandom) {
    randomWord = CustomText.text[words.length];
  } else {
    while (
      previousWordStripped == randomWord ||
      previousWord2Stripped == randomWord ||
      randomWord.indexOf(" ") > -1 ||
      (!Config.punctuation && randomWord == "I")
    ) {
      randomWord = wordset[Math.floor(Math.random() * wordset.length)];
    }
  }

  if (Funbox.active === "rAnDoMcAsE") {
    let randomcaseword = "";
    for (let i = 0; i < randomWord.length; i++) {
      if (i % 2 != 0) {
        randomcaseword += randomWord[i].toUpperCase();
      } else {
        randomcaseword += randomWord[i];
      }
    }
    randomWord = randomcaseword;
  } else if (Funbox.active === "gibberish") {
    randomWord = Misc.getGibberish();
  } else if (Funbox.active === "58008") {
    randomWord = Misc.getNumbers(7);
  } else if (Funbox.active === "specials") {
    randomWord = Misc.getSpecials();
  } else if (Funbox.active === "ascii") {
    randomWord = Misc.getASCII();
  }

  if (Config.punctuation && Config.mode != "custom") {
    randomWord = punctuateWord(previousWord, randomWord, words.length, 0);
  }
  if (Config.numbers && Config.mode != "custom") {
    if (Math.random() < 0.1) {
      randomWord = Misc.getNumbers(4);
    }
  }

  words.push(randomWord);
  TestUI.addWord(randomWord);
}

export function finish(difficultyFailed = false) {
  if (!active) return;
  if (Config.mode == "zen" && input.current.length != 0) {
    input.pushHistory();
    corrected.pushHistory();
  }

  TestStats.recordKeypressSpacing();

  TestUI.setResultCalculating(true);
  TestUI.setResultVisible(true);
  TestStats.setEnd(performance.now());
  setActive(false);
  Focus.set(false);
  Caret.hide();
  LiveWpm.hide();
  PbCrown.hide();
  LiveAcc.hide();
  TimerProgress.hide();
  Keymap.hide();
  Funbox.activate("none", null);
  let stats = TestStats.calculateStats();
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
  let testtime = stats.time;
  let afkseconds = TestStats.calculateAfkSeconds();
  let afkSecondsPercent = Misc.roundTo2((afkseconds / testtime) * 100);

  ChartController.result.options.annotation.annotations = [];

  $("#result #resultWordsHistory").addClass("hidden");

  if (Config.alwaysShowDecimalPlaces) {
    if (Config.alwaysShowCPM == false) {
      $("#result .stats .wpm .top .text").text("wpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Misc.roundTo2(stats.wpm));
      }
      $("#result .stats .raw .bottom").text(Misc.roundTo2(stats.wpmRaw));
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm * 5) + " cpm"
      );
    } else {
      $("#result .stats .wpm .top .text").text("cpm");
      if (inf) {
        $("#result .stats .wpm .bottom").text("Infinite");
      } else {
        $("#result .stats .wpm .bottom").text(Misc.roundTo2(stats.wpm * 5));
      }
      $("#result .stats .raw .bottom").text(Misc.roundTo2(stats.wpmRaw * 5));
      $("#result .stats .wpm .bottom").attr(
        "aria-label",
        Misc.roundTo2(stats.wpm) + " wpm"
      );
    }

    $("#result .stats .acc .bottom").text(Misc.roundTo2(stats.acc) + "%");
    let time = Misc.roundTo2(testtime) + "s";
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

  $("#testModesNotice").addClass("hidden");

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

  if (TestStats.lastSecondNotRound) {
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
  let keyConsistency = Misc.roundTo2(
    Misc.kogasa(
      Misc.stdDev(TestStats.keypressTimings.spacing.array) /
        Misc.mean(TestStats.keypressTimings.spacing.array)
    )
  );

  if (isNaN(consistency)) {
    consistency = 0;
  }

  if (Config.alwaysShowDecimalPlaces) {
    $("#result .stats .consistency .bottom").text(
      Misc.roundTo2(consistency) + "%"
    );
    $("#result .stats .consistency .bottom").attr(
      "aria-label",
      `${keyConsistency}% key`
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

  ChartController.result.data.datasets[0].data = TestStats.wpmHistory;
  ChartController.result.data.datasets[1].data = rawWpmPerSecond;

  let maxChartVal = Math.max(
    ...[Math.max(...rawWpmPerSecond), Math.max(...TestStats.wpmHistory)]
  );
  if (!Config.startGraphsAtZero) {
    ChartController.result.options.scales.yAxes[0].ticks.min = Math.min(
      ...TestStats.wpmHistory
    );
    ChartController.result.options.scales.yAxes[1].ticks.min = Math.min(
      ...TestStats.wpmHistory
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

  let kps = TestStats.keypressPerSecond.slice(
    Math.max(TestStats.keypressPerSecond.length - 5, 0)
  );

  kps = kps.map((a) => a.count);

  kps = kps.reduce((a, b) => a + b, 0);

  let afkDetected = kps === 0 ? true : false;

  if (bailout) afkDetected = false;

  $("#result .stats .tags").addClass("hidden");

  let lang = Config.language;

  let quoteLength = -1;
  if (Config.mode === "quote") {
    quoteLength = randomQuote.group;
    lang = Config.language.replace(/_\d*k$/g, "");
  }

  if (difficultyFailed) {
    Notifications.add("Test failed", 0, 1);
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
          activeTagsIds.push(tag.id);
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
      correctChars: stats.correctChars + stats.correctSpaces,
      incorrectChars: stats.incorrectChars,
      allChars: stats.allChars,
      acc: stats.acc,
      mode: Config.mode,
      mode2: mode2,
      quoteLength: quoteLength,
      punctuation: Config.punctuation,
      numbers: Config.numbers,
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
      theme: Config.theme,
      tags: activeTagsIds,
      keySpacing: TestStats.keypressTimings.spacing.array,
      keyDuration: TestStats.keypressTimings.duration.array,
      consistency: consistency,
      keyConsistency: keyConsistency,
      funbox: Funbox.active,
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
        //check local pb
        AccountButton.loading(true);
        let dontShowCrown = false;
        let pbDiff = 0;
        DB.getLocalPB(
          Config.mode,
          mode2,
          Config.punctuation,
          Config.language,
          Config.difficulty
        ).then((lpb) => {
          DB.getUserHighestWpm(
            Config.mode,
            mode2,
            Config.punctuation,
            Config.language,
            Config.difficulty
          ).then((highestwpm) => {
            PbCrown.hide();
            $("#result .stats .wpm .crown").attr("aria-label", "");
            if (lpb < stats.wpm && stats.wpm < highestwpm) {
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
            if (lpb > 0) {
              ChartController.result.options.annotation.annotations.push({
                enabled: false,
                type: "line",
                mode: "horizontal",
                scaleID: "wpm",
                value: lpb,
                borderColor: ThemeColors.sub,
                borderWidth: 1,
                borderDash: [2, 2],
                label: {
                  backgroundColor: ThemeColors.sub,
                  fontFamily: Config.fontFamily.replace(/_/g, " "),
                  fontSize: 11,
                  fontStyle: "normal",
                  fontColor: ThemeColors.bg,
                  xPadding: 6,
                  yPadding: 6,
                  cornerRadius: 3,
                  position: "center",
                  enabled: true,
                  content: `PB: ${lpb}`,
                },
              });
              if (maxChartVal >= lpb - 15 && maxChartVal <= lpb + 15) {
                maxChartVal = lpb + 15;
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
            activeTags.forEach(async (tag) => {
              let tpb = await DB.getLocalTagPB(
                tag.id,
                Config.mode,
                mode2,
                Config.punctuation,
                Config.language,
                Config.difficulty
              );
              $("#result .stats .tags .bottom").append(`
                <div tagid="${tag.id}" aria-label="PB: ${tpb}" data-balloon-pos="up">${tag.name}<i class="fas fa-crown hidden"></i></div>
              `);
              if (Config.mode != "quote") {
                if (tpb < stats.wpm) {
                  //new pb for that tag
                  DB.saveLocalTagPB(
                    tag.id,
                    Config.mode,
                    mode2,
                    Config.punctuation,
                    Config.language,
                    Config.difficulty,
                    stats.wpm,
                    stats.acc,
                    stats.wpmRaw,
                    consistency
                  );
                  $(
                    `#result .stats .tags .bottom div[tagid="${tag.id}"] .fas`
                  ).removeClass("hidden");
                  $(`#result .stats .tags .bottom div[tagid="${tag.id}"]`).attr(
                    "aria-label",
                    "+" + Misc.roundTo2(stats.wpm - tpb)
                  );
                  // console.log("new pb for tag " + tag.name);
                } else {
                  ChartController.result.options.annotation.annotations.push({
                    enabled: false,
                    type: "line",
                    mode: "horizontal",
                    scaleID: "wpm",
                    value: tpb,
                    borderColor: ThemeColors.sub,
                    borderWidth: 1,
                    borderDash: [2, 2],
                    label: {
                      backgroundColor: ThemeColors.sub,
                      fontFamily: Config.fontFamily.replace(/_/g, " "),
                      fontSize: 11,
                      fontStyle: "normal",
                      fontColor: ThemeColors.bg,
                      xPadding: 6,
                      yPadding: 6,
                      cornerRadius: 3,
                      position: annotationSide,
                      enabled: true,
                      content: `${tag.name} PB: ${tpb}`,
                    },
                  });
                  if (annotationSide === "left") {
                    annotationSide = "right";
                  } else {
                    annotationSide = "left";
                  }
                }
              }
            });
            if (
              completedEvent.funbox === "none" &&
              completedEvent.language === "english" &&
              completedEvent.mode === "time" &&
              ["15", "60"].includes(String(completedEvent.mode2))
            ) {
              $("#result .stats .leaderboards").removeClass("hidden");
              $("#result .stats .leaderboards .bottom").html(
                `checking <i class="fas fa-spin fa-fw fa-circle-notch"></i>`
              );
            }
            CloudFunctions.testCompleted({
              uid: firebase.auth().currentUser.uid,
              obj: completedEvent,
            })
              .then((e) => {
                AccountButton.loading(false);
                if (e.data == null) {
                  Notifications.add(
                    "Unexpected response from the server: " + e.data,
                    -1
                  );
                  return;
                }
                if (e.data.resultCode === -1) {
                  Notifications.add("Could not save result", -1);
                } else if (e.data.resultCode === -2) {
                  Notifications.add(
                    "Possible bot detected. Result not saved.",
                    -1
                  );
                } else if (e.data.resultCode === -3) {
                  Notifications.add(
                    "Could not verify keypress stats. Result not saved.",
                    -1
                  );
                } else if (e.data.resultCode === -4) {
                  Notifications.add(
                    "Result data does not make sense. Result not saved.",
                    -1
                  );
                } else if (e.data.resultCode === -5) {
                  Notifications.add("Test too short. Result not saved.", -1);
                } else if (e.data.resultCode === -999) {
                  console.error("internal error: " + e.data.message);
                  Notifications.add(
                    "Internal error. Result might not be saved. " +
                      e.data.message,
                    -1
                  );
                } else if (e.data.resultCode === 1 || e.data.resultCode === 2) {
                  completedEvent.id = e.data.createdId;
                  TestLeaderboards.check(completedEvent);
                  if (e.data.resultCode === 2) {
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

                  if (e.data.resultCode === 2) {
                    //new pb
                    PbCrown.show();
                    DB.saveLocalPB(
                      Config.mode,
                      mode2,
                      Config.punctuation,
                      Config.language,
                      Config.difficulty,
                      stats.wpm,
                      stats.acc,
                      stats.wpmRaw,
                      consistency
                    );
                  } else if (e.data.resultCode === 1) {
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
                console.error(e);
                Notifications.add("Could not save result. " + e, -1);
              });
          });
        });
      } else {
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
    Funbox.active !== "gibberish" &&
    Funbox.active !== "58008"
  ) {
    testType += "<br>" + lang;
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
  if (Funbox.funboxSaved !== "none") {
    testType += "<br>" + Funbox.funboxSaved.replace(/_/g, " ");
  }
  if (Config.difficulty == "expert") {
    testType += "<br>expert";
  } else if (Config.difficulty == "master") {
    testType += "<br>master";
  }

  $("#result .stats .testType .bottom").html(testType);

  let otherText = "";
  if (Config.layout !== "default") {
    otherText += "<br>" + Config.layout;
  }
  if (difficultyFailed) {
    otherText += "<br>failed";
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

  if (Funbox.funboxSaved !== "none") {
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
        fontColor: ThemeColors.sub,
        xPadding: 6,
        yPadding: 6,
        cornerRadius: 3,
        position: "left",
        enabled: true,
        content: `${Funbox.funboxSaved}`,
        yAdjust: -11,
      },
    });
  }

  ChartController.result.options.scales.yAxes[0].ticks.max = maxChartVal;
  ChartController.result.options.scales.yAxes[1].ticks.max = maxChartVal;

  ChartController.result.update({ duration: 0 });
  ChartController.result.resize();
  UI.swapElements($("#typingTest"), $("#result"), 250, () => {
    TestUI.setResultCalculating(false);
    $("#words").empty();
    ChartController.result.resize();
    if (Config.alwaysShowWordsHistory) {
      TestUI.toggleResultWords();
    }
  });
}

export function fail() {
  input.pushHistory();
  corrected.pushHistory();
  TestStats.pushKeypressesToHistory();
  TestStats.setLastSecondNotRound();
  finish(true);
  let testSeconds = TestStats.calculateTestSeconds(performance.now());
  let afkseconds = TestStats.calculateAfkSeconds();
  TestStats.incrementIncompleteSeconds(testSeconds - afkseconds);
  TestStats.incrementRestartCount();
}
