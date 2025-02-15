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

const wordsInput = document.querySelector("#wordsInput") as HTMLInputElement;

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
  if (inputValue === "") {
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
    TestInput.input.getCurrent(),
    TestWords.words.get(TestState.activeWordIndex),
    TestInput.input.current.length - 1
  );

  const activeWordIndex = TestState.activeWordIndex;

  if (TestInput.input.current.length === 1) {
    TestInput.setBurstStart(now);
  }

  void MonkeyPower.addPower(correct);

  if (!correct) {
    TestInput.incrementKeypressErrors();
    TestInput.pushMissedWord(TestWords.words.getCurrent());
  }

  if (Config.keymapMode === "react") {
    void KeymapEvent.flash(data, correct);
  }

  if (data !== " " && Config.oppositeShiftMode !== "off") {
    if (!correctShiftUsed) {
      TestInput.input.setCurrent(TestInput.input.getCurrent().slice(0, -1));
      setInputValue(TestInput.input.getCurrent());
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

  let movingToNextWord = false;
  if (data === " " && TestInput.input.getCurrent().length > 1) {
    movingToNextWord = true;
    TestInput.input.setCurrent(TestInput.input.getCurrent().trimEnd());
    TestInput.input.pushHistory();
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
  } else if (activeWordIndex >= TestWords.words.length - 1) {
    if (
      TestInput.input.getCurrent() === TestWords.words.get(activeWordIndex) ||
      data === " " ||
      (Config.quickEnd &&
        TestInput.input.getCurrent().length ===
          TestWords.words.getCurrent().length)
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
      TestInput.input.setCurrent(word);
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
  }
});

wordsInput.addEventListener("input", (event) => {
  const realInputValue = wordsInput.value;
  const inputValue = wordsInput.value.slice(1);
  const now = performance.now();
  let playCorrectSound = false;

  if (!(event instanceof InputEvent)) {
    event.preventDefault();
    return;
  }

  if (!TestState.isActive) {
    TestLogic.startTest(now);
  }

  TestInput.input.setCurrent(inputValue);

  if (event.inputType === "insertText" && event.data !== null) {
    const correctInsert = onInsertText({
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

  Focus.set(true);
  Caret.stopAnimation();
  TestUI.updateActiveElement();
  void TestUI.updateActiveWordLetters();
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
