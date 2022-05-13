import * as TestLogic from "../test/test-logic";
import * as TestUI from "../test/test-ui";
import * as TestStats from "../test/test-stats";
import * as Monkey from "../test/monkey";
import Config, * as UpdateConfig from "../config";
import * as Keymap from "../elements/keymap";
import * as Misc from "../utils/misc";
import * as LiveAcc from "../test/live-acc";
import * as LiveBurst from "../test/live-burst";
import * as Funbox from "../test/funbox";
import * as Sound from "./sound-controller";
import * as Caret from "../test/caret";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as Notifications from "../elements/notifications";
import * as CustomText from "../test/custom-text";
import * as PageController from "./page-controller";
import * as Settings from "../pages/settings";
import * as LayoutEmulator from "../test/layout-emulator";
import * as PaceCaret from "../test/pace-caret";
import * as TimerProgress from "../test/timer-progress";
import * as Focus from "../test/focus";
import * as ShiftTracker from "../test/shift-tracker";
import * as Replay from "../test/replay";
import * as MonkeyPower from "../elements/monkey-power";
import * as WeakSpot from "../test/weak-spot";
import * as Leaderboards from "../elements/leaderboards";
import * as ActivePage from "../states/active-page";
import * as TestActive from "../states/test-active";
import * as TestInput from "../test/test-input";
import * as TestWords from "../test/test-words";

let dontInsertSpace = false;
let correctShiftUsed = true;

const wordsInput = document.getElementById("wordsInput") as HTMLInputElement;

function setWordsInput(value: string): void {
  // Only change #wordsInput if it's not already the wanted value
  // Avoids Safari triggering unneeded events, causing issues with
  // dead keys.
  // console.log("settings words input to " + value);
  if (value !== wordsInput.value) {
    wordsInput.value = value;
  }
}

function updateUI(): void {
  const acc = Misc.roundTo2(TestStats.calculateAccuracy());
  if (!isNaN(acc)) LiveAcc.update(acc);

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    Keymap.highlightKey(
      TestWords.words
        .getCurrent()
        .charAt(TestInput.input.current.length)
        .toString()
    );
  }
}

function backspaceToPrevious(): void {
  if (!TestActive.get()) return;

  if (
    TestInput.input.history.length == 0 ||
    TestUI.currentWordElementIndex == 0
  ) {
    return;
  }

  if (
    (TestInput.input.history[TestWords.words.currentIndex - 1] ==
      TestWords.words.get(TestWords.words.currentIndex - 1) &&
      !Config.freedomMode) ||
    $($(".word")[TestWords.words.currentIndex - 1]).hasClass("hidden")
  ) {
    return;
  }

  if (Config.confidenceMode === "on" || Config.confidenceMode === "max") {
    return;
  }

  TestInput.input.current = TestInput.input.popHistory();
  TestInput.corrected.popHistory();
  if (Config.funbox === "nospace" || Config.funbox === "arrows") {
    TestInput.input.current = TestInput.input.current.slice(0, -1);
  }
  TestWords.words.decreaseCurrentIndex();
  TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex - 1);
  TestUI.updateActiveElement(true);
  Funbox.toggleScript(TestWords.words.getCurrent());
  TestUI.updateWordElement();

  Caret.updatePosition();
  Replay.addReplayEvent("backWord");
}

