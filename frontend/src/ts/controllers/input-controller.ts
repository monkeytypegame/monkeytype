import * as TestLogic from "../test/test-logic";
import * as TestUI from "../test/test-ui";
import * as TestStats from "../test/test-stats";
import * as Monkey from "../test/monkey";
import Config from "../config";
import * as Misc from "../utils/misc";
import * as LiveAcc from "../test/live-acc";
import * as LiveBurst from "../test/live-burst";
import * as Funbox from "../test/funbox/funbox";
import * as Sound from "./sound-controller";
import * as Caret from "../test/caret";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomText from "../test/custom-text";
import * as LayoutEmulator from "../test/layout-emulator";
import * as PaceCaret from "../test/pace-caret";
import * as TimerProgress from "../test/timer-progress";
import * as Focus from "../test/focus";
import * as ShiftTracker from "../test/shift-tracker";
import * as Replay from "../test/replay";
import * as MonkeyPower from "../elements/monkey-power";
import * as WeakSpot from "../test/weak-spot";
import * as ActivePage from "../states/active-page";
import * as TestActive from "../states/test-active";
import * as CompositionState from "../states/composition";
import * as TestInput from "../test/test-input";
import * as TestWords from "../test/test-words";
import * as Hangul from "hangul-js";
import * as CustomTextState from "../states/custom-text-name";
import { navigate } from "../observables/navigate-event";
import * as FunboxList from "../test/funbox/funbox-list";
import * as Settings from "../pages/settings";
import * as KeymapEvent from "../observables/keymap-event";
import { IgnoredKeys } from "../constants/ignored-keys";
import { ModifierKeys } from "../constants/modifier-keys";

let dontInsertSpace = false;
let correctShiftUsed = true;
let isKoCompiling = false;
let isBackspace: boolean;

const wordsInput = document.getElementById("wordsInput") as HTMLInputElement;
const koInputVisual = document.getElementById("koInputVisual") as HTMLElement;

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
  const acc: number = Misc.roundTo2(TestStats.calculateAccuracy());
  if (!isNaN(acc)) LiveAcc.update(acc);

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    if (!Config.language.startsWith("korean")) {
      KeymapEvent.highlight(
        TestWords.words
          .getCurrent()
          .charAt(TestInput.input.current.length)
          .toString()
      );
    } else {
      //word [가다]
      //Get the current korean word and group it [[ㄱ,ㅏ],[ㄷ,ㅏ]].
      const koCurrWord: string[][] = Hangul.disassemble(
        TestWords.words.getCurrent(),
        true
      );
      const koCurrInput: string[][] = Hangul.disassemble(
        TestInput.input.current,
        true
      );
      const inputGroupLength: number = koCurrInput.length - 1;
      if (koCurrInput[inputGroupLength]) {
        const inputCharLength: number = koCurrInput[inputGroupLength].length;
        //at the end of the word, it will throw a (reading '0') this will be the space
        try {
          //if it overflows and returns undefined (e.g input [ㄱ,ㅏ,ㄷ]),
          //take the difference between the overflow and the word
          const koChar: string =
            koCurrWord[inputGroupLength][inputCharLength] ??
            koCurrWord[koCurrInput.length][
              inputCharLength - koCurrWord[inputGroupLength].length
            ];

          KeymapEvent.highlight(koChar);
        } catch (e) {
          KeymapEvent.highlight("");
        }
      } else {
        //for new words
        KeymapEvent.highlight(koCurrWord[0][0]);
      }
    }
  }
}

