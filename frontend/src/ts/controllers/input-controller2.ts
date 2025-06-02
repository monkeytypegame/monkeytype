import Config from "../config";
import * as TestInput from "../test/test-input";
import * as TestUI from "../test/test-ui";
import * as PaceCaret from "../test/pace-caret";
import * as TestState from "../test/test-state";
import * as TestLogic from "../test/test-logic";
import * as TestWords from "../test/test-words";
import * as MonkeyPower from "../elements/monkey-power";
import {
  findSingleActiveFunboxWithFunction,
  getActiveFunboxesWithFunction,
  isFunboxActiveWithProperty,
} from "../test/funbox/list";
import * as KeymapEvent from "../observables/keymap-event";
import * as JSONData from "../utils/json-data";
import * as Notifications from "../elements/notifications";
import * as KeyConverter from "../utils/key-converter";
import * as ShiftTracker from "../test/shift-tracker";
import * as TestStats from "../test/test-stats";
import * as WeakSpot from "../test/weak-spot";
import * as Replay from "../test/replay";
import * as LiveBurst from "../test/live-burst";
import * as Funbox from "../test/funbox/funbox";
import * as Loader from "../elements/loader";
import * as CompositionState from "../states/composition";
import { getCharFromEvent } from "../test/layout-emulator";
import * as Monkey from "../test/monkey";

const wordsInput = document.querySelector("#wordsInput") as HTMLInputElement;

type SupportedInputType =
  | "insertText"
  | "insertCompositionText"
  | "deleteWordBackward"
  | "insertLineBreak"
  | "deleteContentBackward";

const ignoredInputTypes = [
  "insertReplacementText", //todo reconsider
  "insertParagraph",
  "insertOrderedList",
  "insertUnorderedList",
  "insertHorizontalRule",
  "insertFromYank",
  "insertFromDrop",
  "insertFromPaste",
  "insertFromPasteAsQuotation",
  "insertTranspose",
  "insertLink",
  "deleteSoftLineBackward",
  "deleteSoftLineForward",
  "deleteEntireSoftLine",
  "deleteHardLineBackward",
  "deleteHardLineForward",
  "deleteByDrag",
  "deleteByCut",
  "deleteContent", // might break things?
  "deleteContentForward",
  "history*",
  "format*",
];

let correctShiftUsed = true;
let incorrectShiftsInARow = 0;
let awaitingNextWord = false;

