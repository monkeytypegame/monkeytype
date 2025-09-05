import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import * as TestInput from "../../test/test-input";
import {
  getInputValue,
  getWordsInput,
  replaceLastInputValueChar,
  setTestInputToDOMValue,
} from "../core/input-element";
import {
  checkIfFailedDueToDifficulty,
  checkIfFailedDueToMinBurst,
  checkIfFinished,
} from "../helpers/fail-or-finish";
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
  isCorrectShiftUsed,
  getIncorrectShiftsInARow,
  incrementIncorrectShiftsInARow,
  resetIncorrectShiftsInARow,
} from "../core/state";
import * as Notifications from "../../elements/notifications";
import { goToNextWord } from "../helpers/word-navigation";
import { onBeforeInsertText } from "./beforeinput";
import { onDelete } from "./delete";
import {
  isCharCorrect,
  shouldInsertSpaceCharacter,
} from "../helpers/validation";
import { SupportedInputType } from "../helpers/input-type";

type OnInsertTextParams = {
  event: Event;
  now: number;
  inputType: SupportedInputType;
  data: string;
};

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
    if (!isCorrectShiftUsed()) {
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
    // this is here and not in beforeInsertText because we want to penalize for incorrect spaces
    // like accuracy, keypress errors, and missed words
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

  const shouldGoToNextWord = spaceOrNewLine && !shouldInsertSpace;

  if (!shouldGoToNextWord) {
    TestInput.corrected.update(data, correct);
  }

  let increasedWordIndex: null | boolean = null;
  let lastBurst: null | number = null;
  if (shouldGoToNextWord) {
    const result = await goToNextWord({
      correctInsert: correct,
    });
    lastBurst = result.lastBurst;
    increasedWordIndex = result.increasedWordIndex;
  }

  const currentWord = TestWords.words.getCurrent();
  const doesCurrentWordHaveTab = /^\t+/.test(TestWords.words.getCurrent());
  const isCurrentCharTab = currentWord[TestInput.input.current.length] === "\t";

  //code mode - auto insert tabs
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
    if (increasedWordIndex && checkIfFailedDueToMinBurst(lastBurst)) {
      TestLogic.fail("min burst");
    } else if (checkIfFailedDueToDifficulty(correct, spaceOrNewLine)) {
      TestLogic.fail("difficulty");
    } else if (checkIfFinished(shouldGoToNextWord, increasedWordIndex)) {
      void TestLogic.finish();
    }
  }

  if (!increasedWordIndex) {
    TestUI.afterTestTextInput(correct, visualInputOverride);
  }
}

export async function emulateInsertText(
  data: string,
  event: KeyboardEvent,
  now: number
): Promise<void> {
  const preventDefault = onBeforeInsertText(data);

  if (preventDefault) {
    return;
  }

  // default is prevented so we need to manually update the input value.
  // remember to not call setInputValue or setTestInputToDOMValue in here
  // because onBeforeInsertText can also block the event
  // setInputValue and setTestInputToDOMValue will be called later be updated in onInsertText
  const { inputValue } = getInputValue();
  getWordsInput().value = " " + inputValue + data;

  await onInsertText({
    data,
    now,
    event,
    inputType: "insertText",
  });
}

export async function handleInput(event: InputEvent): Promise<void> {
  const now = performance.now();

  //this is ok to cast because we are preventing default in handleBeforeInput
  // for unsupported input types
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
    onDelete(inputType);
  } else if (inputType === "insertCompositionText") {
    TestUI.afterTestTextInput(true);
  }
}