function backspaceToPrevious(): void {
  if (!TestActive.get()) return;

  if (
    TestInput.input.history.length === 0 ||
    TestUI.currentWordElementIndex === 0
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
  if (
    FunboxList.get(Config.funbox).find((f) => f.properties?.includes("nospace"))
  ) {
    TestInput.input.current = TestInput.input.current.slice(0, -1);
    setWordsInput(" " + TestInput.input.current + " ");
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

  const currentWord: string = TestWords.words.getCurrent();

  for (const f of FunboxList.get(Config.funbox)) {
    if (f.functions?.handleSpace) {
      f.functions.handleSpace();
    }
  }
  Settings.groups["layout"]?.updateInput();

  dontInsertSpace = true;

  const burst: number = TestStats.calculateBurst();
  LiveBurst.update(Math.round(burst));
  TestInput.pushBurstToHistory(burst);

  const nospace =
    FunboxList.get(Config.funbox).find((f) =>
      f.properties?.includes("nospace")
    ) !== undefined;

  //correct word or in zen mode
  const isWordCorrect: boolean =
    currentWord === TestInput.input.current || Config.mode == "zen";
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
    if (!nospace) {
      Sound.playClick();
    }
    Replay.addReplayEvent("submitCorrectWord");
  } else {
    if (!nospace) {
      if (!Config.playSoundOnError || Config.blindMode) {
        Sound.playClick();
      } else {
        Sound.playError();
      }
    }
    TestInput.pushMissedWord(TestWords.words.getCurrent());
    TestInput.incrementKeypressErrors();
    const cil: number = TestInput.input.current.length;
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
    } else if (TestWords.words.currentIndex === TestWords.words.length) {
      //submitted last word that is incorrect
      TestLogic.finish();
      return;
    }
    Replay.addReplayEvent("submitErrorWord");
  }

  let wordLength: number;
  if (Config.mode === "zen") {
    wordLength = TestInput.input.current.length;
  } else {
    wordLength = TestWords.words.getCurrent().length;
  }

  const flex: number = Misc.whorf(Config.minBurstCustomSpeed, wordLength);
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
    (CustomText.isWordRandom && CustomText.word === 0) ||
    CustomText.isTimeRandom
  ) {
    const currentTop: number = Math.floor(
      document.querySelectorAll<HTMLElement>("#words .word")[
        TestUI.currentWordElementIndex - 1
      ].offsetTop
    );
    let nextTop: number;
    try {
      nextTop = Math.floor(
        document.querySelectorAll<HTMLElement>("#words .word")[
          TestUI.currentWordElementIndex
        ].offsetTop
      );
    } catch (e) {
      nextTop = 0;
    }

    if (nextTop > currentTop) {
      TestUI.lineJump(currentTop);
    }
  } //end of line wrap

  if (Config.keymapMode === "react") {
    KeymapEvent.flash(" ", true);
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

  //Checking for Korean char
  if (TestInput.input.getKoreanStatus()) {
    //disassembles Korean current Test word to check against char Input
    const koWordArray: string[] = Hangul.disassemble(
      TestWords.words.getCurrent()
    );
    const koOriginalChar: string = koWordArray[charIndex];

    return koOriginalChar === char;
  }

  const originalChar: string = TestWords.words.getCurrent()[charIndex];

  if (originalChar === char) {
    return true;
  }

  if (Config.language.startsWith("russian")) {
    if ((char === "е" || char === "e") && originalChar === "ё") {
      return true;
    }
    if (char === "ё" && (originalChar === "е" || originalChar === "e")) {
      return true;
    }
  }

  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.isCharCorrect
  );
  if (funbox?.functions?.isCharCorrect) {
    return funbox.functions.isCharCorrect(char, originalChar);
  }
  if (
    (char === "’" || char === "‘" || char === "'") &&
    (originalChar === "’" || originalChar === "‘" || originalChar === "'")
  ) {
    return true;
  }

  if (
    (char === `"` || char === "”" || char == "“" || char === "„") &&
    (originalChar === `"` ||
      originalChar === "”" ||
      originalChar === "“" ||
      originalChar === "„")
  ) {
    return true;
  }

  if (
    (char === "–" || char === "—" || char === "-") &&
    (originalChar === "-" || originalChar === "–" || originalChar === "—")
  ) {
    return true;
  }

  return false;
}

