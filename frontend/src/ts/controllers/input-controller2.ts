import Config from "../config";
import * as TestInput from "../test/test-input";
import * as TestUI from "../test/test-ui";
import * as Caret from "../test/caret";
import * as TestState from "../test/test-state";
import * as TestLogic from "../test/test-logic";
import * as TestWords from "../test/test-words";
import * as Focus from "../test/focus";
import * as MonkeyPower from "../elements/monkey-power";
import { getActiveFunboxes } from "../test/funbox/list";
import * as SoundController from "./sound-controller";
import * as KeymapEvent from "../observables/keymap-event";
import * as JSONData from "../utils/json-data";
import * as Notifications from "../elements/notifications";
import * as KeyConverter from "../utils/key-converter";
import * as ShiftTracker from "../test/shift-tracker";
import * as TestStats from "../test/test-stats";
import * as Numbers from "@monkeytype/util/numbers";
import * as LiveAcc from "../test/live-acc";

const wordsInput = document.querySelector("#wordsInput") as HTMLInputElement;

const ignoredInputTypes = ["deleteSoftLineBackward", "deleteSoftLineForward"];

let correctShiftUsed = true;
let incorrectShiftsInARow = 0;

function isCharCorrect(
  inputWord: string,
  targetWord: string,
  index: number
): boolean {
  const input = inputWord[index];
  const target = targetWord[index];

  if (inputWord === targetWord + " ") {
    return true;
  }

  if (input === undefined) {
    return false;
  }

  if (target === undefined) {
    return false;
  }

  if (target === input) {
    return true;
  }

  const funbox = getActiveFunboxes().find((fb) => fb.functions?.isCharCorrect);
  if (funbox?.functions?.isCharCorrect) {
    return funbox.functions.isCharCorrect(input, target);
  }

  if (Config.language.startsWith("russian")) {
    if (
      (input === "ё" || input === "е" || input === "e") &&
      (target === "ё" || target === "е" || target === "e")
    ) {
      return true;
    }
  }

  if (
    (input === "’" ||
      input === "‘" ||
      input === "'" ||
      input === "ʼ" ||
      input === "׳" ||
      input === "ʻ") &&
    (target === "’" ||
      target === "‘" ||
      target === "'" ||
      target === "ʼ" ||
      target === "׳" ||
      target === "ʻ")
  ) {
    return true;
  }

  if (
    (input === `"` || input === "”" || input === "“" || input === "„") &&
    (target === `"` || target === "”" || target === "“" || target === "„")
  ) {
    return true;
  }

  if (
    (input === "–" || input === "—" || input === "-") &&
    (target === "-" || target === "–" || target === "—")
  ) {
    return true;
  }

  return false;
}

type InputEventHandler = {
  inputValue: string;
  realInputValue: string;
  event: InputEvent;
  now: number;
};

type OnInsertTextParams = InputEventHandler & {
  data: string;
};

function onBeforeContentDelete({ inputValue, event }: InputEventHandler): void {
  if (!TestState.isActive) {
    event.preventDefault();
    return;
  }

  const previousWordCorrect =
    (TestInput.input.get(TestState.activeWordIndex - 1) ?? "") ===
    TestWords.words.get(TestState.activeWordIndex - 1);
  const freedomMode = Config.freedomMode;
  const inputIsEmpty = inputValue === "";

  if (freedomMode) {
    //allow anything in freedom mode
    return;
  }

  if (inputIsEmpty && previousWordCorrect) {
    event.preventDefault();
  }
}

function onBeforeInsertText({
  data,
  inputValue,
  event,
}: OnInsertTextParams): void {
  if (data === " " && inputValue === "" && Config.difficulty === "normal") {
    event?.preventDefault();
  }
}

