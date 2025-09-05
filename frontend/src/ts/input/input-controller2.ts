import Config from "../config";
import * as TestInput from "../test/test-input";
import * as TestUI from "../test/test-ui";
import * as PaceCaret from "../test/pace-caret";
import * as TestState from "../test/test-state";
import * as TestLogic from "../test/test-logic";
import * as TestWords from "../test/test-words";
import * as MonkeyPower from "../elements/monkey-power";
import {
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
import { isAnyPopupVisible, whorf } from "../utils/misc";
import { canQuickRestart } from "../utils/quick-restart";
import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";
import { isSpace } from "../utils/strings";
import {
  getInputValue,
  getWordsInput,
  replaceLastInputValueChar,
  setInputValue,
  setTestInputToDOMValue,
} from "./element";
import {
  isCharCorrect,
  isIgnoredInputType,
  shouldInsertSpaceCharacter,
} from "./helpers";

type SupportedInputType =
  | "insertText"
  | "insertCompositionText"
  | "deleteWordBackward"
  | "insertLineBreak"
  | "deleteContentBackward";

let correctShiftUsed = true;
let incorrectShiftsInARow = 0;
let awaitingNextWord = false;
let lastBailoutAttempt = -1;

type GoToNextWordParams = {
  correctInsert: boolean;
};

type GoToNextWordReturn = {
  increasedIndex: boolean;
  lastBurst: number;
};

async function goToNextWord({
  correctInsert,
}: GoToNextWordParams): Promise<GoToNextWordReturn> {
  const ret = {
    increasedIndex: false,
    lastBurst: 0,
  };

  TestUI.beforeTestWordChange("forward", correctInsert);

  if (correctInsert) {
    Replay.addReplayEvent("submitCorrectWord");
  } else {
    Replay.addReplayEvent("submitErrorWord");
  }

  for (const fb of getActiveFunboxesWithFunction("handleSpace")) {
    fb.functions.handleSpace();
  }

  //burst calculation and fail
  const burst: number = TestStats.calculateBurst();
  void LiveBurst.update(Math.round(burst));
  TestInput.pushBurstToHistory(burst);
  ret.lastBurst = burst;

  PaceCaret.handleSpace(correctInsert, TestWords.words.getCurrent());

  Funbox.toggleScript(TestWords.words.get(TestState.activeWordIndex + 1));

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
    ret.increasedIndex = true;
    TestState.increaseActiveWordIndex();
  }

  setInputValue("");
  TestUI.afterTestWordChange("forward");

  return ret;
}

function goToPreviousWord(inputType: SupportedInputType): void {
  if (TestState.activeWordIndex === 0) {
    setInputValue("");
    return;
  }

  TestUI.beforeTestWordChange("back", null);

  Replay.addReplayEvent("backWord");

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
    } else if (word.endsWith("\n")) {
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
  spaceIncreasedIndex: boolean | null;
  wentToNextWord: boolean;
  shouldInsertSpace: boolean;
  lastBurst: number | null;
};

