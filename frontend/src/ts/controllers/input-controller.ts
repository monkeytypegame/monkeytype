import * as TestLogic from "../test/test-logic";
import * as TestUI from "../test/test-ui";
import * as TestStats from "../test/test-stats";
import * as Monkey from "../test/monkey";
import Config from "../config";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import * as Numbers from "../utils/numbers";
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
import * as Notifications from "../elements/notifications";
import * as WeakSpot from "../test/weak-spot";
import * as ActivePage from "../states/active-page";
import * as TestState from "../test/test-state";
import * as CompositionState from "../states/composition";
import * as TestInput from "../test/test-input";
import * as TestWords from "../test/test-words";
import * as Hangul from "hangul-js";
import * as CustomTextState from "../states/custom-text-name";
import * as FunboxList from "../test/funbox/funbox-list";
import * as KeymapEvent from "../observables/keymap-event";
import { IgnoredKeys } from "../constants/ignored-keys";
import { ModifierKeys } from "../constants/modifier-keys";
import { navigate } from "./route-controller";
import * as Loader from "../elements/loader";

let dontInsertSpace = false;
let correctShiftUsed = true;
let isKoCompiling = false;
let isBackspace: boolean;
let incorrectShiftsInARow = 0;
let awaitingNextWord = false;

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
  const acc: number = Numbers.roundTo2(TestStats.calculateAccuracy());
  if (!isNaN(acc)) LiveAcc.update(acc);

  if (Config.keymapMode === "next" && Config.mode !== "zen") {
    if (!Config.language.startsWith("korean")) {
      void KeymapEvent.highlight(
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

          //@ts-expect-error really cant be bothered fixing all these issues - its gonna get caught anyway
          const koChar: string =
            //@ts-expect-error
            koCurrWord[inputGroupLength][inputCharLength] ??
            //@ts-expect-error
            koCurrWord[koCurrInput.length][
              //@ts-expect-error
              inputCharLength - koCurrWord[inputGroupLength].length
            ];

          void KeymapEvent.highlight(koChar);
        } catch (e) {
          void KeymapEvent.highlight("");
        }
      } else {
        //for new words
        const toHighlight = koCurrWord?.[0]?.[0];
        if (toHighlight !== undefined) void KeymapEvent.highlight(toHighlight);
      }
    }
  }
}

function backspaceToPrevious(): void {
  if (!TestState.isActive) return;

  if (
    TestInput.input.history.length === 0 ||
    TestUI.activeWordElementIndex === 0
  ) {
    return;
  }

  const wordElements = document.querySelectorAll("#words > .word");
  if (
    (TestInput.input.history[TestWords.words.currentIndex - 1] ==
      TestWords.words.get(TestWords.words.currentIndex - 1) &&
      !Config.freedomMode) ||
    wordElements[TestWords.words.currentIndex - 1]?.classList.contains("hidden")
  ) {
    return;
  }

  if (Config.confidenceMode === "on" || Config.confidenceMode === "max") {
    return;
  }

  const incorrectLetterBackspaced =
    wordElements[TestWords.words.currentIndex]?.children[0]?.classList.contains(
      "incorrect"
    );
  if (Config.stopOnError === "letter" && incorrectLetterBackspaced) {
    void TestUI.updateActiveWordLetters();
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
  TestUI.setActiveWordElementIndex(TestUI.activeWordElementIndex - 1);
  TestUI.updateActiveElement(true);
  Funbox.toggleScript(TestWords.words.getCurrent());
  void TestUI.updateActiveWordLetters();

  if (Config.mode === "zen") {
    TimerProgress.update();

    const els = (document.querySelector("#words")?.children ??
      []) as HTMLElement[];

    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i] as HTMLElement;
      if (el.classList.contains("newline")) {
        el.remove();
      } else {
        break;
      }
    }
  }

  void Caret.updatePosition();
  Replay.addReplayEvent("backWord");
}

