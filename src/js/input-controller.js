import * as TestLogic from "./test-logic";
import * as TestUI from "./test-ui";
import * as TestStats from "./test-stats";
import * as Monkey from "./monkey";
import Config, * as UpdateConfig from "./config";
import * as Keymap from "./keymap";
import * as Misc from "./misc";
import * as LiveAcc from "./live-acc";
import * as LiveBurst from "./live-burst";
import * as Funbox from "./funbox";
import * as Sound from "./sound";
import * as Caret from "./caret";
import * as ManualRestart from "./manual-restart-tracker";
import * as Notifications from "./notifications";
import * as CustomText from "./custom-text";
import * as UI from "./ui";
import * as Settings from "./settings";
import * as LayoutEmulator from "./layout-emulator";
import * as PaceCaret from "./pace-caret";
import * as TimerProgress from "./timer-progress";
import * as TestTimer from "./test-timer";
import * as Focus from "./focus";
import * as ShiftTracker from "./shift-tracker";
import * as Replay from "./replay.js";
import * as MonkeyPower from "./monkey-power";
import * as WeakSpot from "./weak-spot";

let dontInsertSpace = false;
let correctShiftUsed = true;

function setWordsInput(value) {
  // Only change #wordsInput if it's not already the wanted value
  // Avoids Safari triggering unneeded events, causing issues with
  // dead keys.
  if (value !== $("#wordsInput").val()) {
    $("#wordsInput").val(value);
  }
}

function backspaceToPrevious() {
  if (!TestLogic.active) return;

  if (
    TestLogic.input.history.length == 0 ||
    TestUI.currentWordElementIndex == 0
  )
    return;

  if (
    (TestLogic.input.history[TestLogic.words.currentIndex - 1] ==
      TestLogic.words.get(TestLogic.words.currentIndex - 1) &&
      !Config.freedomMode) ||
    $($(".word")[TestLogic.words.currentIndex - 1]).hasClass("hidden")
  ) {
    return;
  }

  if (Config.confidenceMode === "on" || Config.confidenceMode === "max") {
    return;
  }

  TestUI.updateWordElement();
  TestLogic.input.current = TestLogic.input.popHistory();
  TestLogic.corrected.popHistory();

  if (Config.funbox === "nospace") {
    TestLogic.input.current = TestLogic.input.current.slice(0, -1);
  }

  TestLogic.words.decreaseCurrentIndex();
  TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex - 1);
  TestUI.updateActiveElement(true);
  Funbox.toggleScript(TestLogic.words.getCurrent());

  Caret.updatePosition();
  Replay.addReplayEvent("backWord");
}