function failOrFinish({
  correctInsert,
  wentToNextWord,
  spaceIncreasedIndex,
  shouldInsertSpace,
  lastBurst,
}: FailOrFinishParams): void {
  if (Config.minBurst !== "off" && lastBurst !== null) {
    let wordLength: number;
    if (Config.mode === "zen") {
      wordLength = TestInput.input.current.length;
    } else {
      wordLength = TestWords.words.getCurrent().length;
    }

    const flex: number = whorf(Config.minBurstCustomSpeed, wordLength);
    if (
      (Config.minBurst === "fixed" && lastBurst < Config.minBurstCustomSpeed) ||
      (Config.minBurst === "flex" && lastBurst < flex)
    ) {
      TestLogic.fail("min burst");
      return;
    }
  }

  const shouldFailDueToExpert =
    Config.difficulty === "expert" &&
    !correctInsert &&
    (shouldInsertSpace || wentToNextWord);

  const shouldFailDueToMaster =
    Config.difficulty === "master" && !correctInsert;

  if (shouldFailDueToExpert || shouldFailDueToMaster) {
    TestLogic.fail("difficulty");
    return;
  }

  // if we went to the next word, shift the active index back
  const allWordsTyped = TestState.activeWordIndex >= TestWords.words.length - 1;
  const spaceOnLastWord = wentToNextWord && !spaceIncreasedIndex;
  const currentWord = TestWords.words.getCurrent();
  const allWordGenerated = TestLogic.areAllTestWordsGenerated();
  const wordIsCorrect =
    TestInput.input.current === TestWords.words.get(TestState.activeWordIndex);
  const shouldQuickEnd =
    Config.quickEnd &&
    currentWord.length === TestInput.input.current.length &&
    Config.stopOnError === "off";
  if (
    allWordsTyped &&
    allWordGenerated &&
    (wordIsCorrect || shouldQuickEnd || spaceOnLastWord)
  ) {
    void TestLogic.finish();
    return;
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
  const { inputValue } = getInputValue();
  const inputIsEmpty = inputValue === "";
  const firstWord = TestState.activeWordIndex === 0;

  if (inputIsEmpty && firstWord) {
    //block this no matter what
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
    isSpace(data) &&
    inputValue === "" &&
    Config.difficulty === "normal" &&
    !Config.strictSpace
  ) {
    preventDefault = true;
  }

  //prevent space in nospace funbox
  if (isSpace(data) && isFunboxActiveWithProperty("nospace")) {
    preventDefault = true;
  }

  // we need this here because space characters sometimes need to be blocked,
  // while space skips to next word shouldnt
  const shouldInsertSpace = shouldInsertSpaceCharacter(data) === true;

  //prevent the word from jumping to the next line if the word is too long
  //this will not work for the first word of each line, but that has a low chance of happening

  const topAfterAppend = TestUI.getActiveWordTopAfterAppend(data);
  const wordJumped = topAfterAppend > TestUI.activeWordTop;
  if (
    data !== null &&
    data !== "" &&
    ((isSpace(data) && shouldInsertSpace) || !isSpace(data)) &&
    TestInput.input.current.length >= TestWords.words.getCurrent().length &&
    wordJumped &&
    Config.mode !== "zen"
  ) {
    return true;
  }

  // block input if the word is too long
  const inputLimit =
    Config.mode === "zen" ? 30 : TestWords.words.getCurrent().length + 20;
  const overLimit = TestInput.input.current.length >= inputLimit;
  if (overLimit && ((isSpace(data) && shouldInsertSpace) || !isSpace(data))) {
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

async function emulateInsertText(
  data: string,
  event: KeyboardEvent,
  now: number
): Promise<void> {
  const preventDefault = onBeforeInsertText({
    data,
    now,
    event,
    inputType: "insertText",
  });

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

getWordsInput().addEventListener("beforeinput", (event) => {
  console.debug("wordsInput event beforeinput", {
    inputType: event.inputType,
    data: event.data,
    value: (event.target as HTMLInputElement).value,
  });

  const popupVisible = isAnyPopupVisible();
  if (popupVisible) {
    event.preventDefault();
    console.warn("Prevented beforeinput due to popup visibility");
    return;
  }

  if (isIgnoredInputType(event.inputType)) {
    event.preventDefault();
    return;
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

getWordsInput().addEventListener("input", async (event) => {
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

function handleKeydownTiming(event: KeyboardEvent, now: number): void {
  if (event.repeat) {
    console.log(
      "spacing debug keydown STOPPED - repeat",
      event.key,
      event.code,
      //ignore for logging
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.which
    );
    return;
  }

  let eventCode = event.code;

  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    eventCode = "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    eventCode = "NoCode";
  }

  setTimeout(() => {
    if (eventCode === "" || event.key === "Unidentified") {
      eventCode = "NoCode";
    }
    TestInput.recordKeydownTime(now, eventCode);
  }, 0);
}

function handleKeyupTiming(event: KeyboardEvent, now: number): void {
  if (event.repeat) {
    console.log(
      "spacing debug keyup STOPPED - repeat",
      event.key,
      event.code,
      //ignore for logging
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.which
    );
    return;
  }

  let eventCode = event.code;

  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    eventCode = "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    eventCode = "NoCode";
  }

  setTimeout(() => {
    if (eventCode === "" || event.key === "Unidentified") {
      eventCode = "NoCode";
    }
    TestInput.recordKeyupTime(now, eventCode);
  }, 0);
}

getWordsInput().addEventListener("keydown", async (event) => {
  console.debug("wordsInput event keydown", {
    key: event.key,
    code: event.code,
  });

  const now = performance.now();
  handleKeydownTiming(event, now);

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

  // there used to be an if check here with funbox preventDefaultEvent check
  // but its only used in arrows so im not sure if its needed
  // todo: decide what to do

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
      }
    }
    event.preventDefault();
    return;
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
    if (event.shiftKey) {
      if (Config.mode === "zen") {
        void TestLogic.finish();
        return;
      } else if (
        !canQuickRestart(
          Config.mode,
          Config.words,
          Config.time,
          CustomText.getData(),
          CustomTextState.isCustomTextLong() ?? false
        )
      ) {
        const delay = Date.now() - lastBailoutAttempt;
        if (lastBailoutAttempt === -1 || delay > 200) {
          lastBailoutAttempt = Date.now();
          if (delay >= 5000) {
            Notifications.add(
              "Please double tap shift+enter to confirm bail out",
              0,
              {
                important: true,
                duration: 5,
              }
            );
          }
        } else {
          TestState.setBailedOut(true);
          void TestLogic.finish();
        }
      }
    }

    if (Config.quickRestart === "enter") {
      event.preventDefault();
      if ((TestWords.hasNewline && event.shiftKey) || !TestWords.hasNewline) {
        TestLogic.restart();
        return;
      }
    }
    if (
      TestWords.hasNewline ||
      (Config.mode === "zen" && !CompositionState.getComposing())
    ) {
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

getWordsInput().addEventListener("keyup", (event) => {
  console.debug("wordsInput event keyup", {
    key: event.key,
    code: event.code,
  });

  if (
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown"
  ) {
    event.preventDefault();
    return;
  }

  const now = performance.now();
  handleKeyupTiming(event, now);

  const arrowsActive = Config.funbox.includes("arrows");
  if (event.key.startsWith("Arrow") && !arrowsActive) {
    event.preventDefault();
    return;
  }

  setTimeout(() => {
    Monkey.stop(event);
  }, 0);
});

getWordsInput().addEventListener("compositionstart", (event) => {
  console.debug("wordsInput event compositionstart", { data: event.data });
  CompositionState.setComposing(true);
  if (!TestState.isActive) {
    TestUI.setActiveWordTop();
    TestLogic.startTest(performance.now());
  }
});

getWordsInput().addEventListener("compositionupdate", (event) => {
  console.debug("wordsInput event compositionupdate", { data: event.data });
  CompositionState.setData(event.data);
});

getWordsInput().addEventListener("compositionend", async (event) => {
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
