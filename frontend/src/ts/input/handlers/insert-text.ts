import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
import * as TestInput from "../../test/test-input";
import {
  getInputElementValue,
  replaceInputElementLastValueChar,
  setInputElementValue,
  appendToInputElementValue,
} from "../input-element";
import {
  checkIfFailedDueToDifficulty,
  checkIfFailedDueToMinBurst,
  checkIfFinished,
} from "../helpers/fail-or-finish";
import { areCharactersVisuallyEqual, isSpace } from "../../utils/strings";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import {
  findSingleActiveFunboxWithFunction,
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
} from "../state";
import * as Notifications from "../../elements/notifications";
import { goToNextWord } from "../helpers/word-navigation";
import { onBeforeInsertText } from "./before-insert-text";
import {
  isCharCorrect,
  shouldInsertSpaceCharacter,
} from "../helpers/validation";

const charOverrides = new Map<string, string>([
  ["…", "..."],
  // ["œ", "oe"],
  // ["æ", "ae"],
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
  // are we on the last character of a multi character input
  lastInMultiIndex?: boolean;
};

export async function onInsertText(options: OnInsertTextParams): Promise<void> {
  const { now, lastInMultiIndex, isCompositionEnding } = options;
  const { inputValue } = getInputElementValue();

  if (options.data.length > 1) {
    // remove the entire data from the input value
    // make sure to not call TestInput.input.syncWithInputElement in here
    // it will be updated later in the body of onInsertText
    setInputElementValue(inputValue.slice(0, -options.data.length));
    for (let i = 0; i < options.data.length; i++) {
      const char = options.data[i] as string;

      // then add it one by one
      await emulateInsertText({
        ...options,
        data: char,
        lastInMultiIndex: i === options.data.length - 1,
      });
    }
    return;
  }

  const charOverride = charOverrides.get(options.data);
  if (
    charOverride !== undefined &&
    TestWords.words.getCurrent()[TestInput.input.current.length] !==
      options.data
  ) {
    await onInsertText({
      ...options,
      data: charOverride,
    });
    return;
  }

  // if the character is visually equal, replace it with the target character
  // this ensures all future equivalence checks work correctly
  let normalizedData: string | null = null;
  const targetChar =
    TestWords.words.getCurrent()[TestInput.input.current.length];
  if (
    targetChar !== undefined &&
    areCharactersVisuallyEqual(options.data, targetChar, Config.language)
  ) {
    replaceInputElementLastValueChar(targetChar);
    normalizedData = targetChar;
  }

  const data = normalizedData ?? options.data;

  // start if needed
  if (!TestState.isActive) {
    TestLogic.startTest(now);
  }

  // helper consts
  const lastInMultiOrSingle =
    lastInMultiIndex === true || lastInMultiIndex === undefined;
  const testInput = TestInput.input.current;
  const currentWord = TestWords.words.getCurrent();
  const wordIndex = TestState.activeWordIndex;
  const charIsSpace = isSpace(data);
  const charIsNewline = data === "\n";
  const shouldInsertSpace =
    shouldInsertSpaceCharacter({
      data,
      inputValue: testInput,
      targetWord: currentWord,
    }) === true;
  const correctShiftUsed =
    Config.oppositeShiftMode === "off" ? null : isCorrectShiftUsed();

  // is char correct
  const funboxCorrect = findSingleActiveFunboxWithFunction(
    "isCharCorrect"
  )?.functions.isCharCorrect(data, currentWord[inputValue.length] ?? "");
  const correct =
    funboxCorrect ??
    isCharCorrect({
      data,
      inputValue: testInput,
      targetWord: currentWord,
      correctShiftUsed,
    });

  // word navigation check
  const noSpaceForce =
    isFunboxActiveWithProperty("nospace") &&
    TestInput.input.current.length === TestWords.words.getCurrent().length;
  const shouldGoToNextWord =
    ((charIsSpace || charIsNewline) && !shouldInsertSpace) || noSpaceForce;

  // update test input state
  if (!charIsSpace || shouldInsertSpace) {
    TestInput.input.syncWithInputElement();
  }

  // general per keypress updates
  TestInput.setCurrentNotAfk();
  Replay.addReplayEvent(correct ? "correctLetter" : "incorrectLetter", data);
  void MonkeyPower.addPower(correct);
  TestInput.incrementAccuracy(correct);
  WeakSpot.updateScore(data, correct);
  TestInput.incrementKeypressCount();
  TestInput.pushKeypressWord(wordIndex);
  if (!correct) {
    TestInput.incrementKeypressErrors();
    TestInput.pushMissedWord(TestWords.words.getCurrent());
  }
  if (Config.keymapMode === "react") {
    void KeymapEvent.flash(data, correct);
  }
  if (testInput.length === 0) {
    TestInput.setBurstStart(now);
  }
  if (!shouldGoToNextWord) {
    TestInput.corrected.update(data, correct);
  }

  // handing cases where last char needs to be removed
  // this is here and not in beforeInsertText because we want to penalize for incorrect spaces
  // like accuracy, keypress errors, and missed words
  let removeLastChar = false;
  let visualInputOverride: string | undefined;
  if (Config.stopOnError === "letter" && !correct) {
    if (!Config.blindMode) {
      visualInputOverride = testInput + data;
    }
    removeLastChar = true;
  }

  if (!isSpace(data) && correctShiftUsed === false) {
    removeLastChar = true;
    visualInputOverride = undefined;
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

  if (removeLastChar) {
    replaceInputElementLastValueChar("");
    TestInput.input.syncWithInputElement();
  }

  // going to next word
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
  const nextWord = TestWords.words.getCurrent();
  const doesNextWordHaveTab = /^\t+/.test(nextWord);
  const isCurrentCharTab = nextWord[TestInput.input.current.length] === "\t";

  //code mode - auto insert tabs
  if (
    Config.language.startsWith("code") &&
    correct &&
    doesNextWordHaveTab &&
    isCurrentCharTab
  ) {
    setTimeout(() => {
      void emulateInsertText({ data: "\t", now });
    }, 0);
  }

  if (!CompositionState.getComposing() && lastInMultiOrSingle) {
    if (
      checkIfFailedDueToDifficulty({
        testInputWithData: testInput + data,
        correct,
        spaceOrNewline: charIsSpace || charIsNewline,
      })
    ) {
      TestLogic.fail("difficulty");
    } else if (
      increasedWordIndex &&
      checkIfFailedDueToMinBurst({
        testInputWithData: testInput + data,
        currentWord,
        lastBurst,
      })
    ) {
      TestLogic.fail("min burst");
    } else if (
      checkIfFinished({
        shouldGoToNextWord,
        testInputWithData: testInput + data,
        currentWord,
        allWordsTyped: wordIndex >= TestWords.words.length - 1,
        allWordsGenerated: TestLogic.areAllTestWordsGenerated(),
      })
    ) {
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
  const inputStopped = onBeforeInsertText(options.data);

  if (inputStopped) {
    return;
  }

  // default is prevented so we need to manually update the input value.
  // remember to not call TestInput.input.syncWithInputElement in here
  // it will be called later be updated in onInsertText
  appendToInputElementValue(options.data);

  await onInsertText(options);
}
