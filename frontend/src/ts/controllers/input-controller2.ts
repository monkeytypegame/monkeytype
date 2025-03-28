import Config from "../config";
import * as TestInput from "../test/test-input";
import * as TestUI from "../test/test-ui";
import * as PaceCaret from "../test/pace-caret";
import * as TestState from "../test/test-state";
import * as TestLogic from "../test/test-logic";
import * as TestWords from "../test/test-words";
import * as MonkeyPower from "../elements/monkey-power";
import { getActiveFunboxes } from "../test/funbox/list";
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

function isCharCorrect(
  inputWord: string,
  targetWord: string,
  index: number
): boolean {
  if (Config.mode === "zen") return true;

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

type GoToNextWordParams = {
  forceNextWord: boolean;
  correctInsert: boolean;
};
async function goToNextWord({
  forceNextWord,
  correctInsert,
}: GoToNextWordParams): Promise<void> {
  if (forceNextWord) {
    void TestUI.updateActiveWordLetters();
  }

  if (!correctInsert) {
    TestUI.highlightBadWord(
      TestState.activeWordIndex - TestUI.activeWordElementOffset
    );
  }

  for (const fb of getActiveFunboxes()) {
    fb.functions?.handleSpace?.();
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
  const inputTrimmed = TestInput.input.current.trimEnd();
  TestInput.input.current = inputTrimmed;
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

  const word = TestInput.input.popHistory();
  TestState.decreaseActiveWordIndex();
  TestInput.corrected.popHistory();

  if (inputType === "deleteWordBackward") {
    TestInput.input.current = "";
    setInputValue("");
  } else if (inputType === "deleteContentBackward") {
    const nospace =
      getActiveFunboxes().find((f) => f.properties?.includes("nospace")) !==
      undefined;

    if (nospace) {
      TestInput.input.current = word.slice(0, -1);
      setInputValue(word.slice(0, -1));
    } else {
      TestInput.input.current = word;
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
  inputValue: string;
  realInputValue: string;
  event: Event;
  now: number;
  inputType: SupportedInputType;
};

type OnInsertTextParams = InputEventHandler & {
  data: string;
};

function onBeforeDelete({ inputValue, event }: InputEventHandler): void {
  if (!TestState.isActive) {
    event.preventDefault();
    return;
  }

  const freedomMode = Config.freedomMode;
  if (freedomMode) {
    //allow anything in freedom mode
    return;
  }

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

function onBeforeInsertText({ data, inputValue }: OnInsertTextParams): boolean {
  let preventDefault = false;

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
  inputValue,
  realInputValue,
  data,
  event,
  now,
}: OnInsertTextParams): Promise<void> {
  if (data.length > 1) {
    for (const char of data) {
      await onInsertText({
        inputType,
        event,
        inputValue,
        realInputValue,
        data: char,
        now,
      });
    }

    return;
  }

  for (const fb of getActiveFunboxes()) {
    if (fb.functions?.handleChar) {
      data = fb.functions.handleChar(data);
      TestInput.input.replaceCurrentLastChar(data);
      setInputValue(TestInput.input.current);
    }
  }

  const correct = isCharCorrect(
    TestInput.input.current,
    TestWords.words.get(TestState.activeWordIndex),
    TestInput.input.current.length - 1
  );

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

  if (Config.keymapMode === "react") {
    void KeymapEvent.flash(data, correct);
  }

  WeakSpot.updateScore(data, correct);

  if (data !== " " && Config.oppositeShiftMode !== "off") {
    if (!correctShiftUsed) {
      TestInput.input.replaceCurrentLastChar("");
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

  TestInput.corrected.update(data, correct);

  let dataStoppedByStopOnLetter: string | null = null;
  let inputOverride: string | undefined;
  if (Config.stopOnError === "letter" && !correct) {
    dataStoppedByStopOnLetter = data;
    inputOverride = TestInput.input.current;
    TestInput.input.replaceCurrentLastChar("");
    setInputValue(TestInput.input.current);
  }

  if (!CompositionState.getComposing()) {
    failOrFinish({
      data: data ?? "",
      correctInsert: correct,
      dataStoppedByStopOnLetter,
      inputType: "insertText",
    });
  }

  const nospace =
    getActiveFunboxes().find((f) => f.properties?.includes("nospace")) !==
    undefined;
  const forceNextWord =
    nospace &&
    TestInput.input.current.length === TestWords.words.getCurrent().length;
  const stopOnWordBlock = Config.stopOnError === "word" && !correct;

  let movingToNextWord = false;
  if (
    (data === " " && TestInput.input.current.length > 1 && !stopOnWordBlock) ||
    (forceNextWord && !stopOnWordBlock)
  ) {
    movingToNextWord = true;
    await goToNextWord({
      forceNextWord,
      correctInsert: correct,
    });
  }

  TestUI.afterTestTextInput(correct, movingToNextWord, inputOverride);
}

function onDelete({ inputType, realInputValue }: InputEventHandler): void {
  if (realInputValue === "") {
    goToPreviousWord(inputType);
  }
  TestUI.afterTestDelete();
}

function setInputValue(value: string): void {
  wordsInput.value = " " + value;
}

wordsInput.addEventListener("beforeinput", (event) => {
  console.debug("wordsInput event beforeinput", {
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });

  for (const ignoredInputType of ignoredInputTypes) {
    if (ignoredInputType.endsWith("*")) {
      if (event.inputType.startsWith(ignoredInputType.slice(0, -1))) {
        event.preventDefault();
        return;
      }
    } else {
      if (event.inputType === ignoredInputType) {
        event.preventDefault();
        return;
      }
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

  const realInputValue = wordsInput.value;
  const inputValue = wordsInput.value.slice(1);
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
      inputValue,
      realInputValue,
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
      inputValue,
      realInputValue,
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

  const realInputValue = wordsInput.value;
  const inputValue = wordsInput.value.slice(1);
  const now = performance.now();

  //this is ok to cast because we are preventing default from anything else
  const inputType = event.inputType as SupportedInputType;

  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(now);
  }

  TestInput.setCurrentNotAfk();

  if (inputType === "insertText" && event.data !== null) {
    TestInput.input.current = wordsInput.value.slice(1);
    await onInsertText({
      inputType,
      inputValue,
      realInputValue,
      event,
      data: event.data,
      now,
    });
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    TestInput.input.current = wordsInput.value.slice(1);
    onDelete({
      inputType,
      inputValue,
      realInputValue,
      event,
      now,
    });
  } else if (inputType === "insertCompositionText") {
    TestUI.afterTestTextInput(true, false);
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
  if (
    event.key.startsWith("Arrow") ||
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

  const realInputValue = wordsInput.value;
  const inputValue = wordsInput.value.slice(1);
  const now = performance.now();

  TestInput.input.current = wordsInput.value.slice(1);
  await onInsertText({
    event,
    inputType: "insertText",
    realInputValue,
    inputValue,
    data: event.data,
    now,
  });
});