function handleSpace() {
  if (!TestLogic.active) return;

  if (TestLogic.input.current === "") return;

  if (Config.mode == "zen") {
    $("#words .word.active").removeClass("active");
    $("#words").append("<div class='word active'></div>");
  }

  let currentWord = TestLogic.words.getCurrent();
  if (Config.funbox === "layoutfluid" && Config.mode !== "time") {
    // here I need to check if Config.customLayoutFluid exists because of my scuffed solution of returning whenever value is undefined in the setCustomLayoutfluid function
    const layouts = Config.customLayoutfluid
      ? Config.customLayoutfluid.split("#")
      : ["qwerty", "dvorak", "colemak"];
    let index = 0;
    let outof = TestLogic.words.length;
    index = Math.floor(
      (TestLogic.input.history.length + 1) / (outof / layouts.length)
    );
    if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
      Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
    }
    UpdateConfig.setLayout(layouts[index]);
    UpdateConfig.setKeymapLayout(layouts[index]);
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .charAt(TestLogic.input.current.length)
        .toString()
        .toUpperCase()
    );
    Settings.groups.layout.updateButton();
  }
  dontInsertSpace = true;

  let burst = TestStats.calculateBurst();
  LiveBurst.update(Math.round(burst));
  TestStats.pushBurstToHistory(burst);

  //correct word or in zen mode
  const isWordCorrect =
    currentWord == TestLogic.input.current || Config.mode == "zen";
  MonkeyPower.addPower(isWordCorrect, true);
  TestStats.incrementAccuracy(isWordCorrect);
  if (isWordCorrect) {
    PaceCaret.handleSpace(true, currentWord);
    TestLogic.input.pushHistory();
    TestLogic.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestLogic.words.getCurrent());
    Caret.updatePosition();
    TestStats.incrementKeypressCount();
    TestStats.pushKeypressWord(TestLogic.words.currentIndex);
    if (Config.funbox !== "nospace") {
      Sound.playClick(Config.playSoundOnClick);
    }
    Replay.addReplayEvent("submitCorrectWord");
  } else {
    if (Config.funbox !== "nospace") {
      if (!Config.playSoundOnError || Config.blindMode) {
        Sound.playClick(Config.playSoundOnClick);
      } else {
        Sound.playError(Config.playSoundOnError);
      }
    }
    TestStats.pushMissedWord(TestLogic.words.getCurrent());
    TestStats.incrementKeypressErrors();
    let cil = TestLogic.input.current.length;
    if (cil <= TestLogic.words.getCurrent().length) {
      if (cil >= TestLogic.corrected.current.length) {
        TestLogic.corrected.current += "_";
      } else {
        TestLogic.corrected.current =
          TestLogic.corrected.current.substring(0, cil) +
          "_" +
          TestLogic.corrected.current.substring(cil + 1);
      }
    }
    if (Config.stopOnError != "off") {
      if (Config.difficulty == "expert" || Config.difficulty == "master") {
        //failed due to diff when pressing space
        TestLogic.fail("difficulty");
        return;
      }
      if (Config.stopOnError == "word") {
        dontInsertSpace = false;
        Replay.addReplayEvent("incorrectLetter", "_");
        TestUI.updateWordElement(true);
        Caret.updatePosition();
      }
      return;
    }
    PaceCaret.handleSpace(false, currentWord);
    if (Config.blindMode) $("#words .word.active letter").addClass("correct");
    TestLogic.input.pushHistory();
    TestUI.highlightBadWord(TestUI.currentWordElementIndex, !Config.blindMode);
    TestLogic.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestLogic.words.getCurrent());
    Caret.updatePosition();
    TestStats.incrementKeypressCount();
    TestStats.pushKeypressWord(TestLogic.words.currentIndex);
    TestStats.updateLastKeypress();
    if (Config.difficulty == "expert" || Config.difficulty == "master") {
      TestLogic.fail("difficulty");
      return;
    } else if (TestLogic.words.currentIndex == TestLogic.words.length) {
      //submitted last word that is incorrect
      TestLogic.finish();
      return;
    }
    Replay.addReplayEvent("submitErrorWord");
  }

  let wordLength;
  if (Config.mode === "zen") {
    wordLength = TestLogic.input.current.length;
  } else {
    wordLength = TestLogic.words.getCurrent().length;
  }

  let flex = Misc.whorf(Config.minBurstCustomSpeed, wordLength);
  if (
    (Config.minBurst === "fixed" && burst < Config.minBurstCustomSpeed) ||
    (Config.minBurst === "flex" && burst < flex)
  ) {
    TestLogic.fail("min burst");
    return;
  }

  TestLogic.corrected.pushHistory();

  if (
    !Config.showAllLines ||
    Config.mode == "time" ||
    (CustomText.isWordRandom && CustomText.word == 0) ||
    CustomText.isTimeRandom
  ) {
    let currentTop = Math.floor(
      document.querySelectorAll("#words .word")[
        TestUI.currentWordElementIndex - 1
      ].offsetTop
    );
    let nextTop;
    try {
      nextTop = Math.floor(
        document.querySelectorAll("#words .word")[
          TestUI.currentWordElementIndex
        ].offsetTop
      );
    } catch (e) {
      nextTop = 0;
    }

    if (nextTop > currentTop && !TestUI.lineTransition) {
      TestUI.lineJump(currentTop);
    }
  } //end of line wrap

  if (Config.keymapMode === "react") {
    Keymap.flashKey("Space", true);
  }
  if (
    Config.mode === "words" ||
    Config.mode === "custom" ||
    Config.mode === "quote" ||
    Config.mode === "zen"
  ) {
    TimerProgress.update(TestTimer.time);
  }
  if (
    Config.mode == "time" ||
    Config.mode == "words" ||
    Config.mode == "custom" ||
    Config.mode == "quote"
  ) {
    TestLogic.addWord();
  }
}

