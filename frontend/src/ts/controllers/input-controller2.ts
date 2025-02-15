import Config from "../config";
import * as TestInput from "../test/test-input";
import * as TestUI from "../test/test-ui";
import * as Caret from "../test/caret";
import * as PaceCaret from "../test/pace-caret";
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
import * as WeakSpot from "../test/weak-spot";
import * as Replay from "../test/replay";
import * as LiveBurst from "../test/live-burst";
import * as Funbox from "../test/funbox/funbox";
import * as Loader from "../elements/loader";
import * as TimerProgress from "../test/timer-progress";

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

function handleChar(data: string, now: number): OnInsertTextReturn {
  let goToNextWord = true;

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

  if (Config.stopOnError === "letter" && !correct) {
    TestInput.input.replaceCurrentLastChar("");
    setInputValue(TestInput.input.current);
    goToNextWord = false;
  }

  if (Config.stopOnError === "word" && !correct) {
    goToNextWord = false;
  }

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

  return {
    correct,
    goToNextWord,
  };
}

type InputEventHandler = {
  inputValue: string;
  realInputValue: string;
  event: InputEvent;
  now: number;
  inputType: SupportedInputType;
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
  if (
    data === " " &&
    inputValue === "" &&
    Config.difficulty === "normal" &&
    !Config.strictSpace
  ) {
    event?.preventDefault();
  }

  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrent().length + 20;

  if (TestInput.input.current.length >= inputLimit) {
    console.error("Hitting word limit");
    event.preventDefault();
  }
}

type OnInsertTextReturn = {
  correct: boolean;
  goToNextWord: boolean;
};

function onInsertText({
  data,
  event,
  now,
}: OnInsertTextParams): OnInsertTextReturn {
  if (data.length > 1) {
    throw new Error("Multi char input not supported");
  }

  const charReturn = handleChar(data, now);

  return {
    correct: charReturn.correct,
    goToNextWord: charReturn.goToNextWord,
  };
}

function onContentDelete({
  inputType,
  realInputValue,
}: InputEventHandler): void {
  if (realInputValue === "") {
    if (TestState.activeWordIndex > 0) {
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
    } else {
      setInputValue("");
    }
  }
}

function setInputValue(value: string): void {
  wordsInput.value = " " + value;
}

wordsInput.addEventListener("beforeinput", (event) => {
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

  const inputType = event.inputType as SupportedInputType;

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

  if (inputType === "insertText" && event.data !== null) {
    onBeforeInsertText({
      inputType,
      data: event.data,
      inputValue,
      realInputValue,
      event,
      now,
    });
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onBeforeContentDelete({
      inputType,
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
  let correctInsert = false;
  let goToNextWord = false;

  if (!(event instanceof InputEvent)) {
    event.preventDefault();
    return;
  }

  //this is ok to cast because we are preventing default from anything else
  const inputType = event.inputType as SupportedInputType;

  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(now);
  }

  TestInput.input.current = wordsInput.value.slice(1);

  if (inputType === "insertText" && event.data !== null) {
    const onInsertReturn = onInsertText({
      inputType,
      inputValue,
      realInputValue,
      event,
      data: event.data,
      now,
    });
    correctInsert = onInsertReturn.correct;
    goToNextWord = onInsertReturn.goToNextWord;
    playCorrectSound = correctInsert;
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    playCorrectSound = true;
    onContentDelete({
      inputType,
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

  const acc: number = Numbers.roundTo2(TestStats.calculateAccuracy());
  if (!isNaN(acc)) LiveAcc.update(acc);

  if (
    (Config.difficulty === "expert" &&
      event.data === " " &&
      !correctInsert &&
      goToNextWord &&
      TestInput.input.current.length > 1) ||
    (Config.difficulty === "master" && !correctInsert)
  ) {
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
    const shouldSpaceEnd = event.data === " " && Config.stopOnError === "off";

    if (
      lastWord &&
      allWordGenerated &&
      (wordIsCorrect || shouldQuickEnd || shouldSpaceEnd)
    ) {
      void TestLogic.finish();
    }
  }

  const nospace =
    getActiveFunboxes().find((f) => f.properties?.includes("nospace")) !==
    undefined;

  const forceNextWord =
    nospace &&
    TestInput.input.current.length === TestWords.words.getCurrent().length;

  const stopOnWordBlock = Config.stopOnError === "word" && !correctInsert;

  if (
    (inputType === "insertText" &&
      event.data === " " &&
      TestInput.input.current.length > 1 &&
      goToNextWord) ||
    (inputType === "insertText" && forceNextWord && !stopOnWordBlock)
  ) {
    if (forceNextWord) {
      void TestUI.updateActiveWordLetters();
    }

    if (!correctInsert) {
      TestUI.highlightBadWord(TestState.activeWordIndex);
    }

    for (const fb of getActiveFunboxes()) {
      fb.functions?.handleSpace?.();
    }

    PaceCaret.handleSpace(correctInsert, TestWords.words.getCurrent());

    const burst: number = TestStats.calculateBurst();
    void LiveBurst.update(Math.round(burst));
    TestInput.pushBurstToHistory(burst);

    const inputTrimmed = TestInput.input.current.trimEnd();
    TestInput.input.current = inputTrimmed;
    TestInput.input.pushHistory();
    TestInput.corrected.pushHistory();
    if (TestState.activeWordIndex < TestWords.words.length - 1) {
      TestState.increaseActiveWordIndex();
    }

    Funbox.toggleScript(TestWords.words.getCurrent());

    setInputValue("");
  }

  let override: string | undefined = undefined;
  if (
    inputType === "insertText" &&
    Config.stopOnError === "letter" &&
    !correctInsert
  ) {
    override = TestInput.input.current + event.data;
  }

  Focus.set(true);
  Caret.stopAnimation();
  TestUI.updateActiveElement();
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