function handleChar(
  char: string,
  charIndex: number,
  realInputValue?: string
): void {
  if (TestUI.resultCalculating || TestUI.resultVisible) {
    return;
  }
  const isCharKorean: boolean = TestInput.input.getKoreanStatus();
  if (char === "…") {
    for (let i = 0; i < 3; i++) {
      handleChar(".", charIndex + i);
    }

    return;
  }

  for (const f of FunboxList.get(Config.funbox)) {
    if (f.functions?.handleChar) char = f.functions.handleChar(char);
  }

  const nospace =
    FunboxList.get(Config.funbox).find((f) =>
      f.properties?.includes("nospace")
    ) !== undefined;

  if (char !== "\n" && char !== "\t" && /\s/.test(char)) {
    if (nospace) return;
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

  const thisCharCorrect: boolean = isCharCorrect(char, charIndex);
  let resultingWord: string;

  if (thisCharCorrect && Config.mode !== "zen") {
    char = !isCharKorean
      ? TestWords.words.getCurrent().charAt(charIndex)
      : Hangul.disassemble(TestWords.words.getCurrent())[charIndex];
  }

  if (!thisCharCorrect && char === "\n") {
    if (TestInput.input.current === "") return;
    char = " ";
  }

  if (TestInput.input.current === "") {
    TestInput.setBurstStart(performance.now());
  }

  if (!isCharKorean && !Config.language.startsWith("korean")) {
    resultingWord =
      TestInput.input.current.substring(0, charIndex) +
      char +
      TestInput.input.current.substring(charIndex + 1);
  } else {
    // Get real input from #WordsInput char call.
    // This is because the chars can't be confirmed correctly.
    // With chars alone this happens when a previous symbol is completed
    // Example:
    // input history: ['프'], input:ㄹ, expected :프ㄹ, result: 플
    const realInput: string = (realInputValue ?? "").slice(1);
    resultingWord = realInput;
    koInputVisual.innerText = resultingWord.slice(-1);
  }

  // If a trailing composed char is used, ignore it when counting accuracy
  if (
    !thisCharCorrect &&
    // Misc.trailingComposeChars.test(resultingWord) &&
    CompositionState.getComposing() &&
    !Config.language.startsWith("korean")
  ) {
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

  //keymap
  if (Config.keymapMode === "react") {
    KeymapEvent.flash(char, thisCharCorrect);
  }

  if (!correctShiftUsed && Config.difficulty != "master") return;

  //update current corrected version. if its empty then add the current char. if its not then replace the last character with the currently pressed one / add it
  if (TestInput.corrected.current === "") {
    TestInput.corrected.current += !isCharKorean
      ? resultingWord
      : Hangul.disassemble(resultingWord).join("");
  } else {
    const currCorrectedTestInputLength: number = !isCharKorean
      ? TestInput.corrected.current.length
      : Hangul.disassemble(TestInput.corrected.current).length;

    if (charIndex >= currCorrectedTestInputLength) {
      TestInput.corrected.current += !isCharKorean
        ? char
        : Hangul.disassemble(char).concat();
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

  const testInputLength: number = !isCharKorean
    ? TestInput.input.current.length
    : Hangul.disassemble(TestInput.input.current).length;
  //update the active word top, but only once
  if (testInputLength === 1 && TestWords.words.currentIndex === 0) {
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

  if (Config.mode != "zen") {
    //not applicable to zen mode
    //auto stop the test if the last word is correct
    const currentWord: string = TestWords.words.getCurrent();
    const lastIndex: number = TestWords.words.currentIndex;
    if (
      (currentWord === TestInput.input.current ||
        (Config.quickEnd &&
          !Config.language.startsWith("korean") &&
          currentWord.length === TestInput.input.current.length &&
          Config.stopOnError == "off")) &&
      lastIndex === TestWords.words.length - 1
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
    (nospace &&
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
  if (TestUI.resultCalculating) {
    event.preventDefault();
    return;
  }

  //special case for inserting tab characters into the textarea
  if ($("#customTextPopup .textarea").is(":focus")) {
    event.preventDefault();

    const area = $("#customTextPopup .textarea")[0] as HTMLTextAreaElement;

    const start: number = area.selectionStart;
    const end: number = area.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    area.value =
      area.value.substring(0, start) + "\t" + area.value.substring(end);

    // put caret at right position again
    area.selectionStart = area.selectionEnd = start + 1;

    return;
  }

  let shouldInsertTabCharacter = false;

  if (
    (Config.mode == "zen" && !event.shiftKey) ||
    (TestWords.hasTab && !event.shiftKey)
  ) {
    shouldInsertTabCharacter = true;
  }

  const modalVisible: boolean =
    !$("#commandLineWrapper").hasClass("hidden") || popupVisible;

  if (Config.quickRestart === "esc") {
    // dont do anything special
    if (modalVisible) return;

    // dont do anything on login so we can tab/esc between inputs
    if (ActivePage.get() === "login") return;

    event.preventDefault();
    // insert tab character if needed (only during the test)
    if (!TestUI.resultVisible && shouldInsertTabCharacter) {
      handleChar("\t", TestInput.input.current.length);
      setWordsInput(" " + TestInput.input.current);
      return;
    }
  } else if (Config.quickRestart === "tab") {
    // dont do anything special
    if (modalVisible) return;

    // dont do anything on login so we can tab/esc betweeen inputs
    if (ActivePage.get() === "login") return;

    // change page if not on test page
    if (ActivePage.get() !== "test") {
      navigate("/");
      return;
    }

    // in case we are in a long test, setting manual restart
    if (event.shiftKey) {
      ManualRestart.set();
    } else {
      ManualRestart.reset();
    }

    // insert tab character if needed (only during the test)
    if (!TestUI.resultVisible && shouldInsertTabCharacter) {
      event.preventDefault();
      handleChar("\t", TestInput.input.current.length);
      setWordsInput(" " + TestInput.input.current);
      return;
    }

    //otherwise restart
    TestLogic.restart({ event });
  } else {
    //quick tab off

    //only special handlig on the test page
    if (ActivePage.get() !== "test") return;
    if (TestUI.resultVisible) return;

    // insert tab character if needed
    if (shouldInsertTabCharacter) {
      event.preventDefault();
      handleChar("\t", TestInput.input.current.length);
      setWordsInput(" " + TestInput.input.current);
      return;
    }

    //
    event.preventDefault();
    $("#restartTestButton").trigger("focus");
  }
}

$(document).keydown(async (event) => {
  if (ActivePage.get() == "loading") return;

  if (IgnoredKeys.includes(event.key)) return;

  //autofocus
  const wordsFocused: boolean = $("#wordsInput").is(":focus");
  const pageTestActive: boolean = ActivePage.get() === "test";
  const commandLineVisible = !$("#commandLineWrapper").hasClass("hidden");
  const leaderboardsVisible = !$("#leaderboardsWrapper").hasClass("hidden");

  const popupVisible: boolean = Misc.isAnyPopupVisible();

  const allowTyping: boolean =
    pageTestActive &&
    !commandLineVisible &&
    !leaderboardsVisible &&
    !popupVisible &&
    !TestUI.resultVisible &&
    (wordsFocused || event.key !== "Enter");

  if (
    allowTyping &&
    !wordsFocused &&
    !["Enter", ...ModifierKeys].includes(event.key)
  ) {
    TestUI.focusWords();
    if (Config.showOutOfFocusWarning) {
      event.preventDefault();
    }
  }

  //tab
  if (event.key == "Tab") {
    handleTab(event, popupVisible);
  }

  //esc
  if (event.key === "Escape" && Config.quickRestart === "esc") {
    const modalVisible: boolean =
      !$("#commandLineWrapper").hasClass("hidden") || popupVisible;

    if (modalVisible) return;

    // change page if not on test page
    if (ActivePage.get() !== "test") {
      navigate("/");
      return;
    }

    // in case we are in a long test, setting manual restart
    if (event.shiftKey) {
      ManualRestart.set();
    } else {
      ManualRestart.reset();
    }

    //otherwise restart
    TestLogic.restart({
      event,
    });
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

  Monkey.type();

  if (event.key === "Backspace" && TestInput.input.current.length === 0) {
    backspaceToPrevious();
    if (TestInput.input.current) {
      setWordsInput(" " + TestInput.input.current + " ");
    }
  }

  if (event.key === "Enter") {
    if (event.shiftKey) {
      if (Config.mode == "zen") {
        TestLogic.finish();
      } else if (
        !Misc.canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText,
          CustomTextState.isCustomTextLong() ?? false
        )
      ) {
        TestInput.setBailout(true);
        TestLogic.finish();
      }
    } else {
      handleChar("\n", TestInput.input.current.length);
      setWordsInput(" " + TestInput.input.current);
      if (Config.tapeMode !== "off") {
        TestUI.scrollTape();
      }
    }
  }

  //show dead keys
  if (event.key === "Dead" && !CompositionState.getComposing()) {
    Sound.playClick();
    const word: HTMLElement | null = document.querySelector<HTMLElement>(
      "#words .word.active"
    );
    const len: number = TestInput.input.current.length; // have to do this because prettier wraps the line and causes an error

    // Check to see if the letter actually exists to toggle it as dead
    const deadLetter: Element | undefined =
      word?.querySelectorAll("letter")[len];
    if (deadLetter) {
      deadLetter.classList.toggle("dead");
    }
  }

  if (Config.oppositeShiftMode !== "off") {
    correctShiftUsed =
      (await ShiftTracker.isUsingOppositeShift(event)) !== false;
  }

  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.preventDefaultEvent
  );
  if (funbox?.functions?.preventDefaultEvent) {
    if (await funbox.functions.preventDefaultEvent(event)) {
      event.preventDefault();
      handleChar(event.key, TestInput.input.current.length);
      updateUI();
      setWordsInput(" " + TestInput.input.current);
      if (Config.tapeMode !== "off") {
        TestUI.scrollTape();
      }
    }
  }

  if (
    Config.layout !== "default" &&
    !(
      event.ctrlKey ||
      (event.altKey && window.navigator.platform.search("Linux") > -1)
    )
  ) {
    const char: string | null = await LayoutEmulator.getCharFromEvent(event);
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

  isBackspace = event.key === "Backspace" || event.key === "delete";
});

$("#wordsInput").keyup((event) => {
  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.preventDefault();
    return;
  }

  if (IgnoredKeys.includes(event.key)) return;

  if (TestUI.resultVisible) return;
  const now: number = performance.now();
  if (TestInput.keypressTimings.duration.current !== -1) {
    const diff: number = Math.abs(
      TestInput.keypressTimings.duration.current - now
    );
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

  if (
    (Config.layout == "default" || Config.layout == "korean") &&
    (event.target as HTMLInputElement).value
      .normalize()
      .match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      )
  ) {
    TestInput.input.setKoreanStatus(true);
  }

  const containsKorean = TestInput.input.getKoreanStatus();

  //Hangul.disassemble breaks down Korean characters into its components
  //allowing it to be treated as normal latin characters
  //Hangul.disassemble('한글') //['ㅎ','ㅏ','ㄴ','ㄱ','ㅡ','ㄹ']
  //Hangul.disassemble('한글',true) //[['ㅎ','ㅏ','ㄴ'],['ㄱ','ㅡ','ㄹ']]
  const realInputValue = (event.target as HTMLInputElement).value.normalize();
  const inputValue = containsKorean
    ? Hangul.disassemble(realInputValue).join("").slice(1)
    : realInputValue.slice(1);

  const currTestInput = containsKorean
    ? Hangul.disassemble(TestInput.input.current).join("")
    : TestInput.input.current;

  //checks to see if a korean word has compiled into two characters.
  //inputs: ㄱ, 가, 갇, 가다
  //what it actually reads: ㄱ, 가, 갇, , 가, 가다
  //this skips this part (, , 가,)
  if (containsKorean && !isBackspace) {
    if (
      isKoCompiling ||
      (realInputValue.slice(1).length < TestInput.input.current.length &&
        Hangul.disassemble(TestInput.input.current.slice(-1)).length > 1)
    ) {
      isKoCompiling = !isKoCompiling;
      return;
    }
  }

  // input will be modified even with the preventDefault() in
  // beforeinput/keydown if it's part of a compose sequence. this undoes
  // the effects of that and takes the input out of compose mode.
  if (
    Config.layout !== "default" &&
    inputValue.length >= currTestInput.length
  ) {
    setWordsInput(" " + currTestInput);
    return;
  }

  if (realInputValue.length === 0 && currTestInput.length === 0) {
    // fallback for when no Backspace keydown event (mobile)
    backspaceToPrevious();
  } else if (inputValue.length < currTestInput.length) {
    if (!containsKorean) {
      TestInput.input.current = inputValue;
    } else {
      const realInput = (event.target as HTMLInputElement).value
        .normalize()
        .slice(1);

      TestInput.input.current = realInput;
      koInputVisual.innerText = realInput.slice(-1);
    }

    TestUI.updateWordElement();
    Caret.updatePosition();
    if (!CompositionState.getComposing()) {
      Replay.addReplayEvent("setLetterIndex", currTestInput.length);
    }
  } else if (inputValue !== currTestInput) {
    let diffStart = 0;
    while (inputValue[diffStart] === currTestInput[diffStart]) {
      diffStart++;
    }

    for (let i = diffStart; i < inputValue.length; i++) {
      // passing realInput to allow for correct Korean character compilation
      handleChar(inputValue[i], i, realInputValue);
    }
  }

  setWordsInput(" " + TestInput.input.current);
  updateUI();
  if (Config.tapeMode !== "off") {
    TestUI.scrollTape();
  }

  const statebefore = CompositionState.getComposing();
  setTimeout(() => {
    // checking composition state during the input event and on the next loop
    // this is done because some browsers (e.g. Chrome) will fire the input
    // event before the compositionend event.
    // this ensures the UI is correct

    const stateafter = CompositionState.getComposing();
    if (statebefore !== stateafter) {
      TestUI.updateWordElement();
    }

    // force caret at end of input
    // doing it on next cycle because Chromium on Android won't let me edit
    // the selection inside the input event
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

// Composing events
$("#wordsInput").on("compositionstart", () => {
  if (Config.layout !== "default") return;
  CompositionState.setComposing(true);
  CompositionState.setStartPos(TestInput.input.current.length);
});

$("#wordsInput").on("compositionend", () => {
  if (Config.layout !== "default") return;
  CompositionState.setComposing(false);
});