function isCharCorrect(char, charIndex) {
  if (!correctShiftUsed) return false;

  if (Config.mode == "zen") {
    return true;
  }

  const originalChar = TestLogic.words.getCurrent()[charIndex];

  if (originalChar == char) {
    return true;
  }

  if (Config.language.split("_")[0] == "russian") {
    if ((char === "е" || char === "e") && originalChar == "ё") {
      return true;
    }
    if (char === "ё" && (originalChar == "е" || originalChar === "e")) {
      return true;
    }
  }

  if (char === "’" && originalChar == "'") {
    return true;
  }

  if (char === "'" && originalChar == "’") {
    return true;
  }

  if (
    (char === `’` || char === "'") &&
    (originalChar == `’` || originalChar === "'")
  ) {
    return true;
  }

  if (
    (char === `"` || char === "”" || char == "“" || char === "„") &&
    (originalChar == `"` ||
      originalChar === "”" ||
      originalChar === "“" ||
      originalChar === "„")
  ) {
    return true;
  }

  if (
    (char === "–" || char === "—" || char == "-") &&
    (originalChar == "-" || originalChar === "–" || originalChar === "—")
  ) {
    return true;
  }

  return false;
}

function handleChar(char, charIndex) {
  if (TestUI.resultCalculating || TestUI.resultVisible) {
    return;
  }

  if (char === "\n" && Config.funbox === "58008") {
    char = " ";
  }

  if (char !== "\n" && char !== "\t" && /\s/.test(char)) {
    handleSpace();

    //insert space for expert and master or strict space,
    //or for stop on error set to word,
    //otherwise dont do anything
    if (
      Config.difficulty !== "normal" ||
      Config.strictSpace ||
      Config.stopOnError === "word"
    ) {
      if (dontInsertSpace) {
        dontInsertSpace = false;
        return;
      }
    } else {
      return;
    }
  }

  if (
    Config.mode !== "zen" &&
    TestLogic.words.getCurrent()[charIndex] !== "\n" &&
    char === "\n"
  ) {
    return;
  }

  //start the test
  if (!TestLogic.active && !TestLogic.startTest()) {
    return;
  }

  Focus.set(true);
  Caret.stopAnimation();

  let thisCharCorrect = isCharCorrect(char, charIndex);

  if (thisCharCorrect && Config.mode !== "zen") {
    char = TestLogic.words.getCurrent().charAt(charIndex);
  }

  if (!thisCharCorrect && char === "\n") {
    if (TestLogic.input.current === "") return;
    char = " ";
  }

  if (TestLogic.input.current === "") {
    TestStats.setBurstStart(performance.now());
  }

  const resultingWord =
    TestLogic.input.current.substring(0, charIndex) +
    char +
    TestLogic.input.current.substring(charIndex + 1);

  if (!thisCharCorrect && Misc.trailingComposeChars.test(resultingWord)) {
    TestLogic.input.current = resultingWord;
    setWordsInput(" " + TestLogic.input.current);
    TestUI.updateWordElement();
    Caret.updatePosition();
    return;
  }

  MonkeyPower.addPower(thisCharCorrect);
  TestStats.incrementAccuracy(thisCharCorrect);

  if (!thisCharCorrect) {
    TestStats.incrementKeypressErrors();
    TestStats.pushMissedWord(TestLogic.words.getCurrent());
  }

  WeakSpot.updateScore(
    Config.mode === "zen" ? char : TestLogic.words.getCurrent()[charIndex],
    thisCharCorrect
  );

  if (thisCharCorrect) {
    Sound.playClick(Config.playSoundOnClick);
  } else {
    if (!Config.playSoundOnError || Config.blindMode) {
      Sound.playClick(Config.playSoundOnClick);
    } else {
      Sound.playError(Config.playSoundOnError);
    }
  }

  if (!correctShiftUsed) return;

  //update current corrected version. if its empty then add the current char. if its not then replace the last character with the currently pressed one / add it
  if (TestLogic.corrected.current === "") {
    TestLogic.corrected.current += resultingWord;
  } else {
    if (charIndex >= TestLogic.corrected.current.length) {
      TestLogic.corrected.current += char;
    } else if (!thisCharCorrect) {
      TestLogic.corrected.current =
        TestLogic.corrected.current.substring(0, charIndex) +
        char +
        TestLogic.corrected.current.substring(charIndex + 1);
    }
  }

  TestStats.incrementKeypressCount();
  TestStats.updateLastKeypress();
  TestStats.pushKeypressWord(TestLogic.words.currentIndex);

  if (Config.stopOnError == "letter" && !thisCharCorrect) {
    return;
  }

  Replay.addReplayEvent(
    thisCharCorrect ? "correctLetter" : "incorrectLetter",
    char
  );

  //update the active word top, but only once
  if (
    TestLogic.input.current.length === 1 &&
    TestLogic.words.currentIndex === 0
  ) {
    TestUI.setActiveWordTop(document.querySelector("#words .active").offsetTop);
  }

  //max length of the input is 20 unless in zen mode then its 30
  if (
    (Config.mode === "zen" && charIndex < 30) ||
    (Config.mode !== "zen" &&
      charIndex < TestLogic.words.getCurrent().length + 20)
  ) {
    TestLogic.input.current = resultingWord;
    setWordsInput(" " + TestLogic.input.current);
  }

  if (!thisCharCorrect && Config.difficulty == "master") {
    TestLogic.input.pushHistory();
    TestLogic.corrected.pushHistory();
    TestLogic.fail("difficulty");
    return;
  }

  //keymap
  if (Config.keymapMode === "react") {
    Keymap.flashKey(char, thisCharCorrect);
  }

  if (Config.mode != "zen") {
    //not applicable to zen mode
    //auto stop the test if the last word is correct
    let currentWord = TestLogic.words.getCurrent();
    let lastindex = TestLogic.words.currentIndex;
    if (
      (currentWord == TestLogic.input.current ||
        (Config.quickEnd &&
          currentWord.length == TestLogic.input.current.length &&
          Config.stopOnError == "off")) &&
      lastindex == TestLogic.words.length - 1
    ) {
      TestLogic.input.pushHistory();
      TestLogic.corrected.pushHistory();
      TestLogic.finish();
      return;
    }
  }

  let activeWordTopBeforeJump = document.querySelector("#words .word.active")
    .offsetTop;
  TestUI.updateWordElement();

  if (!Config.hideExtraLetters) {
    let newActiveTop = document.querySelector("#words .word.active").offsetTop;
    //stop the word jump by slicing off the last character, update word again
    if (
      activeWordTopBeforeJump < newActiveTop &&
      !TestUI.lineTransition &&
      TestLogic.input.current.length > 1
    ) {
      if (Config.mode == "zen") {
        let currentTop = Math.floor(
          document.querySelectorAll("#words .word")[
            TestUI.currentWordElementIndex - 1
          ].offsetTop
        );
        if (!Config.showAllLines) TestUI.lineJump(currentTop);
      } else {
        TestLogic.input.current = TestLogic.input.current.slice(0, -1);
        TestUI.updateWordElement();
      }
    }
  }

  //simulate space press in nospace funbox
  if (
    (Config.funbox === "nospace" &&
      TestLogic.input.current.length === TestLogic.words.getCurrent().length) ||
    (char === "\n" && thisCharCorrect)
  ) {
    handleSpace();
  }

  if (char !== "\n") {
    Caret.updatePosition();
  }

  setWordsInput(" " + TestLogic.input.current);
}