function isCharCorrect(data: string): boolean {
  if (Config.mode === "zen") return true;

  let { inputValue } = getInputValue();

  if (data === "\n") {
    inputValue += "\n";
  }

  const index = inputValue.length - 1;

  const targetWord = TestWords.words.get(TestState.activeWordIndex);

  const input = inputValue[index];
  const target = targetWord[index];

  if (inputValue === targetWord + " ") {
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

  const funbox = findSingleActiveFunboxWithFunction("isCharCorrect");
  if (funbox) {
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

type GoToNextWordParams = {
  correctInsert: boolean;
};
async function goToNextWord({
  correctInsert,
}: GoToNextWordParams): Promise<void> {
  TestUI.beforeTestWordChange("forward");

  if (!correctInsert) {
    TestUI.highlightBadWord(
      TestState.activeWordIndex - TestUI.activeWordElementOffset
    );
  }

  for (const fb of getActiveFunboxesWithFunction("handleSpace")) {
    fb.functions.handleSpace();
  }

  PaceCaret.handleSpace(correctInsert, TestWords.words.getCurrent());

  Funbox.toggleScript(TestWords.words.get(TestState.activeWordIndex + 1));

  const burst: number = TestStats.calculateBurst();
  void LiveBurst.update(Math.round(burst));
  TestInput.pushBurstToHistory(burst);

  const lastWord = TestState.activeWordIndex >= TestWords.words.length - 1;
  if (lastWord) {
    awaitingNextWord = true;
    Loader.show();
    await TestLogic.addWord();
    Loader.hide();
    awaitingNextWord = false;
  } else {
    await TestLogic.addWord();
  }
  TestInput.input.pushHistory();
  TestInput.corrected.pushHistory();
  if (
    TestState.activeWordIndex < TestWords.words.length - 1 ||
    Config.mode === "zen"
  ) {
    TestState.increaseActiveWordIndex();
  }

  setInputValue("");
  TestUI.afterTestWordChange("forward");
}

function goToPreviousWord(inputType: SupportedInputType): void {
  if (TestState.activeWordIndex === 0) {
    setInputValue("");
    return;
  }

  TestUI.beforeTestWordChange("back");

  const word = TestInput.input.popHistory();
  TestState.decreaseActiveWordIndex();
  TestInput.corrected.popHistory();

  Funbox.toggleScript(TestWords.words.get(TestState.activeWordIndex));

  const nospaceEnabled = isFunboxActiveWithProperty("nospace");

  if (inputType === "deleteWordBackward") {
    setInputValue("");
  } else if (inputType === "deleteContentBackward") {
    if (nospaceEnabled) {
      setInputValue(word.slice(0, -1));
    } else {
      setInputValue(word);
    }
  }
  TestUI.afterTestWordChange("back");
}

type FailOrFinishParams = {
  data: string;
  correctInsert: boolean;
  inputType: SupportedInputType;
  dataStoppedByStopOnLetter: string | null;
};

function failOrFinish({
  data,
  correctInsert,
  dataStoppedByStopOnLetter,
}: FailOrFinishParams): void {
  const input = TestInput.input.current + (dataStoppedByStopOnLetter ?? "");

  const shouldFailDueToExpert =
    !correctInsert &&
    data === " " &&
    Config.difficulty === "expert" &&
    input.length > 1;
  const shouldFailDueToMaster =
    !correctInsert && Config.difficulty === "master";

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    TestLogic.fail("difficulty");
    console.log("failing difficulty");
  } else {
    const currentWord = TestWords.words.getCurrent();
    const lastWord = TestState.activeWordIndex >= TestWords.words.length - 1;
    const allWordGenerated = TestLogic.areAllTestWordsGenerated();
    const wordIsCorrect =
      TestInput.input.current ===
      TestWords.words.get(TestState.activeWordIndex);
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
}

type InputEventHandler = {
  event: Event;
  now: number;
  inputType: SupportedInputType;
};

type OnInsertTextParams = InputEventHandler & {
  data: string;
};

function onBeforeDelete({ event }: InputEventHandler): void {
  if (!TestState.isActive) {
    event.preventDefault();
    return;
  }

  const freedomMode = Config.freedomMode;
  if (freedomMode) {
    //allow anything in freedom mode
    return;
  }

  const { inputValue } = getInputValue();

  const confidence = Config.confidenceMode;
  const previousWordCorrect =
    (TestInput.input.get(TestState.activeWordIndex - 1) ?? "") ===
    TestWords.words.get(TestState.activeWordIndex - 1);
  const inputIsEmpty = inputValue === "";

  if (confidence === "on" && inputIsEmpty && !previousWordCorrect) {
    event.preventDefault();
  }

  if (confidence === "max") {
    event.preventDefault();
  }

  if (inputIsEmpty && previousWordCorrect) {
    event.preventDefault();
  }
}

function onBeforeInsertText({ data }: OnInsertTextParams): boolean {
  let preventDefault = false;

  const { inputValue } = getInputValue();

  //prevent space from being inserted if input is empty
  //allow if strict space is enabled
  if (
    data === " " &&
    inputValue === "" &&
    Config.difficulty === "normal" &&
    !Config.strictSpace
  ) {
    preventDefault = true;
  }

  //prevent space in nospace funbox
  if (data === " " && isFunboxActiveWithProperty("nospace")) {
    preventDefault = true;
  }

  //prevent the word from jumping to the next line if the word is too long
  //this will not work for the first word of each line, but that has a low chance of happening
  if (
    data !== null &&
    data !== "" &&
    TestInput.input.current.length >= TestWords.words.getCurrent().length &&
    TestUI.getActiveWordTopAfterAppend(data) > TestUI.activeWordTop &&
    Config.mode !== "zen"
  ) {
    return true;
  }

  // block input if the word is too long
  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrent().length + 20;
  if (TestInput.input.current.length >= inputLimit && data !== " ") {
    console.error("Hitting word limit");
    preventDefault = true;
  }

  return preventDefault;
}

async function onInsertText({
  inputType,
  data,
  event,
  now,
}: OnInsertTextParams): Promise<void> {
  if (data.length > 1) {
    for (const char of data) {
      await onInsertText({
        inputType,
        event,
        data: char,
        now,
      });
    }

    return;
  }

  const correct = isCharCorrect(data);

  const shouldInsertSpace =
    data === " " && Config.stopOnError === "word" && !correct;
  const charIsNotSpace = data !== " ";
  if (charIsNotSpace || shouldInsertSpace) {
    setTestInputToDOMValue();
  }

  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(now);
  }

  TestInput.setCurrentNotAfk();

  for (const fb of getActiveFunboxesWithFunction("handleChar")) {
    data = fb.functions.handleChar(data);
    replaceLastInputValueChar(data);
  }

  Replay.addReplayEvent(correct ? "correctLetter" : "incorrectLetter", data);

  if (TestInput.input.current.length === 1) {
    TestInput.setBurstStart(now);
  }

  void MonkeyPower.addPower(correct);
  TestInput.incrementAccuracy(correct);

  if (!correct) {
    TestInput.incrementKeypressErrors();
    TestInput.pushMissedWord(TestWords.words.getCurrent());
  }
  TestInput.incrementKeypressCount();
  TestInput.pushKeypressWord(TestState.activeWordIndex);
  TestInput.corrected.update(data, correct);

  if (Config.keymapMode === "react") {
    void KeymapEvent.flash(data, correct);
  }

  WeakSpot.updateScore(data, correct);

  if (data !== " " && Config.oppositeShiftMode !== "off") {
    if (!correctShiftUsed) {
      replaceLastInputValueChar("");
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

  let dataStoppedByStopOnLetter: string | null = null;
  let visualInputOverride: string | undefined;
  if (Config.stopOnError === "letter" && !correct) {
    if (!Config.blindMode) {
      visualInputOverride = TestInput.input.current;
    }
    dataStoppedByStopOnLetter = data;
    replaceLastInputValueChar("");
  }

  if (!CompositionState.getComposing()) {
    failOrFinish({
      data: data ?? "",
      correctInsert: correct,
      dataStoppedByStopOnLetter,
      inputType: "insertText",
    });
  }

  TestUI.afterTestTextInput(correct, visualInputOverride);

  // going to next word

  const nospace = isFunboxActiveWithProperty("nospace");
  const noSpaceForce =
    nospace &&
    TestInput.input.current.length === TestWords.words.getCurrent().length;
  const shouldMoveToNextWord =
    (data === " " && TestInput.input.current.length > 0) ||
    (data === "\n" && TestInput.input.current.length > 0) ||
    noSpaceForce;

  // this is here and not in beforeInsertText because we want to penalize for incorrect spaces
  // like accuracy, keypress errors, and missed words
  const stopOnErrorBlock =
    (Config.stopOnError === "word" || Config.stopOnError === "letter") &&
    !correct;
  if (!stopOnErrorBlock && shouldMoveToNextWord) {
    await goToNextWord({
      correctInsert: correct,
    });
  }
}

function onDelete({ inputType }: InputEventHandler): void {
  const { realInputValue } = getInputValue();

  setTestInputToDOMValue();
  if (realInputValue === "") {
    goToPreviousWord(inputType);
  }
  TestUI.afterTestDelete();
  TestInput.setCurrentNotAfk();
}

function replaceLastInputValueChar(char: string): void {
  const { inputValue } = getInputValue();
  setInputValue(inputValue.slice(0, -1) + char);
}

function setInputValue(value: string): void {
  wordsInput.value = " " + value;
  setTestInputToDOMValue();
}

function setTestInputToDOMValue(): void {
  TestInput.input.current = getInputValue().inputValue;
}

function getInputValue(): { inputValue: string; realInputValue: string } {
  return {
    inputValue: wordsInput.value.slice(1),
    realInputValue: wordsInput.value,
  };
}

async function emulateInsertText(
  data: string,
  event: KeyboardEvent,
  now: number
): Promise<void> {
  // default is prevented so we need to manually update the input value.
  // remember to not call setInputValue or setTestInputToDOMValue in here
  // because onBeforeInsertText can also block the event
  // setInputValue and setTestInputToDOMValue will be called later be updated in onInsertText
  const { inputValue } = getInputValue();
  wordsInput.value = " " + inputValue + data;

  onBeforeInsertText({
    data,
    now,
    event,
    inputType: "insertText",
  });
  await onInsertText({
    data,
    now,
    event,
    inputType: "insertText",
  });
}

wordsInput.addEventListener("beforeinput", (event) => {
  console.debug("wordsInput event beforeinput", {
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });

  for (const ignoredInputType of ignoredInputTypes) {
    let prevent = false;
    if (ignoredInputType.endsWith("*")) {
      if (event.inputType.startsWith(ignoredInputType.slice(0, -1))) {
        prevent = true;
      }
    } else {
      if (event.inputType === ignoredInputType) {
        prevent = true;
      }
    }
    if (prevent) {
      event.preventDefault();
      return;
    }
  }

  if (awaitingNextWord) {
    event.preventDefault();
    return;
  }

  if (TestUI.resultCalculating) {
    event.preventDefault();
    return;
  }

  const inputType = event.inputType as SupportedInputType;
  const now = performance.now();

  // beforeinput is always typed as inputevent but input is not?
  // if (!(event instanceof InputEvent)) {
  // event.preventDefault();
  // return;
  // }

  if (inputType === "insertText" && event.data !== null) {
    const preventDefault = onBeforeInsertText({
      inputType,
      data: event.data,
      event,
      now,
    });
    if (preventDefault) {
      event.preventDefault();
    }
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onBeforeDelete({
      inputType,
      event,
      now,
    });
  }
});

wordsInput.addEventListener("input", async (event) => {
  if (!(event instanceof InputEvent)) {
    //since the listener is on an input element, this should never trigger
    //but its here to narrow the type of "event"
    event.preventDefault();
    return;
  }

  console.debug("wordsInput event input", {
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });

  const now = performance.now();

  //this is ok to cast because we are preventing default from anything else
  const inputType = event.inputType as SupportedInputType;

  if (inputType === "insertText" && event.data !== null) {
    await onInsertText({
      inputType,
      event,
      data: event.data,
      now,
    });
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onDelete({
      inputType,
      event,
      now,
    });
  } else if (inputType === "insertCompositionText") {
    TestUI.afterTestTextInput(true);
  }
});

wordsInput.addEventListener("focus", (event) => {
  wordsInput.selectionStart = wordsInput.value.length;
  wordsInput.selectionEnd = wordsInput.value.length;
});

wordsInput.addEventListener("copy paste", (event) => {
  event.preventDefault();
});

wordsInput.addEventListener("select selectstart", (event) => {
  event.preventDefault();
});

wordsInput.addEventListener("selectionchange", (event) => {
  event.preventDefault();
  wordsInput.selectionStart = wordsInput.value.length;
  wordsInput.selectionEnd = wordsInput.value.length;
});

wordsInput.addEventListener("keydown", async (event) => {
  console.debug("wordsInput event keydown", {
    key: event.key,
    code: event.code,
  });

  const now = performance.now();

  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown"
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

  const arrowsActive = Config.funbox.includes("arrows");
  if (event.key.startsWith("Arrow")) {
    if (arrowsActive) {
      const map: Record<string, string> = {
        ArrowUp: "w",
        ArrowDown: "s",
        ArrowLeft: "a",
        ArrowRight: "d",
      };

      const char = map[event.key];

      if (char !== undefined) {
        await emulateInsertText(char, event, now);
        event.preventDefault();
        return;
      }
    } else {
      event.preventDefault();
      return;
    }
  }

  if (!event.repeat) {
    //delaying because type() is called before show()
    // meaning the first keypress of the test is not animated
    setTimeout(() => {
      Monkey.type(event);
    }, 0);
  }

  if (event.key === "Tab") {
    if (Config.quickRestart === "tab") {
      event.preventDefault();
      if ((TestWords.hasTab && event.shiftKey) || !TestWords.hasTab) {
        TestLogic.restart();
        return;
      }
    }
    if (TestWords.hasTab) {
      await emulateInsertText("\t", event, now);
      event.preventDefault();
      return;
    }
  }

  if (event.key === "Enter") {
    if (Config.quickRestart === "enter") {
      event.preventDefault();
      if ((TestWords.hasNewline && event.shiftKey) || !TestWords.hasNewline) {
        TestLogic.restart();
        return;
      }
    }
    if (TestWords.hasNewline) {
      await emulateInsertText("\n", event, now);
      event.preventDefault();
      return;
    }
  }

  if (event.key === "Escape" && Config.quickRestart === "esc") {
    event.preventDefault();
    TestLogic.restart();
    return;
  }

  if (Config.layout !== "default") {
    const emulatedChar = await getCharFromEvent(event);

    if (emulatedChar !== null) {
      await emulateInsertText(emulatedChar, event, now);
      event.preventDefault();
      return;
    }
  }
});

wordsInput.addEventListener("keyup", (event) => {
  console.debug("wordsInput event keyup", {
    key: event.key,
    code: event.code,
  });

  // const now = performance.now();

  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown"
  ) {
    event.preventDefault();
    return;
  }

  const arrowsActive = Config.funbox.includes("arrows");
  if (event.key.startsWith("Arrow") && !arrowsActive) {
    event.preventDefault();
    return;
  }

  setTimeout(() => {
    Monkey.stop(event);
  }, 0);
});

wordsInput.addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", { data: event.data });
  CompositionState.setComposing(true);
});

wordsInput.addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", { data: event.data });
  CompositionState.setData(event.data);
});

wordsInput.addEventListener("compositionend", async (event) => {
  console.debug("wordsInput event compositionend", { data: event.data });
  CompositionState.setComposing(false);
  CompositionState.setData("");

  const now = performance.now();

  await onInsertText({
    event,
    inputType: "insertText",
    data: event.data,
    now,
  });
});
