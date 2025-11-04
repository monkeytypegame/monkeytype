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
import { isFunboxActiveWithProperty } from "../../test/funbox/list";
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
  getLastInsertCompositionTextData,
  setLastInsertCompositionTextData,
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

const charOverrides = new Map<string, string>([
  ["…", "..."],
  ["œ", "oe"],
  ["æ", "ae"],
]);

type OnInsertTextParams = {
  // might need later?
  // inputType: SupportedInputType;
  // event: Event;

  // timing information
  now: number;
  // data being inserted
  data: string;
  // true if called by compositionEnd
  isCompositionEnding?: true;
} & (
  | {
      // this is for handling multi character inputs
      // need to keep track which character we are checking
      multiIndex: number;
      // are we on the last character of a multi character input
      lastInMultiIndex: boolean;
    }
  | {
      multiIndex?: undefined;
      lastInMultiIndex?: undefined;
    }
);

export async function onInsertText(options: OnInsertTextParams): Promise<void> {
  const { data, now, multiIndex, lastInMultiIndex, isCompositionEnding } =
    options;

  if (data.length > 1) {
    // remove the entire data from the input value
    // not using setInputValue because we dont want to update TestInput yet
    // it will be updated later in the body of onInsertText
    const { inputValue } = getInputValue();
    getWordsInput().value = " " + inputValue.slice(0, -data.length);

    for (let i = 0; i < data.length; i++) {
      const char = data[i] as string;

      // then add it one by one
      await emulateInsertText({
        ...options,
        data: char,
        multiIndex: i,
        lastInMultiIndex: i === data.length - 1,
      });
    }
    return;
  }

  const charOverride = charOverrides.get(data);
  if (
    charOverride !== undefined &&
    TestWords.words.getCurrent()[TestInput.input.current.length] !== data
  ) {
    for (const char of charOverride) {
      await onInsertText({
        ...options,
        data: char,
      });
    }
    return;
  }

  const lastInMultiOrSingle = multiIndex === undefined || lastInMultiIndex;
  const correctShiftUsed =
    Config.oppositeShiftMode === "off" ? null : isCorrectShiftUsed();

  const { inputValue } = getInputValue();
  const correct = isCharCorrect(data, inputValue, correctShiftUsed, multiIndex);

  if (!isSpace(data) && correctShiftUsed === false) {
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

  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(now);
  }

  if (TestInput.input.current.length === 0) {
    TestInput.setBurstStart(now);
  }

  const shouldInsertSpace = shouldInsertSpaceCharacter(data) === true;
  const charIsNotSpace = !isSpace(data);
  if (charIsNotSpace || shouldInsertSpace) {
    setTestInputToDOMValue(data === "\n");
  }

  TestInput.setCurrentNotAfk();

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

  let visualInputOverride: string | undefined;
  if (
    Config.stopOnError === "letter" &&
    !correct &&
    Config.difficulty === "normal"
  ) {
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
  const spaceOrNewLine = isSpace(data) || data === "\n";

  const shouldGoToNextWord =
    (spaceOrNewLine && !shouldInsertSpace) || noSpaceForce;

  if (!shouldGoToNextWord) {
    TestInput.corrected.update(data, correct);
  }

  let increasedWordIndex: null | boolean = null;
  let lastBurst: null | number = null;
  if (shouldGoToNextWord) {
    const result = await goToNextWord({
      correctInsert: correct,
      isCompositionEnding: isCompositionEnding === true,
    });
    lastBurst = result.lastBurst;
    increasedWordIndex = result.increasedWordIndex;
  }

  /*
  Probably a good place to explain what the heck is going on with all these space related variables:
   - spaceOrNewLine: did the user input a space or a new line?
   - shouldInsertSpace: should space be treated as a character, or should it move us to the next word
     monkeytype doesnt actually have space characters in words, so we need this distinction
     and also moving to the next word might get blocked by things like stop on error
   - shouldGoToNextWord: IF input is space and we DONT insert a space CHARACTER, we will TRY to go to the next word
   - increasedWordIndex: the only reason this is here because on the last word we dont move to the next word
  */

  //this COULD be the next word because we are awaiting goToNextWord
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
      void emulateInsertText({ data: "\t", now });
    }, 0);
  }

  if (!CompositionState.getComposing() && lastInMultiOrSingle) {
    if (checkIfFailedDueToDifficulty(spaceOrNewLine)) {
      TestLogic.fail("difficulty");
    } else if (increasedWordIndex && checkIfFailedDueToMinBurst(lastBurst)) {
      TestLogic.fail("min burst");
    } else if (checkIfFinished(shouldGoToNextWord, increasedWordIndex)) {
      void TestLogic.finish();
    }
  }

  if (lastInMultiOrSingle) {
    TestUI.afterTestTextInput(correct, increasedWordIndex, visualInputOverride);
  }
}

export async function emulateInsertText(
  options: OnInsertTextParams
): Promise<void> {
  const preventDefault = onBeforeInsertText(options.data);

  if (preventDefault) {
    return;
  }

  // default is prevented so we need to manually update the input value.
  // remember to not call setInputValue or setTestInputToDOMValue in here
  // because onBeforeInsertText can also block the event
  // setInputValue and setTestInputToDOMValue will be called later be updated in onInsertText
  const { inputValue } = getInputValue();
  getWordsInput().value = " " + inputValue + options.data;

  await onInsertText(options);
}

export async function handleInput(event: InputEvent): Promise<void> {
  const now = performance.now();

  // this is ok to cast because we are preventing default
  // in handleBeforeInput for unsupported input types
  const inputType = event.inputType as SupportedInputType;

  if (inputType === "insertText" && event.data !== null) {
    await onInsertText({
      data: event.data,
      now,
    });
  } else if (
    inputType === "deleteWordBackward" ||
    inputType === "deleteContentBackward"
  ) {
    onDelete(inputType);
  } else if (
    inputType === "insertCompositionText" &&
    getLastInsertCompositionTextData() !== event.data
  ) {
    // in case the data is the same as the last one, just ignore it
    setLastInsertCompositionTextData(event.data ?? "");
    TestUI.afterTestCompositionUpdate();
  }
}