function handleTab(event) {
  if (TestUI.resultCalculating) {
    event.preventDefault();
  }
  if (
    !$("#presetWrapper").hasClass("hidden") ||
    !$("#tagsWrapper").hasClass("hidden")
  ) {
    event.preventDefault();
    return;
  }
  if ($("#customTextPopup .textarea").is(":focus")) {
    event.preventDefault();

    let area = $("#customTextPopup .textarea")[0];

    var start = area.selectionStart;
    var end = area.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    area.value =
      area.value.substring(0, start) + "\t" + area.value.substring(end);

    // put caret at right position again
    area.selectionStart = area.selectionEnd = start + 1;

    return;
  } else if (
    !TestUI.resultCalculating &&
    $("#commandLineWrapper").hasClass("hidden") &&
    $("#simplePopupWrapper").hasClass("hidden") &&
    !$(".page.pageLogin").hasClass("active")
  ) {
    if ($(".pageTest").hasClass("active")) {
      if (Config.quickTab) {
        if (
          TestUI.resultVisible ||
          !(
            (Config.mode == "zen" && !event.shiftKey) ||
            (TestLogic.hasTab && !event.shiftKey)
          )
        ) {
          if (event.shiftKey) {
            ManualRestart.set();
          } else {
            ManualRestart.reset();
          }
          event.preventDefault();
          if (
            TestLogic.active &&
            Config.repeatQuotes === "typing" &&
            Config.mode === "quote"
          ) {
            TestLogic.restart(true, false, event);
          } else {
            TestLogic.restart(false, false, event);
          }
        } else {
          event.preventDefault();
          handleChar("\t", TestLogic.input.current.length);
        }
      } else if (!TestUI.resultVisible) {
        if (
          (TestLogic.hasTab && event.shiftKey) ||
          (!TestLogic.hasTab && Config.mode !== "zen") ||
          (Config.mode === "zen" && event.shiftKey)
        ) {
          event.preventDefault();
          $("#restartTestButton").focus();
        } else {
          event.preventDefault();
          handleChar("\t", TestLogic.input.current.length);
        }
      }
    } else if (Config.quickTab) {
      UI.changePage("test");
    }
  }
}