async function handleSpace(): Promise<void> {
  if (!TestState.isActive) return;

  if (TestInput.input.current === "") return;

  if (
    CompositionState.getComposing() &&
    Config.language.startsWith("chinese")
  ) {
    return;
  }

  if (Config.mode === "zen") {
    $("#words .word.active").removeClass("active");
    $("#words").append("<div class='word active'></div>");
  }

  const currentWord: string = TestWords.words.getCurrent();

  for (const f of FunboxList.get(Config.funbox)) {
    if (f.functions?.handleSpace) {
      f.functions.handleSpace();
    }
  }

  dontInsertSpace = true;

  const burst: number = TestStats.calculateBurst();
  void LiveBurst.update(Math.round(burst));
  TestInput.pushBurstToHistory(burst);

  const nospace =
    FunboxList.get(Config.funbox).find((f) =>
      f.properties?.includes("nospace")
    ) !== undefined;

  //correct word or in zen mode
  const isWordCorrect: boolean =
    currentWord === TestInput.input.current || Config.mode === "zen";
  void MonkeyPower.addPower(isWordCorrect, true);
  TestInput.incrementAccuracy(isWordCorrect);
  if (isWordCorrect) {
    if (Config.stopOnError === "letter") {
      void TestUI.updateActiveWordLetters();
    }
    PaceCaret.handleSpace(true, currentWord);
    TestInput.input.pushHistory();
    TestWords.words.increaseCurrentIndex();
    Funbox.toggleScript(TestWords.words.getCurrent());
    TestInput.incrementKeypressCount();
    TestInput.pushKeypressWord(TestWords.words.currentIndex);
    if (!nospace) {
      void Sound.playClick();
    }
    Replay.addReplayEvent("submitCorrectWord");
  } else {
    if (!nospace) {
      if (Config.playSoundOnError === "off" || Config.blindMode) {
        void Sound.playClick();
      } else {
        void Sound.playError();
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
    if (Config.stopOnError !== "off") {
      if (Config.difficulty === "expert" || Config.difficulty === "master") {
        //failed due to diff when pressing space
        TestLogic.fail("difficulty");
        return;
      }
      if (Config.stopOnError === "word") {
        dontInsertSpace = false;
        Replay.addReplayEvent("incorrectLetter", "_");
        void TestUI.updateActiveWordLetters();
        void Caret.updatePosition();
      }
      return;
    }
    PaceCaret.handleSpace(false, currentWord);
    if (Config.blindMode) {
      if (Config.highlightMode !== "off") {
        TestUI.highlightAllLettersAsCorrect(TestUI.activeWordElementIndex);
      }
    } else {
      TestUI.highlightBadWord(TestUI.activeWordElementIndex);
    }
    TestInput.input.pushHistory();
    TestWords.words.increaseCurrentIndex();
    Funbox.toggleScript(TestWords.words.getCurrent());
    TestInput.incrementKeypressCount();
    TestInput.pushKeypressWord(TestWords.words.currentIndex);
    Replay.addReplayEvent("submitErrorWord");
    if (Config.difficulty === "expert" || Config.difficulty === "master") {
      TestLogic.fail("difficulty");
    }
  }

  const isLastWord = TestWords.words.currentIndex === TestWords.words.length;
  if (TestLogic.areAllTestWordsGenerated() && isLastWord) {
    void TestLogic.finish();
    return;
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

  if (Config.keymapMode === "react") {
    void KeymapEvent.flash(" ", true);
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
    Config.mode === "time" ||
    Config.mode === "words" ||
    Config.mode === "custom" ||
    Config.mode === "quote"
  ) {
    if (isLastWord) {
      awaitingNextWord = true;
      Loader.show();
      await TestLogic.addWord();
      Loader.hide();
      awaitingNextWord = false;
    } else {
      void TestLogic.addWord();
    }
  }
  TestUI.setActiveWordElementIndex(TestUI.activeWordElementIndex + 1);
  TestUI.updateActiveElement();
  void Caret.updatePosition();

  if (
    !Config.showAllLines ||
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitValue() === 0) ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time")
  ) {
    const currentTop: number = Math.floor(
      document.querySelectorAll<HTMLElement>("#words .word")[
        TestUI.activeWordElementIndex - 1
      ]?.offsetTop ?? 0
    );
    let nextTop: number;
    try {
      nextTop = Math.floor(
        document.querySelectorAll<HTMLElement>("#words .word")[
          TestUI.activeWordElementIndex
        ]?.offsetTop ?? 0
      );
    } catch (e) {
      nextTop = 0;
    }

    if (nextTop > currentTop) {
      TestUI.lineJump(currentTop);
    }
  } //end of line wrap

  // enable if i decide that auto tab should also work after a space
  // if (
  //   Config.language.startsWith("code") &&
  //   /^\t+/.test(TestWords.words.getCurrent()) &&
  //   TestWords.words.getCurrent()[TestInput.input.current.length] === "\t"
  // ) {
  //   //send a tab event using jquery
  //   $("#wordsInput").trigger($.Event("keydown", { key: "Tab", code: "Tab" }));
  // }
}

function isCharCorrect(char: string, charIndex: number): boolean {
  if (!correctShiftUsed) return false;

  if (Config.mode === "zen") {
    return true;
  }

  //Checking for Korean char
  if (TestInput.input.getKoreanStatus()) {
    //disassembles Korean current Test word to check against char Input
    const koWordArray: string[] = Hangul.disassemble(
      TestWords.words.getCurrent()
    );
    const koOriginalChar = koWordArray[charIndex];

    if (koOriginalChar === undefined) {
      return false;
    }

    return koOriginalChar === char;
  }

  const originalChar = TestWords.words.getCurrent()[charIndex];

  if (originalChar === undefined) {
    return false;
  }

  if (originalChar === char) {
    return true;
  }

  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.isCharCorrect
  );
  if (funbox?.functions?.isCharCorrect) {
    return funbox.functions.isCharCorrect(char, originalChar);
  }

  if (Config.language.startsWith("russian")) {
    if (
      (char === "ё" || char === "е" || char === "e") &&
      (originalChar === "ё" || originalChar === "е" || originalChar === "e")
    ) {
      return true;
    }
  }

  if (
    (char === "’" ||
      char === "‘" ||
      char === "'" ||
      char === "ʼ" ||
      char === "׳") &&
    (originalChar === "’" ||
      originalChar === "‘" ||
      originalChar === "'" ||
      originalChar === "ʼ" ||
      originalChar === "׳")
  ) {
    return true;
  }

  if (
    (char === `"` || char === "”" || char === "“" || char === "„") &&
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

  if (char === "…" && TestWords.words.getCurrent()[charIndex] !== "…") {
    for (let i = 0; i < 3; i++) {
      handleChar(".", charIndex + i);
    }

    return;
  }

  if (char === "œ" && TestWords.words.getCurrent()[charIndex] !== "œ") {
    handleChar("o", charIndex);
    handleChar("e", charIndex + 1);
    return;
  }

  if (char === "æ" && TestWords.words.getCurrent()[charIndex] !== "æ") {
    handleChar("a", charIndex);
    handleChar("e", charIndex + 1);
    return;
  }

  console.debug("Handling char", char, charIndex, realInputValue);

  const now = performance.now();

  const isCharKorean: boolean = TestInput.input.getKoreanStatus();

  for (const f of FunboxList.get(Config.funbox)) {
    if (f.functions?.handleChar) char = f.functions.handleChar(char);
  }

  const nospace =
    FunboxList.get(Config.funbox).find((f) =>
      f.properties?.includes("nospace")
    ) !== undefined;

  if (char !== "\n" && char !== "\t" && /\s/.test(char)) {
    if (nospace) return;
    void handleSpace();

    //insert space for expert and master or strict space,
    //or for stop on error set to word,
    //otherwise dont do anything
    if (
      Config.difficulty !== "normal" ||
      (Config.strictSpace && Config.mode !== "zen") ||
      (Config.stopOnError === "word" && charIndex > 0)
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
  if (!TestState.isActive && !TestLogic.startTest(now)) {
    return;
  }

  Focus.set(true);
  Caret.stopAnimation();

  const thisCharCorrect: boolean = isCharCorrect(char, charIndex);
  let resultingWord: string;

  if (thisCharCorrect && Config.mode !== "zen") {
    char = !isCharKorean
      ? TestWords.words.getCurrent().charAt(charIndex)
      : Hangul.disassemble(TestWords.words.getCurrent())[charIndex] ?? "";
  }

  if (!thisCharCorrect && char === "\n") {
    if (TestInput.input.current === "") return;
    char = " ";
  }

  if (TestInput.input.current === "") {
    TestInput.setBurstStart(now);
  }

  if (isCharKorean || Config.language.startsWith("korean")) {
    // Get real input from #WordsInput char call.
    // This is because the chars can't be confirmed correctly.
    // With chars alone this happens when a previous symbol is completed
    // Example:
    // input history: ['프'], input:ㄹ, expected :프ㄹ, result: 플
    const realInput: string = (realInputValue ?? "").slice(1);
    resultingWord = realInput;
    koInputVisual.innerText = resultingWord.slice(-1);
  } else if (Config.language.startsWith("chinese")) {
    resultingWord = (realInputValue ?? "").slice(1);
  } else {
    resultingWord =
      TestInput.input.current.substring(0, charIndex) +
      char +
      TestInput.input.current.substring(charIndex + 1);
  }

  // If a trailing composed char is used, ignore it when counting accuracy
  if (
    !thisCharCorrect &&
    // Misc.trailingComposeChars.test(resultingWord) &&
    CompositionState.getComposing() &&
    !Config.language.startsWith("korean")
  ) {
    TestInput.input.current = resultingWord;
    void TestUI.updateActiveWordLetters();
    void Caret.updatePosition();
    return;
  }

  void MonkeyPower.addPower(thisCharCorrect);
  TestInput.incrementAccuracy(thisCharCorrect);

  if (!thisCharCorrect) {
    TestInput.incrementKeypressErrors();
    TestInput.pushMissedWord(TestWords.words.getCurrent());
  }

  WeakSpot.updateScore(
    Config.mode === "zen"
      ? char
      : TestWords.words.getCurrent()[charIndex] ?? "",
    thisCharCorrect
  );

  if (thisCharCorrect) {
    void Sound.playClick();
  } else {
    if (Config.playSoundOnError === "off" || Config.blindMode) {
      void Sound.playClick();
    } else {
      void Sound.playError();
    }
  }

  //keymap
  if (Config.keymapMode === "react") {
    void KeymapEvent.flash(char, thisCharCorrect);
  }

  if (Config.difficulty !== "master") {
    if (!correctShiftUsed) {
      incorrectShiftsInARow++;
      if (incorrectShiftsInARow >= 5) {
        Notifications.add("Opposite shift mode is on.", 0, {
          important: true,
          customTitle: "Reminder",
        });
      }
      return;
    } else {
      incorrectShiftsInARow = 0;
    }
  }

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
  TestInput.pushKeypressWord(TestWords.words.currentIndex);

  if (
    Config.difficulty !== "master" &&
    Config.stopOnError === "letter" &&
    !thisCharCorrect
  ) {
    if (!Config.blindMode) {
      void TestUI.updateActiveWordLetters(TestInput.input.current + char);
    }
    return;
  }

  Replay.addReplayEvent(
    thisCharCorrect ? "correctLetter" : "incorrectLetter",
    char
  );

  const activeWord = document.querySelectorAll("#words .word")?.[
    TestUI.activeWordElementIndex
  ] as HTMLElement;

  const testInputLength: number = !isCharKorean
    ? TestInput.input.current.length
    : Hangul.disassemble(TestInput.input.current).length;
  //update the active word top, but only once
  if (testInputLength === 1 && TestWords.words.currentIndex === 0) {
    TestUI.setActiveWordTop(activeWord?.offsetTop);
  }

  //max length of the input is 20 unless in zen mode then its 30
  if (
    (Config.mode === "zen" && charIndex < 30) ||
    (Config.mode !== "zen" &&
      resultingWord.length < TestWords.words.getCurrent().length + 20)
  ) {
    TestInput.input.current = resultingWord;
  } else {
    console.error("Hitting word limit");
  }

  if (!thisCharCorrect && Config.difficulty === "master") {
    TestLogic.fail("difficulty");
    return;
  }

  if (Config.mode !== "zen") {
    //not applicable to zen mode
    //auto stop the test if the last word is correct
    //do not stop if not all characters have been parsed by handleChar yet
    const currentWord = TestWords.words.getCurrent();
    const lastWordIndex = TestWords.words.currentIndex;
    const lastWord = lastWordIndex === TestWords.words.length - 1;
    const allWordGenerated = TestLogic.areAllTestWordsGenerated();
    const wordIsTheSame = currentWord === TestInput.input.current;
    const shouldQuickEnd =
      Config.quickEnd &&
      !Config.language.startsWith("korean") &&
      currentWord.length === TestInput.input.current.length &&
      Config.stopOnError === "off";
    const isChinese = Config.language.startsWith("chinese");

    if (
      lastWord &&
      allWordGenerated &&
      (wordIsTheSame || shouldQuickEnd) &&
      (!isChinese ||
        (realInputValue !== undefined &&
          charIndex + 2 == realInputValue.length))
    ) {
      void TestLogic.finish();
      return;
    }
  }

  const activeWordTopBeforeJump = activeWord?.offsetTop;
  void TestUI.updateActiveWordLetters();

  const newActiveTop = activeWord?.offsetTop;
  //stop the word jump by slicing off the last character, update word again
  if (
    activeWordTopBeforeJump < newActiveTop &&
    !TestUI.lineTransition &&
    TestInput.input.current.length > 1
  ) {
    if (Config.mode === "zen") {
      if (!Config.showAllLines) TestUI.lineJump(activeWordTopBeforeJump);
    } else {
      TestInput.input.current = TestInput.input.current.slice(0, -1);
      void TestUI.updateActiveWordLetters();
    }
  }

  //simulate space press in nospace funbox
  if (
    (nospace &&
      TestInput.input.current.length === TestWords.words.getCurrent().length) ||
    (char === "\n" && thisCharCorrect)
  ) {
    void handleSpace();
  }

  const currentWord = TestWords.words.getCurrent();
  const doesCurrentWordHaveTab = /^\t+/.test(TestWords.words.getCurrent());
  const isCurrentCharTab = currentWord[TestInput.input.current.length] === "\t";

  setTimeout(() => {
    if (
      thisCharCorrect &&
      Config.language.startsWith("code") &&
      doesCurrentWordHaveTab &&
      isCurrentCharTab
    ) {
      const tabEvent = new KeyboardEvent("keydown", {
        key: "Tab",
        code: "Tab",
      });
      document.dispatchEvent(tabEvent);
    }
  }, 0);

  if (char !== "\n") {
    void Caret.updatePosition();
  }
}

function handleTab(event: JQuery.KeyDownEvent, popupVisible: boolean): void {
  if (TestUI.resultCalculating) {
    event.preventDefault();
    return;
  }

  let shouldInsertTabCharacter = false;

  if (
    (Config.mode === "zen" && !event.shiftKey) ||
    (TestWords.hasTab && !event.shiftKey)
  ) {
    shouldInsertTabCharacter = true;
  }

  const modalVisible: boolean =
    Misc.isPopupVisible("commandLineWrapper") || popupVisible;

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
    // dont do anything special
    if (modalVisible) return;

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

    setTimeout(() => {
      if (document.activeElement?.id !== "wordsInput") {
        Focus.set(false);
      }
    }, 0);
  }
}

$("#wordsInput").on("keydown", (event) => {
  const pageTestActive: boolean = ActivePage.get() === "test";
  const commandLineVisible = Misc.isPopupVisible("commandLineWrapper");
  const leaderboardsVisible = Misc.isPopupVisible("leaderboardsWrapper");
  const popupVisible: boolean = Misc.isAnyPopupVisible();
  const allowTyping: boolean =
    pageTestActive &&
    !commandLineVisible &&
    !leaderboardsVisible &&
    !popupVisible &&
    !TestUI.resultVisible &&
    event.key !== "Enter" &&
    !awaitingNextWord;

  if (!allowTyping) {
    event.preventDefault();
  }
});

let lastBailoutAttempt = -1;

$(document).on("keydown", async (event) => {
  if (ActivePage.get() === "loading") {
    console.debug("Ignoring keydown event on loading page.");
    return;
  }

  if (IgnoredKeys.includes(event.key)) {
    console.debug(
      `Key ${event.key} is on the list of ignored keys. Stopping keydown event.`
    );
    return;
  }

  //autofocus
  const wordsFocused: boolean = $("#wordsInput").is(":focus");
  const pageTestActive: boolean = ActivePage.get() === "test";
  const commandLineVisible = Misc.isPopupVisible("commandLineWrapper");
  const leaderboardsVisible = Misc.isPopupVisible("leaderboardsWrapper");

  const popupVisible: boolean = Misc.isAnyPopupVisible();

  const allowTyping: boolean =
    pageTestActive &&
    !commandLineVisible &&
    !leaderboardsVisible &&
    !popupVisible &&
    !TestUI.resultVisible &&
    (wordsFocused || event.key !== "Enter") &&
    !awaitingNextWord;

  if (
    allowTyping &&
    !wordsFocused &&
    !["Enter", " ", "Escape", "Tab", ...ModifierKeys].includes(event.key)
  ) {
    TestUI.focusWords();
    if (Config.showOutOfFocusWarning && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  //tab
  if (event.key === "Tab") {
    handleTab(event, popupVisible);
  }

  //esc
  if (event.key === "Escape" && Config.quickRestart === "esc") {
    const modalVisible: boolean =
      Misc.isPopupVisible("commandLineWrapper") || popupVisible;

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

  //enter
  if (event.key === "Enter" && Config.quickRestart === "enter") {
    //check if active element is a button, anchor, or has class button, or textButton
    const activeElement: HTMLElement | null =
      document.activeElement as HTMLElement;
    const activeElementIsButton: boolean =
      activeElement?.tagName === "BUTTON" ||
      activeElement?.tagName === "A" ||
      activeElement?.classList.contains("button") ||
      activeElement?.classList.contains("textButton") ||
      (activeElement?.tagName === "INPUT" &&
        activeElement?.id !== "wordsInput");

    if (activeElementIsButton) return;

    const modalVisible: boolean =
      Misc.isPopupVisible("commandLineWrapper") || popupVisible;

    if (modalVisible) return;

    // change page if not on test page
    if (ActivePage.get() !== "test") {
      navigate("/");
      return;
    }

    if (TestUI.resultVisible) {
      TestLogic.restart({
        event,
      });
      return;
    }

    if (Config.mode === "zen") {
      //do nothing
    } else if (
      (!TestWords.hasNewline && !Config.funbox.includes("58008")) ||
      ((TestWords.hasNewline || Config.funbox.includes("58008")) &&
        event.shiftKey)
    ) {
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
  }

  if (!allowTyping) return;

  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.preventDefault();
    return;
  }

  TestInput.setCurrentNotAfk();

  //blocking firefox from going back in history with backspace
  if (event.key === "Backspace") {
    void Sound.playClick();
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
      if (Config.mode === "zen") {
        void TestLogic.finish();
      } else if (
        !Misc.canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText.getData(),
          CustomTextState.isCustomTextLong() ?? false
        )
      ) {
        const delay = Date.now() - lastBailoutAttempt;
        if (lastBailoutAttempt === -1 || delay > 200) {
          lastBailoutAttempt = Date.now();
          if (delay >= 5000) {
            Notifications.add(
              "Please double tap shift+enter to confirm bail out",
              0,
              {
                important: true,
                duration: 5,
              }
            );
          }
        } else {
          TestState.setBailedOut(true);
          void TestLogic.finish();
        }
      }
    } else {
      handleChar("\n", TestInput.input.current.length);
      setWordsInput(" " + TestInput.input.current);
    }
  }

  //show dead keys
  if (event.key === "Dead" && !CompositionState.getComposing()) {
    void Sound.playClick();
    const activeWord: HTMLElement | null = document.querySelectorAll(
      "#words .word"
    )?.[TestUI.activeWordElementIndex] as HTMLElement;
    const len: number = TestInput.input.current.length; // have to do this because prettier wraps the line and causes an error

    // Check to see if the letter actually exists to toggle it as dead
    const deadLetter: Element | undefined =
      activeWord?.querySelectorAll("letter")[len];
    if (deadLetter) {
      deadLetter.classList.toggle("dead");
    }
  }

  if (Config.oppositeShiftMode !== "off") {
    if (
      Config.oppositeShiftMode === "keymap" &&
      Config.keymapLayout !== "overrideSync"
    ) {
      const keymapLayout = await JSONData.getLayout(Config.keymapLayout).catch(
        () => undefined
      );
      if (keymapLayout === undefined) {
        Notifications.add("Failed to load keymap layout", -1);

        return;
      }
      const keycode = ShiftTracker.layoutKeyToKeycode(event.key, keymapLayout);

      correctShiftUsed =
        keycode === undefined
          ? true
          : ShiftTracker.isUsingOppositeShift(keycode);
    } else {
      correctShiftUsed = ShiftTracker.isUsingOppositeShift(event.code);
    }
  }

  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.preventDefaultEvent
  );
  if (funbox?.functions?.preventDefaultEvent) {
    if (
      await funbox.functions.preventDefaultEvent(
        //i cant figure this type out, but it works fine
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        event as JQuery.KeyDownEvent
      )
    ) {
      event.preventDefault();
      handleChar(event.key, TestInput.input.current.length);
      updateUI();
      setWordsInput(" " + TestInput.input.current);
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
  }

  isBackspace = event.key === "Backspace" || event.key === "delete";
});

$("#wordsInput").on("keydown", (event) => {
  if (event.originalEvent?.repeat) {
    console.log(
      "spacing debug keydown STOPPED - repeat",
      event.key,
      event.code,
      event.which
    );
    return;
  }

  // console.debug("Event: keydown", event);

  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    event.code = "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    event.code = "NoCode";
  }

  const now = performance.now();
  setTimeout(() => {
    const eventCode =
      event.code === "" || event.which === 231 ? "NoCode" : event.code;
    TestInput.recordKeydownTime(now, eventCode);
  }, 0);
});

$("#wordsInput").on("keyup", (event) => {
  if (event.originalEvent?.repeat) {
    console.log(
      "spacing debug keydown STOPPED - repeat",
      event.key,
      event.code,
      event.which
    );
    return;
  }

  // console.debug("Event: keyup", event);

  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    event.code = "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    event.code = "NoCode";
  }

  const now = performance.now();
  setTimeout(() => {
    const eventCode =
      event.code === "" || event.which === 231 ? "NoCode" : event.code;
    TestInput.recordKeyupTime(now, eventCode);
  }, 0);
});

$("#wordsInput").on("keyup", (event) => {
  if (!event.originalEvent?.isTrusted || TestUI.testRestarting) {
    event.preventDefault();
    return;
  }

  if (IgnoredKeys.includes(event.key)) return;

  if (TestUI.resultVisible) return;
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
  if (popupVisible) {
    event.preventDefault();
    return;
  }

  TestInput.setCurrentNotAfk();

  if (
    (Config.layout === "default" || Config.layout === "korean") &&
    (event.target as HTMLInputElement).value
      .normalize()
      .match(
        /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/g
      )
  ) {
    TestInput.input.setKoreanStatus(true);
  }

  const containsKorean = TestInput.input.getKoreanStatus();
  const containsChinese = Config.language.startsWith("chinese");

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
    if (containsChinese) {
      if (
        currTestInput.length - inputValue.length <= 2 &&
        currTestInput.startsWith(currTestInput)
      ) {
        TestInput.input.current = inputValue;
      } else {
        // IME has converted pinyin to Chinese Character(s)
        let diffStart = 0;
        while (inputValue[diffStart] === currTestInput[diffStart]) {
          diffStart++;
        }

        let iOffset = 0;
        if (Config.stopOnError !== "word" && /.+ .+/.test(inputValue)) {
          iOffset = inputValue.indexOf(" ") + 1;
        }
        for (let i = diffStart; i < inputValue.length; i++) {
          handleChar(inputValue[i] as string, i - iOffset, realInputValue);
        }
      }
    } else if (containsKorean) {
      const realInput = (event.target as HTMLInputElement).value
        .normalize()
        .slice(1);

      TestInput.input.current = realInput;
      koInputVisual.innerText = realInput.slice(-1);
    } else {
      TestInput.input.current = inputValue;
    }

    void TestUI.updateActiveWordLetters();
    void Caret.updatePosition();
    if (!CompositionState.getComposing()) {
      const keyStroke = event?.originalEvent as InputEvent;
      if (keyStroke.inputType === "deleteWordBackward") {
        Replay.addReplayEvent("setLetterIndex", 0); // Letter index will be 0 on CTRL + Backspace Event
      } else {
        Replay.addReplayEvent("setLetterIndex", currTestInput.length - 1);
      }
    }
  }
  if (inputValue !== currTestInput) {
    let diffStart = 0;
    while (inputValue[diffStart] === currTestInput[diffStart]) {
      diffStart++;
    }

    let iOffset = 0;
    if (Config.stopOnError !== "word" && /.+ .+/.test(inputValue)) {
      iOffset = inputValue.indexOf(" ") + 1;
    }
    for (let i = diffStart; i < inputValue.length; i++) {
      // passing realInput to allow for correct Korean character compilation
      handleChar(inputValue[i] as string, i - iOffset, realInputValue);
    }
  }

  setWordsInput(" " + TestInput.input.current);
  updateUI();
  const statebefore = CompositionState.getComposing();
  setTimeout(() => {
    // checking composition state during the input event and on the next loop
    // this is done because some browsers (e.g. Chrome) will fire the input
    // event before the compositionend event.
    // this ensures the UI is correct

    const stateafter = CompositionState.getComposing();
    if (statebefore !== stateafter) {
      void TestUI.updateActiveWordLetters();
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

$("#wordsInput").on("select selectstart", (event) => {
  event.preventDefault();
});

$("#wordsInput").on("keydown", (event) => {
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
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