function handleSpace(): void {
  if (!TestActive.get()) return;

  if (TestInput.input.current === "") return;

  if (Config.mode == "zen") {
    $("#words .word.active").removeClass("active");
    $("#words").append("<div class='word active'></div>");
  }

  const currentWord = TestWords.words.getCurrent();
  if (Config.funbox === "layoutfluid" && Config.mode !== "time") {
    // here I need to check if Config.customLayoutFluid exists because of my scuffed solution of returning whenever value is undefined in the setCustomLayoutfluid function
    const layouts = Config.customLayoutfluid
      ? Config.customLayoutfluid.split("#")
      : ["qwerty", "dvorak", "colemak"];
    let index = 0;
    const outof = TestWords.words.length;
    index = Math.floor(
      (TestInput.input.history.length + 1) / (outof / layouts.length)
    );
    if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
      Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
    }
    UpdateConfig.setLayout(layouts[index]);
    UpdateConfig.setKeymapLayout(layouts[index]);
    Keymap.highlightKey(
      TestWords.words
        .getCurrent()
        .charAt(TestInput.input.current.length)
        .toString()
    );
    Settings.groups["layout"]?.updateInput();
  }
  dontInsertSpace = true;

  const burst = TestStats.calculateBurst();
  LiveBurst.update(Math.round(burst));
  TestInput.pushBurstToHistory(burst);

  //correct word or in zen mode
  const isWordCorrect =
    currentWord == TestInput.input.current || Config.mode == "zen";
  MonkeyPower.addPower(isWordCorrect, true);
  TestInput.incrementAccuracy(isWordCorrect);
  if (isWordCorrect) {
    PaceCaret.handleSpace(true, currentWord);
    TestInput.input.pushHistory();
    TestWords.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestWords.words.getCurrent());
    Caret.updatePosition();
    TestInput.incrementKeypressCount();
    TestInput.pushKeypressWord(TestWords.words.currentIndex);
    if (Config.funbox !== "nospace" && Config.funbox !== "arrows") {
      Sound.playClick();
    }
    Replay.addReplayEvent("submitCorrectWord");
  } else {
    if (Config.funbox !== "nospace" && Config.funbox !== "arrows") {
      if (!Config.playSoundOnError || Config.blindMode) {
        Sound.playClick();
      } else {
        Sound.playError();
      }
    }
    TestInput.pushMissedWord(TestWords.words.getCurrent());
    TestInput.incrementKeypressErrors();
    const cil = TestInput.input.current.length;
    if (cil <= TestWords.words.getCurrent().length) {
      if (cil >= TestInput.corrected.current.length) {
        TestInput.corrected.current += "_";
      } else {
        TestInput.corrected.current =
          TestInput.corrected.current.substring(0, cil) +
          "_" +
          TestInput.corrected.current.substring(cil + 1);
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
    if (Config.blindMode && Config.highlightMode !== "off") {
      $("#words .word.active letter").addClass("correct");
    }
    TestInput.input.pushHistory();
    TestUI.highlightBadWord(TestUI.currentWordElementIndex, !Config.blindMode);
    TestWords.words.increaseCurrentIndex();
    TestUI.setCurrentWordElementIndex(TestUI.currentWordElementIndex + 1);
    TestUI.updateActiveElement();
    Funbox.toggleScript(TestWords.words.getCurrent());
    Caret.updatePosition();
    TestInput.incrementKeypressCount();
    TestInput.pushKeypressWord(TestWords.words.currentIndex);
    TestInput.updateLastKeypress();
    if (Config.difficulty == "expert" || Config.difficulty == "master") {
      TestLogic.fail("difficulty");
      return;
    } else if (TestWords.words.currentIndex == TestWords.words.length) {
      //submitted last word that is incorrect
      TestLogic.finish();
      return;
    }
    Replay.addReplayEvent("submitErrorWord");
  }

  let wordLength;
  if (Config.mode === "zen") {
    wordLength = TestInput.input.current.length;
  } else {
    wordLength = TestWords.words.getCurrent().length;
  }

  const flex = Misc.whorf(Config.minBurstCustomSpeed, wordLength);
  if (
    (Config.minBurst === "fixed" && burst < Config.minBurstCustomSpeed) ||
    (Config.minBurst === "flex" && burst < flex)
  ) {
    TestLogic.fail("min burst");
    return;
  }

  TestInput.corrected.pushHistory();

  if (
    !Config.showAllLines ||
    Config.mode == "time" ||
    (CustomText.isWordRandom && CustomText.word == 0) ||
    CustomText.isTimeRandom
  ) {
    const currentTop = Math.floor(
      document.querySelectorAll<HTMLElement>("#words .word")[
        TestUI.currentWordElementIndex - 1
      ].offsetTop
    );
    let nextTop;
    try {
      nextTop = Math.floor(
        document.querySelectorAll<HTMLElement>("#words .word")[
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
    Keymap.flashKey(" ", true);
  }
  if (
    Config.mode === "words" ||
    Config.mode === "custom" ||
    Config.mode === "quote" ||
    Config.mode === "zen"
  ) {
    TimerProgress.update();
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

function isCharCorrect(char: string, charIndex: number): boolean {
  if (!correctShiftUsed) return false;

  if (Config.mode == "zen") {
    return true;
  }

  const originalChar = TestWords.words.getCurrent()[charIndex];

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

  if (Config.funbox === "arrows") {
    if ((char === "w" || char === "ArrowUp") && originalChar == "↑") {
      return true;
    }
    if ((char === "s" || char === "ArrowDown") && originalChar == "↓") {
      return true;
    }
    if ((char === "a" || char === "ArrowLeft") && originalChar == "←") {
      return true;
    }
    if ((char === "d" || char === "ArrowRight") && originalChar == "→") {
      return true;
    }
  }

  if (
    (char === `’` || char === "‘" || char === "'") &&
    (originalChar == `’` || originalChar === "‘" || originalChar === "'")
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

function handleChar(char: string, charIndex: number): void {
  if (TestUI.resultCalculating || TestUI.resultVisible) {
    return;
  }

  if (char === "…") {
    for (let i = 0; i < 3; i++) {
      handleChar(".", charIndex + i);
    }

    return;
  }

  if (char === "\n" && Config.funbox === "58008") {
    char = " ";
  }

  if (char !== "\n" && char !== "\t" && /\s/.test(char)) {
    if (Config.funbox === "nospace" || Config.funbox === "arrows") return;
    handleSpace();

    //insert space for expert and master or strict space,
    //or for stop on error set to word,
    //otherwise dont do anything
    if (
      Config.difficulty !== "normal" ||
      (Config.strictSpace && Config.mode !== "zen") ||
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
    TestWords.words.getCurrent()[charIndex] !== "\n" &&
    char === "\n"
  ) {
    return;
  }

  //start the test
  if (!TestActive.get() && !TestLogic.startTest()) {
    return;
  }

  Focus.set(true);
  Caret.stopAnimation();

  const thisCharCorrect = isCharCorrect(char, charIndex);

  if (thisCharCorrect && Config.mode !== "zen") {
    char = TestWords.words.getCurrent().charAt(charIndex);
  }

  if (!thisCharCorrect && char === "\n") {
    if (TestInput.input.current === "") return;
    char = " ";
  }

  if (TestInput.input.current === "") {
    TestInput.setBurstStart(performance.now());
  }

  const resultingWord =
    TestInput.input.current.substring(0, charIndex) +
    char +
    TestInput.input.current.substring(charIndex + 1);

  if (!thisCharCorrect && Misc.trailingComposeChars.test(resultingWord)) {
    TestInput.input.current = resultingWord;
    TestUI.updateWordElement();
    Caret.updatePosition();
    return;
  }

  MonkeyPower.addPower(thisCharCorrect);
  TestInput.incrementAccuracy(thisCharCorrect);

  if (!thisCharCorrect) {
    TestInput.incrementKeypressErrors();
    TestInput.pushMissedWord(TestWords.words.getCurrent());
  }

  WeakSpot.updateScore(
    Config.mode === "zen" ? char : TestWords.words.getCurrent()[charIndex],
    thisCharCorrect
  );

  if (thisCharCorrect) {
    Sound.playClick();
  } else {
    if (!Config.playSoundOnError || Config.blindMode) {
      Sound.playClick();
    } else {
      Sound.playError();
    }
  }

  if (!correctShiftUsed && Config.difficulty != "master") return;

  //update current corrected version. if its empty then add the current char. if its not then replace the last character with the currently pressed one / add it
  if (TestInput.corrected.current === "") {
    TestInput.corrected.current += resultingWord;
  } else {
    if (charIndex >= TestInput.corrected.current.length) {
      TestInput.corrected.current += char;
    } else if (!thisCharCorrect) {
      TestInput.corrected.current =
        TestInput.corrected.current.substring(0, charIndex) +
        char +
        TestInput.corrected.current.substring(charIndex + 1);
    }
  }

  TestInput.incrementKeypressCount();
  TestInput.updateLastKeypress();
  TestInput.pushKeypressWord(TestWords.words.currentIndex);

  if (
    Config.difficulty !== "master" &&
    Config.stopOnError == "letter" &&
    !thisCharCorrect
  ) {
    return;
  }

  Replay.addReplayEvent(
    thisCharCorrect ? "correctLetter" : "incorrectLetter",
    char
  );

  //update the active word top, but only once
  if (
    TestInput.input.current.length === 1 &&
    TestWords.words.currentIndex === 0
  ) {
    TestUI.setActiveWordTop(
      (<HTMLElement>document.querySelector("#words .active"))?.offsetTop
    );
  }

  //max length of the input is 20 unless in zen mode then its 30
  if (
    (Config.mode === "zen" && charIndex < 30) ||
    (Config.mode !== "zen" &&
      charIndex < TestWords.words.getCurrent().length + 20)
  ) {
    TestInput.input.current = resultingWord;
  }

  if (!thisCharCorrect && Config.difficulty == "master") {
    TestInput.input.pushHistory();
    TestInput.corrected.pushHistory();
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
    const currentWord = TestWords.words.getCurrent();
    const lastindex = TestWords.words.currentIndex;
    if (
      (currentWord == TestInput.input.current ||
        (Config.quickEnd &&
          currentWord.length == TestInput.input.current.length &&
          Config.stopOnError == "off")) &&
      lastindex == TestWords.words.length - 1
    ) {
      TestInput.input.pushHistory();
      TestInput.corrected.pushHistory();
      TestLogic.finish();
      return;
    }
  }

  const activeWordTopBeforeJump = document.querySelector<HTMLElement>(
    "#words .word.active"
  )?.offsetTop as number;
  TestUI.updateWordElement();

  if (!Config.hideExtraLetters) {
    const newActiveTop = document.querySelector<HTMLElement>(
      "#words .word.active"
    )?.offsetTop as number;
    //stop the word jump by slicing off the last character, update word again
    if (
      activeWordTopBeforeJump < newActiveTop &&
      !TestUI.lineTransition &&
      TestInput.input.current.length > 1
    ) {
      if (Config.mode == "zen") {
        const currentTop = Math.floor(
          document.querySelectorAll<HTMLElement>("#words .word")[
            TestUI.currentWordElementIndex - 1
          ]?.offsetTop
        ) as number;
        if (!Config.showAllLines) TestUI.lineJump(currentTop);
      } else {
        TestInput.input.current = TestInput.input.current.slice(0, -1);
        TestUI.updateWordElement();
      }
    }
  }

  //simulate space press in nospace funbox
  if (
    ((Config.funbox === "nospace" || Config.funbox === "arrows") &&
      TestInput.input.current.length === TestWords.words.getCurrent().length) ||
    (char === "\n" && thisCharCorrect)
  ) {
    handleSpace();
  }

  if (char !== "\n") {
    Caret.updatePosition();
  }
}

function handleTab(event: JQuery.KeyDownEvent, popupVisible: boolean): void {
  //todo refactor this mess
  if (TestUI.resultCalculating) {
    event.preventDefault();
  }
  if (ActivePage.get() !== "test" && popupVisible) {
    // event.preventDefault();
    return;
  }
  if ($("#customTextPopup .textarea").is(":focus")) {
    event.preventDefault();

    const area = $("#customTextPopup .textarea")[0] as HTMLTextAreaElement;

    const start = area.selectionStart;
    const end = area.selectionEnd;

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
    $("#quoteSubmitPopupWrapper").hasClass("hidden") &&
    ActivePage.get() != "login"
  ) {
    if (ActivePage.get() == "test") {
      if (Config.quickTab) {
        if (!$("#leaderboardsWrapper").hasClass("hidden")) {
          Leaderboards.hide();
        }
        if (popupVisible) {
          event.preventDefault();
          return;
        }
        if (
          TestUI.resultVisible ||
          !(
            (Config.mode == "zen" && !event.shiftKey) ||
            (TestWords.hasTab && !event.shiftKey)
          )
        ) {
          if (event.shiftKey) {
            ManualRestart.set();
          } else {
            ManualRestart.reset();
          }
          event.preventDefault();
          if (
            TestActive.get() &&
            Config.repeatQuotes === "typing" &&
            Config.mode === "quote"
          ) {
            TestLogic.restart(true, false, event);
          } else {
            TestLogic.restart(false, false, event);
          }
        } else {
          event.preventDefault();
          handleChar("\t", TestInput.input.current.length);
          setWordsInput(" " + TestInput.input.current);
        }
      } else if (!TestUI.resultVisible) {
        if (
          (TestWords.hasTab && event.shiftKey) ||
          (!TestWords.hasTab && Config.mode !== "zen") ||
          (Config.mode === "zen" && event.shiftKey)
        ) {
          event.preventDefault();
          $("#restartTestButton").trigger("focus");
        } else {
          event.preventDefault();
          handleChar("\t", TestInput.input.current.length);
          setWordsInput(" " + TestInput.input.current);
        }
      }
    } else if (Config.quickTab) {
      event.preventDefault();
      PageController.change("test");
    }
  }
}

$(document).keydown(async (event) => {
  if (ActivePage.get() == "loading") return event.preventDefault();

  //autofocus
  const wordsFocused = $("#wordsInput").is(":focus");
  const pageTestActive = ActivePage.get() === "test";
  const commandLineVisible = !$("#commandLineWrapper").hasClass("hidden");
  const leaderboardsVisible = !$("#leaderboardsWrapper").hasClass("hidden");

  const popupVisible = Misc.isAnyPopupVisible();

  const allowTyping =
    pageTestActive &&
    !commandLineVisible &&
    !leaderboardsVisible &&
    !popupVisible &&
    !TestUI.resultVisible &&
    (wordsFocused || event.key !== "Enter");

  if (allowTyping && !wordsFocused && event.key !== "Enter") {
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
    handleTab(event, popupVisible);
  }

  if (!allowTyping) return;

  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.preventDefault();
    return;
  }

  if (TestInput.spacingDebug) {
    console.log(
      "spacing debug",
      "keypress",
      event.key,
      "length",
      TestInput.keypressTimings.spacing.array.length
    );
  }
  TestInput.recordKeypressSpacing();
  TestInput.setKeypressDuration(performance.now());
  TestInput.setKeypressNotAfk();

  //blocking firefox from going back in history with backspace
  if (event.key === "Backspace") {
    Sound.playClick();
    const t = /INPUT|SELECT|TEXTAREA/i;
    if (
      !t.test((event.target as unknown as Element).tagName)
      // if this breaks in the future, call mio and tell him to stop being lazy
      // (event.target as unknown as KeyboardEvent).disabled ||
      // (event.target as unknown as Element).readOnly
    ) {
      event.preventDefault();
    }

    if (Config.confidenceMode === "max") {
      event.preventDefault();
      return;
    }
  }

  if (Config.funbox !== "arrows" && /Arrow/i.test(event.key)) {
    event.preventDefault();
    return;
  }

  Monkey.type();

  if (event.key === "Backspace" && TestInput.input.current.length === 0) {
    backspaceToPrevious();
    if (TestInput.input.current) {
      setWordsInput(" " + TestInput.input.current + " ");
    }
  }

  if (event.key === "Enter") {
    if (event.shiftKey && Config.mode == "zen") {
      TestLogic.finish();
    } else if (
      event.shiftKey &&
      ((Config.mode == "time" && Config.time === 0) ||
        (Config.mode == "words" && Config.words === 0))
    ) {
      TestInput.setBailout(true);
      TestLogic.finish();
    } else {
      handleChar("\n", TestInput.input.current.length);
      setWordsInput(" " + TestInput.input.current);
    }
  }

  //show dead keys
  if (
    event.key === "Dead" &&
    !Misc.trailingComposeChars.test(TestInput.input.current)
  ) {
    Sound.playClick();
    const word = document.querySelector<HTMLElement>("#words .word.active");
    const len = TestInput.input.current.length; // have to do this because prettier wraps the line and causes an error
    word?.querySelectorAll("letter")[len].classList.toggle("dead");
  }

  if (Config.oppositeShiftMode !== "off") {
    correctShiftUsed =
      (await ShiftTracker.isUsingOppositeShift(event)) !== false;
  }

  if (Config.funbox === "arrows") {
    let char = event.key;
    if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(char)) {
      if (char === "ArrowLeft") char = "a";
      if (char === "ArrowRight") char = "d";
      if (char === "ArrowDown") char = "s";
      if (char === "ArrowUp") char = "w";
      event.preventDefault();
      handleChar(char, TestInput.input.current.length);
      updateUI();
      setWordsInput(" " + TestInput.input.current);
    }
  } else if (
    Config.layout !== "default" &&
    !(
      event.ctrlKey ||
      (event.altKey && window.navigator.platform.search("Linux") > -1)
    )
  ) {
    const char = await LayoutEmulator.getCharFromEvent(event);
    if (char !== null) {
      event.preventDefault();
      handleChar(char, TestInput.input.current.length);
      updateUI();
      setWordsInput(" " + TestInput.input.current);
    }
    if (Config.tapeMode !== "off") {
      TestUI.scrollTape();
    }
  }
});

$("#wordsInput").keyup((event) => {
  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.preventDefault();
    return;
  }

  if (TestUI.resultVisible) return;
  const now = performance.now();
  if (TestInput.keypressTimings.duration.current !== -1) {
    const diff = Math.abs(TestInput.keypressTimings.duration.current - now);
    TestInput.pushKeypressDuration(diff);
  }
  TestInput.setKeypressDuration(now);
  Monkey.stop();
});

$("#wordsInput").on("beforeinput", (event) => {
  if (!event.originalEvent?.isTrusted) return;
  if ((event.target as HTMLInputElement).value === "") {
    (event.target as HTMLInputElement).value = " ";
  }
});

$("#wordsInput").on("input", (event) => {
  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    (event.target as HTMLInputElement).value = " ";
    return;
  }

  const popupVisible = Misc.isAnyPopupVisible();

  if (popupVisible) return;

  TestInput.setKeypressNotAfk();

  const realInputValue = (event.target as HTMLInputElement).value.normalize();
  const inputValue = realInputValue.slice(1);

  // input will be modified even with the preventDefault() in
  // beforeinput/keydown if it's part of a compose sequence. this undoes
  // the effects of that and takes the input out of compose mode.
  if (
    Config.layout !== "default" &&
    inputValue.length >= TestInput.input.current.length
  ) {
    setWordsInput(" " + TestInput.input.current);
    return;
  }

  if (realInputValue.length === 0 && TestInput.input.current.length === 0) {
    // fallback for when no Backspace keydown event (mobile)
    backspaceToPrevious();
  } else if (inputValue.length < TestInput.input.current.length) {
    TestInput.input.current = inputValue;
    TestUI.updateWordElement();
    Caret.updatePosition();
    if (!Misc.trailingComposeChars.test(TestInput.input.current)) {
      Replay.addReplayEvent("setLetterIndex", TestInput.input.current.length);
    }
  } else if (inputValue !== TestInput.input.current) {
    let diffStart = 0;
    while (inputValue[diffStart] === TestInput.input.current[diffStart]) {
      diffStart++;
    }

    for (let i = diffStart; i < inputValue.length; i++) {
      handleChar(inputValue[i], i);
    }
  }

  setWordsInput(" " + TestInput.input.current);
  updateUI();
  if (Config.tapeMode !== "off") {
    TestUI.scrollTape();
  }

  // force caret at end of input
  // doing it on next cycle because Chromium on Android won't let me edit
  // the selection inside the input event
  setTimeout(() => {
    if (
      (event.target as HTMLInputElement).selectionStart !==
        (event.target as HTMLInputElement).value.length &&
      (!Misc.trailingComposeChars.test(
        (event.target as HTMLInputElement).value
      ) ||
        ((event.target as HTMLInputElement).selectionStart ?? 0) <
          (event.target as HTMLInputElement).value.search(
            Misc.trailingComposeChars
          ))
    ) {
      (event.target as HTMLInputElement).selectionStart = (
        event.target as HTMLInputElement
      ).selectionEnd = (event.target as HTMLInputElement).value.length;
    }
  }, 0);
});

$("#wordsInput").on("focus", (event) => {
  (event.target as HTMLInputElement).selectionStart = (
    event.target as HTMLInputElement
  ).selectionEnd = (event.target as HTMLInputElement).value.length;
});

$("#wordsInput").on("copy paste", (event) => {
  event.preventDefault();
});