$(document).keydown((event) => {
  //autofocus
  const wordsFocused = $("#wordsInput").is(":focus");
  const pageTestActive = !$(".pageTest").hasClass("hidden");
  const commandLineVisible = !$("#commandLineWrapper").hasClass("hidden");
  const leaderboardsVisible = !$("#leaderboardsWrapper").hasClass("hidden");
  const modePopupVisible =
    !$("#customTextPopupWrapper").hasClass("hidden") ||
    !$("#customWordAmountPopupWrapper").hasClass("hidden") ||
    !$("#customTestDurationPopupWrapper").hasClass("hidden") ||
    !$("#quoteSearchPopupWrapper").hasClass("hidden") ||
    !$("#wordFilterPopupWrapper").hasClass("hidden");

  const allowTyping =
    pageTestActive &&
    !commandLineVisible &&
    !leaderboardsVisible &&
    !modePopupVisible &&
    !TestUI.resultVisible &&
    (wordsFocused || event.key !== "Enter");

  if (allowTyping && !wordsFocused) {
    TestUI.focusWords();
    if (Config.showOutOfFocusWarning) {
      event.preventDefault();
    }
  }

  //tab
  if (
    (event.key == "Tab" && !Config.swapEscAndTab) ||
    (event.key == "Escape" && Config.swapEscAndTab)
  ) {
    handleTab(event);
  }

  if (!allowTyping) return;

  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.preventDefault();
    return;
  }

  TestStats.recordKeypressSpacing();
  TestStats.setKeypressDuration(performance.now());
  TestStats.setKeypressNotAfk();

  //blocking firefox from going back in history with backspace
  if (event.key === "Backspace") {
    Sound.playClick(Config.playSoundOnClick);
    let t = /INPUT|SELECT|TEXTAREA/i;
    if (
      !t.test(event.target.tagName) ||
      event.target.disabled ||
      event.target.readOnly
    ) {
      event.preventDefault();
    }
  }

  Monkey.type();

  if (event.key === "Backspace" && TestLogic.input.current.length === 0) {
    backspaceToPrevious();
    if (TestLogic.input.current)
      setWordsInput(" " + TestLogic.input.current + " ");
  }

  if (event.key === "Enter") {
    if (event.shiftKey && Config.mode == "zen") {
      TestLogic.finish();
    } else if (
      event.shiftKey &&
      ((Config.mode == "time" && Config.time === 0) ||
        (Config.mode == "words" && Config.words === 0))
    ) {
      TestLogic.setBailout(true);
      TestLogic.finish();
    } else {
      handleChar("\n", TestLogic.input.current.length);
    }
  }

  //show dead keys
  if (
    event.key === "Dead" &&
    !Misc.trailingComposeChars.test(TestLogic.input.current)
  ) {
    Sound.playClick(Config.playSoundOnClick);
    $(
      document.querySelector("#words .word.active").querySelectorAll("letter")[
        TestLogic.input.current.length
      ]
    ).toggleClass("dead");
  }

  if (Config.oppositeShiftMode === "on") {
    correctShiftUsed = ShiftTracker.isUsingOppositeShift(event) !== false;
  }

  if (Config.layout !== "default") {
    const char = LayoutEmulator.getCharFromEvent(event);
    if (char !== null) {
      event.preventDefault();
      handleChar(char, TestLogic.input.current.length);
    }

    if (Config.keymapMode === "next" && Config.mode !== "zen") {
      Keymap.highlightKey(
        TestLogic.words
          .getCurrent()
          .charAt(TestLogic.input.current.length)
          .toString()
          .toUpperCase()
      );
    }
  }
});

