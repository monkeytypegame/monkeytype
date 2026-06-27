import * as TestUI from "../../test/test-ui";
import * as TestWords from "../../test/test-words";
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
import {
  areCharactersVisuallyEqual,
  removeLanguageSize,
} from "../../utils/strings";
import * as TestState from "../../test/test-state";
import * as TestLogic from "../../test/test-logic";
import { Config } from "../../config/store";
import { flash } from "../../events/keymap";
import * as WeakSpot from "../../test/weak-spot";
import * as CompositionState from "../../legacy-states/composition";
import {
  isCorrectShiftUsed,
  getIncorrectShiftsInARow,
  incrementIncorrectShiftsInARow,
  resetIncorrectShiftsInARow,
} from "../state";
import { showNoticeNotification } from "../../states/notifications";
import { goToNextWord } from "../helpers/word-navigation";
import { onBeforeInsertText } from "./before-insert-text";
import { shouldGoToNextWord, isCharCorrect } from "../helpers/validation";
import { getCurrentInput, logTestEvent } from "../../test/events/data";
import { isCommitCharacter } from "../helpers/util";
import { areAllWordsGenerated } from "../../test/words-generator";

const charOverrides = new Map<string, string>([
  ["…", "..."],
  // ["œ", "oe"],
  // ["æ", "ae"],
]);

const languageCharOverrides = new Map<string, [string, string][]>([
  ["dutch", [["ĳ", "ij"]]],
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
    TestWords.words.getCurrent()?.textWithCommit[getCurrentInput().length] !==
      options.data
  ) {
    // replace the data with the override
    setInputElementValue(
      inputValue.slice(0, -options.data.length) + charOverride,
    );
    await onInsertText({
      ...options,
      data: charOverride,
    });
    return;
  }

  const languageOverrides = languageCharOverrides.get(
    removeLanguageSize(Config.language),
  );
  if (languageOverrides !== undefined) {
    for (const [targetChar, overrideChar] of languageOverrides) {
      if (
        options.data === targetChar &&
        TestWords.words.getCurrent()?.textWithCommit[
          getCurrentInput().length
        ] !== options.data
      ) {
        // replace the data with the override
        setInputElementValue(
          inputValue.slice(0, -options.data.length) + overrideChar,
        );
        await onInsertText({
          ...options,
          data: overrideChar,
        });
        return;
      }
    }
  }

  // input and target word
  const testInput = getCurrentInput();
  const currentWord = TestWords.words.getCurrent()?.textWithCommit ?? "";

  // if the character is visually equal, replace it with the target character
  // this ensures all future equivalence checks work correctly
  const normalizedData = normalizeDataAndUpdateInputIfNeeded(
    options.data,
    testInput,
    currentWord,
  );
  const data = normalizedData ?? options.data;

  // start if needed
  if (!TestState.isActive) {
    TestLogic.startTest(now);
  }

  // helper consts
  const lastInMultiOrSingle =
    lastInMultiIndex === true || lastInMultiIndex === undefined;
  const wordIndex = TestState.activeWordIndex;
  const correctShiftUsed =
    Config.oppositeShiftMode === "off" ? null : isCorrectShiftUsed();
  const isCommit = isCommitCharacter({
    data,
    inputValue: testInput,
    targetWord: currentWord,
  });

  // is char correct
  const correct = isCharCorrect({
    data,
    inputValue: testInput,
    targetWord: currentWord,
    correctShiftUsed,
  });

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

  const goingToNextWord =
    !removeLastChar &&
    shouldGoToNextWord({
      data,
      inputValue: testInput,
      targetWord: currentWord,
      isCommitCharacter: isCommit,
    });

  if (correctShiftUsed === false) {
    removeLastChar = true;
    visualInputOverride = undefined;
    incrementIncorrectShiftsInARow();
    if (getIncorrectShiftsInARow() >= 5) {
      showNoticeNotification("Opposite shift mode is on.", {
        important: true,
        customTitle: "Reminder",
      });
    }
  } else {
    resetIncorrectShiftsInARow();
  }

  if (Config.keymapMode === "react") {
    flash(data, correct);
  }

  if (removeLastChar) {
    replaceInputElementLastValueChar("");
  }

  // capture DOM before goToNextWord clears it for the new word
  const inputValueAfterEvent = getInputElementValue().inputValue;

  // Log the event BEFORE goToNextWord so readers inside the navigation
  // (e.g. beforeTestWordChange's updateWordLetters, getWordBurst) see the
  // completed event in derivation. Otherwise the just-typed trigger char
  // (space/newline) is missing — visible as missing \n element in zen mode.
  logTestEvent("input", now, {
    inputType: "insertText",
    data,
    correct,
    wordIndex,
    charIndex: testInput.length,
    isCompositionEnding: isCompositionEnding ? true : undefined,
    inputStopped: removeLastChar ? true : undefined,
    // inputValue is captured from the input element after this event (before goToNextWord clears it).
    inputValue: inputValueAfterEvent,
    commitsWord: goingToNextWord ? true : undefined,
    lastWord: wordIndex === TestWords.words.length - 1 ? true : undefined,
  });

  // this needs to be called after event logging
  WeakSpot.updateScore(data, correct);

  if (lastInMultiOrSingle) {
    TestUI.afterTestTextInput(correct, visualInputOverride);
  }

  // going to next word
  let increasedWordIndex: null | boolean = null;
  let lastBurst: null | number = null;
  if (goingToNextWord) {
    const result = await goToNextWord({
      correctInsert: testInput + data === currentWord,
      isCompositionEnding: isCompositionEnding === true,
      zenNewline: data === "\n" && Config.mode === "zen",
      now,
    });
    lastBurst = result.lastBurst;
    increasedWordIndex = result.increasedWordIndex;
  }

  /*
  Space/word-navigation variables:
   - charIsSpace / charIsNewline: was the input a space or a newline?
   - goingToNextWord: should this input commit the current word and move on?
     The separator is part of the target word (stored as a trailing space), so a
     space/newline matches it positionally; navigation can still be blocked by
     stop-on-error, strict space, or opposite shift (removeLastChar).
   - increasedWordIndex: only set because on the last word we don't move on.
  */

  //this COULD be the next word because we are awaiting goToNextWord
  const nextWord = TestWords.words.getCurrent()?.textWithCommit ?? "";
  const doesNextWordHaveTab = /^\t+/.test(nextWord);
  const isCurrentCharTab = nextWord[getCurrentInput().length] === "\t";

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
        data,
        testInput: testInput,
        targetWord: currentWord,
        correct,
        isCommitCharacter: isCommit,
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
        goingToNextWord,
        testInputWithData: testInput + data,
        currentWord,
        allWordsTyped: wordIndex >= TestWords.words.length - 1,
        allWordsGenerated: areAllWordsGenerated(),
      })
    ) {
      void TestLogic.finish();
    }
  }
}

function normalizeDataAndUpdateInputIfNeeded(
  data: string,
  testInput: string,
  currentWord: string,
): string | null {
  let normalizedData: string | null = null;
  const targetChar = currentWord[testInput.length];
  if (
    targetChar !== undefined &&
    areCharactersVisuallyEqual(data, targetChar, Config.language)
  ) {
    replaceInputElementLastValueChar(targetChar);
    normalizedData = targetChar;
  }
  return normalizedData;
}

export async function emulateInsertText(
  options: OnInsertTextParams,
): Promise<void> {
  const inputStopped = onBeforeInsertText(options.data);

  if (inputStopped) {
    return;
  }

  // default is prevented so we need to manually update the input value.
  appendToInputElementValue(options.data);

  await onInsertText(options);
}