function onInsertText({ data, event, now }: OnInsertTextParams): boolean {
  const correct = isCharCorrect(
    TestInput.input.current,
    TestWords.words.get(TestState.activeWordIndex),
    TestInput.input.current.length - 1
  );

  const activeWordIndex = TestState.activeWordIndex;

  let canSpaceToNextWord = true;

  if (TestInput.input.current.length === 1) {
    TestInput.setBurstStart(now);
  }

  void MonkeyPower.addPower(correct);
  TestInput.incrementAccuracy(correct);

  if (!correct) {
    TestInput.incrementKeypressErrors();
    TestInput.pushMissedWord(TestWords.words.getCurrent());
  }

  if (Config.keymapMode === "react") {
    void KeymapEvent.flash(data, correct);
  }

  if (data !== " " && Config.oppositeShiftMode !== "off") {
    if (!correctShiftUsed) {
      TestInput.input.current = TestInput.input.current.slice(0, -1);
      setInputValue(TestInput.input.current);
      incorrectShiftsInARow++;
      if (incorrectShiftsInARow >= 5) {
        Notifications.add("Opposite shift mode is on.", 0, {
          important: true,
          customTitle: "Reminder",
        });
      }
    } else {
      incorrectShiftsInARow = 0;
    }
  }

  if (Config.stopOnError === "letter" && !correct) {
    TestInput.input.current = TestInput.input.current.slice(0, -1);
    setInputValue(TestInput.input.current);
    canSpaceToNextWord = false;
  }

  if (Config.stopOnError === "word" && !correct) {
    canSpaceToNextWord = false;
  }

  TestInput.incrementKeypressCount();
  TestInput.pushKeypressWord(TestState.activeWordIndex);

  if (TestInput.corrected.current === "") {
    TestInput.corrected.current += TestInput.input.current;
  } else {
    const currCorrectedTestInputLength = TestInput.corrected.current.length;

    const charIndex = TestInput.input.current.trimEnd().length - 1;

    if (charIndex >= currCorrectedTestInputLength) {
      TestInput.corrected.current += data;
    } else if (!correct) {
      TestInput.corrected.current =
        TestInput.corrected.current.substring(0, charIndex) +
        data +
        TestInput.corrected.current.substring(charIndex + 1);
    }
  }

  let movingToNextWord = false;
  if (
    data === " " &&
    TestInput.input.current.length > 1 &&
    canSpaceToNextWord
  ) {
    movingToNextWord = true;
    const inputTrimmed = TestInput.input.current.trimEnd();
    TestInput.input.current = inputTrimmed;
    TestInput.input.pushHistory();
    TestInput.corrected.pushHistory();
    if (activeWordIndex < TestWords.words.length - 1) {
      TestState.increaseActiveWordIndex();
    }
    setInputValue("");
  }

  if (
    (Config.difficulty === "expert" &&
      data === " " &&
      !correct &&
      movingToNextWord) ||
    (Config.difficulty === "master" && !correct)
  ) {
    TestLogic.fail("difficulty");
    console.log("failing difficulty");
  } else {
    const currentWord = TestWords.words.getCurrent();
    const lastWord = activeWordIndex >= TestWords.words.length - 1;
    const allWordGenerated = TestLogic.areAllTestWordsGenerated();
    const wordIsCorrect =
      TestInput.input.current === TestWords.words.get(activeWordIndex);
    const shouldQuickEnd =
      Config.quickEnd &&
      currentWord.length === TestInput.input.current.length &&
      Config.stopOnError === "off";
    const shouldSpaceEnd = data === " " && Config.stopOnError === "off";

    if (
      lastWord &&
      allWordGenerated &&
      (wordIsCorrect || shouldQuickEnd || shouldSpaceEnd)
    ) {
      void TestLogic.finish();
    }
  }
  return correct;
}

function onContentDelete({ realInputValue }: InputEventHandler): void {
  if (realInputValue === "") {
    if (TestState.activeWordIndex > 0) {
      const word = TestInput.input.popHistory();
      TestState.decreaseActiveWordIndex();
      TestInput.corrected.popHistory();
      TestInput.input.current = word;
      setInputValue(word);
    } else {
      setInputValue("");
    }
  }
}