$("#wordsInput").keyup((event) => {
  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.preventDefault();
    return;
  }

  if (TestUI.resultVisible) return;
  let now = performance.now();
  if (TestStats.keypressTimings.duration.current !== -1) {
    let diff = Math.abs(TestStats.keypressTimings.duration.current - now);
    TestStats.pushKeypressDuration(diff);
  }
  TestStats.setKeypressDuration(now);
  Monkey.stop();
});

$("#wordsInput").on("beforeinput", (event) => {
  if (!event.originalEvent?.isTrusted) return;
  if (event.target.value === "") {
    event.target.value = " ";
  }
});

$("#wordsInput").on("input", (event) => {
  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.target.value = " ";
    return;
  }

  TestStats.setKeypressNotAfk();

  const realInputValue = event.target.value.normalize();
  const inputValue = realInputValue.slice(1);

  if (realInputValue.length === 0 && TestLogic.input.current.length === 0) {
    // fallback for when no Backspace keydown event (mobile)
    backspaceToPrevious();
  } else if (inputValue.length < TestLogic.input.current.length) {
    TestLogic.input.current = inputValue;
    TestUI.updateWordElement();
    Caret.updatePosition();
    if (!Misc.trailingComposeChars.test(TestLogic.input.current)) {
      Replay.addReplayEvent("setLetterIndex", TestLogic.input.current.length);
    }
  } else if (inputValue !== TestLogic.input.current) {
    let diffStart = 0;
    while (inputValue[diffStart] === TestLogic.input.current[diffStart])
      diffStart++;

    for (let i = diffStart; i < inputValue.length; i++) {
      handleChar(inputValue[i], i);
    }
  }

  setWordsInput(" " + TestLogic.input.current);

  let acc = Misc.roundTo2(TestStats.calculateAccuracy());
  LiveAcc.update(acc);

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestLogic.words
        .getCurrent()
        .charAt(TestLogic.input.current.length)
        .toString()
        .toUpperCase()
    );
  }

  // force caret at end of input
  // doing it on next cycle because Chromium on Android won't let me edit
  // the selection inside the input event
  setTimeout(() => {
    if (
      event.target.selectionStart !== event.target.value.length &&
      (!Misc.trailingComposeChars.test(event.target.value) ||
        event.target.selectionStart <
          event.target.value.search(Misc.trailingComposeChars))
    ) {
      event.target.selectionStart = event.target.selectionEnd =
        event.target.value.length;
    }
  }, 0);
});

$("#wordsInput").focus((event) => {
  event.target.selectionStart = event.target.selectionEnd =
    event.target.value.length;
});

$("#wordsInput").on("copy paste", (event) => {
  event.preventDefault();
});
