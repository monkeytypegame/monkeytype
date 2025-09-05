import {
  InputEventHandler,
  OnInsertTextParams,
  SupportedInputType,
} from "../types";
import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import * as TestInput from "../../test/test-input";
import {
  getInputValue,
  replaceLastInputValueChar,
  setInputValue,
  setTestInputToDOMValue,
} from "../input-element";
import {
  failOrFinish,
  isCharCorrect,
  shouldInsertSpaceCharacter,
} from "../helpers";
import { isSpace } from "../../utils/strings";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import {
  getActiveFunboxesWithFunction,
  isFunboxActiveWithProperty,
} from "../../test/funbox/list";
import * as Replay from "../../test/replay";
import * as MonkeyPower from "../../elements/monkey-power";
import Config from "../../config";
import * as KeymapEvent from "../../observables/keymap-event";
import * as WeakSpot from "../../test/weak-spot";
import * as CompositionState from "../../states/composition";
import {
  getCorrectShiftUsed,
  getIncorrectShiftsInARow,
  incrementIncorrectShiftsInARow,
  resetIncorrectShiftsInARow,
} from "../state";
import * as Notifications from "../../elements/notifications";
import { goToNextWord, goToPreviousWord } from "../word-navigation";
import { emulateInsertText } from "../emulation";

export async function onInsertText({
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

  if (
    data === "…" &&
    TestWords.words.getCurrent()[TestInput.input.current.length] !== "…"
  ) {
    for (let i = 0; i < 3; i++) {
      await onInsertText({
        inputType,
        event,
        data: ".",
        now,
      });
    }

    return;
  }

  console.log(TestWords.words.getCurrent()[TestInput.input.current.length]);

  if (
    data === "œ" &&
    TestWords.words.getCurrent()[TestInput.input.current.length] !== "œ"
  ) {
    await onInsertText({
      inputType,
      event,
      data: "o",
      now,
    });
    await onInsertText({
      inputType,
      event,
      data: "e",
      now,
    });
    return;
  }

  if (
    data === "æ" &&
    TestWords.words.getCurrent()[TestInput.input.current.length] !== "æ"
  ) {
    await onInsertText({
      inputType,
      event,
      data: "a",
      now,
    });
    await onInsertText({
      inputType,
      event,
      data: "e",
      now,
    });
    return;
  }

  const { inputValue } = getInputValue();
  const correct = isCharCorrect(data, inputValue);

  if (TestInput.input.current.length === 0) {
    TestInput.setBurstStart(now);
  }

  const shouldInsertSpace = shouldInsertSpaceCharacter(data) === true;
  const charIsNotSpace = !isSpace(data);
  if (charIsNotSpace || shouldInsertSpace) {
    setTestInputToDOMValue(data === "\n");
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

  if (!isSpace(data) && Config.oppositeShiftMode !== "off") {
    if (!getCorrectShiftUsed()) {
      replaceLastInputValueChar("");
      incrementIncorrectShiftsInARow();
      if (getIncorrectShiftsInARow() >= 5) {
        Notifications.add("Opposite shift mode is on.", 0, {
          important: true,
          customTitle: "Reminder",
        });
      }
    } else {
      resetIncorrectShiftsInARow();
    }
  }

  let visualInputOverride: string | undefined;
  if (Config.stopOnError === "letter" && !correct) {
    if (!Config.blindMode) {
      visualInputOverride = TestInput.input.current;
    }
    replaceLastInputValueChar("");
  }

  // going to next word

  const nospaceEnabled = isFunboxActiveWithProperty("nospace");
  const noSpaceForce =
    nospaceEnabled &&
    TestInput.input.current.length === TestWords.words.getCurrent().length;
  const spaceOrNewLine =
    (isSpace(data) && TestInput.input.current.length > 0) ||
    (data === "\n" && TestInput.input.current.length > 0) ||
    noSpaceForce;

  // this is here and not in beforeInsertText because we want to penalize for incorrect spaces
  // like accuracy, keypress errors, and missed words
  // const stopOnErrorBlock =
  //   (Config.stopOnError === "word" || Config.stopOnError === "letter") &&
  //   Config.difficulty === "normal" &&
  //   !correct;

  const shouldGoToNextWord = spaceOrNewLine && !shouldInsertSpace;

  if (!shouldGoToNextWord) {
    TestInput.corrected.update(data, correct);
  }

  let increasedIndex = null;
  let lastBurst = null;
  if (shouldGoToNextWord) {
    const result = await goToNextWord({
      correctInsert: correct,
    });
    lastBurst = result.lastBurst;
    increasedIndex = result.increasedIndex;
  }

  const currentWord = TestWords.words.getCurrent();
  const doesCurrentWordHaveTab = /^\t+/.test(TestWords.words.getCurrent());
  const isCurrentCharTab = currentWord[TestInput.input.current.length] === "\t";

  if (
    Config.language.startsWith("code") &&
    correct &&
    doesCurrentWordHaveTab &&
    isCurrentCharTab
  ) {
    setTimeout(() => {
      void emulateInsertText("\t", event as KeyboardEvent, now);
    }, 0);
  }

  if (!CompositionState.getComposing()) {
    failOrFinish({
      data: data ?? "",
      correctInsert: correct,
      inputType: "insertText",
      wentToNextWord: shouldGoToNextWord,
      shouldInsertSpace,
      spaceIncreasedIndex: increasedIndex,
      lastBurst,
    });
  }

  TestUI.afterTestTextInput(correct, visualInputOverride);
}

function onDelete({ inputType }: InputEventHandler): void {
  const { realInputValue } = getInputValue();

  setTestInputToDOMValue();

  Replay.addReplayEvent("setLetterIndex", TestInput.input.current.length);
  TestInput.setCurrentNotAfk();

  const onlyTabs = /^\t*$/.test(TestInput.input.current);
  const allTabsCorrect = TestWords.words
    .getCurrent()
    .startsWith(TestInput.input.current);

  //special check for code languages
  if (
    Config.language.startsWith("code") &&
    Config.codeUnindentOnBackspace &&
    onlyTabs &&
    allTabsCorrect
    // (TestInput.input.getHistory(TestState.activeWordIndex - 1) !==
    //   TestWords.words.get(TestState.activeWordIndex - 1) ||
    //   Config.freedomMode)
  ) {
    setInputValue("");
    goToPreviousWord(inputType);
  } else {
    //normal backspace
    if (realInputValue === "") {
      const isFirstVisibleWord =
        TestState.activeWordIndex - TestState.removedUIWordCount === 0;

      if (!isFirstVisibleWord) {
        goToPreviousWord(inputType);
      }
    }
  }

  TestUI.afterTestDelete();
}

export async function handleInput(event: Event): Promise<void> {
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
}