function setInputValue(value: string): void {
  wordsInput.value = " " + value;
}

wordsInput.addEventListener("beforeinput", (event) => {
  if (ignoredInputTypes.includes(event.inputType)) {
    event.preventDefault();
    return;
  }

  const realInputValue = wordsInput.value;
  const inputValue = wordsInput.value.slice(1);
  const now = performance.now();

  if (TestUI.resultCalculating) {
    event.preventDefault();
    return;
  }

  // beforeinput is always typed as inputevent but input is not?
  // if (!(event instanceof InputEvent)) {
  // event.preventDefault();
  // return;
  // }

  if (event.inputType === "insertText" && event.data !== null) {
    onBeforeInsertText({
      data: event.data,
      inputValue,
      realInputValue,
      event,
      now,
    });
  } else if (event.inputType === "deleteContentBackward") {
    onBeforeContentDelete({
      inputValue,
      realInputValue,
      event,
      now,
    });
  } else if (event.inputType === "deleteWordBackward") {
    if (!TestState.isActive) {
      event.preventDefault();
      return;
    }
  }
});

wordsInput.addEventListener("input", (event) => {
  const realInputValue = wordsInput.value;
  const inputValue = wordsInput.value.slice(1);
  const now = performance.now();
  let playCorrectSound = false;
  let correctInsert = false;

  if (!(event instanceof InputEvent)) {
    event.preventDefault();
    return;
  }

  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(now);
  }

  TestInput.input.current = inputValue;

  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrent().length + 20;

  if (TestInput.input.current.length > inputLimit) {
    TestInput.input.current = TestInput.input.current.slice(0, inputLimit);
    setInputValue(TestInput.input.current);
  } else {
    console.error("Hitting word limit");
  }

  if (event.inputType === "insertText" && event.data !== null) {
    correctInsert = onInsertText({
      inputValue,
      realInputValue,
      event,
      data: event.data,
      now,
    });
    playCorrectSound = correctInsert;
  } else if (event.inputType === "deleteContentBackward") {
    playCorrectSound = true;
    onContentDelete({
      inputValue,
      realInputValue,
      event,
      now,
    });
  } else if (event.inputType === "deleteWordBackward") {
    playCorrectSound = true;
    if (inputValue === "") {
      setInputValue("");
    }
  }

  if (
    playCorrectSound ||
    Config.playSoundOnError === "off" ||
    Config.blindMode
  ) {
    void SoundController.playClick();
  } else {
    void SoundController.playError();
  }

  const acc: number = Numbers.roundTo2(TestStats.calculateAccuracy());
  if (!isNaN(acc)) LiveAcc.update(acc);

  Focus.set(true);
  Caret.stopAnimation();
  TestUI.updateActiveElement();

  let override: string | undefined = undefined;
  if (
    Config.stopOnError === "letter" &&
    event.inputType === "insertText" &&
    !correctInsert
  ) {
    override = TestInput.input.current + event.data;
  }

  void TestUI.updateActiveWordLetters(override);
  void Caret.updatePosition();
});

wordsInput.addEventListener("focus", (event) => {
  wordsInput.selectionStart = wordsInput.selectionEnd = wordsInput.value.length;
});

wordsInput.addEventListener("copy paste", (event) => {
  event.preventDefault();
});

wordsInput.addEventListener("select selectstart", (event) => {
  event.preventDefault();
});

wordsInput.addEventListener("keydown", async (event) => {
  if (
    ((event.metaKey || event.ctrlKey) && event.key === "a") ||
    event.key.startsWith("Arrow")
  ) {
    event.preventDefault();
    return;
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
      const keycode = KeyConverter.layoutKeyToKeycode(event.key, keymapLayout);

      correctShiftUsed =
        keycode === undefined
          ? true
          : ShiftTracker.isUsingOppositeShift(keycode);
    } else {
      correctShiftUsed = ShiftTracker.isUsingOppositeShift(
        event.code as KeyConverter.Keycode
      );
    }
  }
});
