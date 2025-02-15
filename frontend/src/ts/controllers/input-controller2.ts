import * as TestInput from "../test/test-input";
import * as TestUI from "../test/test-ui";
import * as Caret from "../test/caret";
import * as TestState from "../test/test-state";
import * as TestLogic from "../test/test-logic";
import * as TestWords from "../test/test-words";
import * as Focus from "../test/focus";

const wordsInput = document.querySelector("#wordsInput") as HTMLInputElement;

type InputEventHandler = {
  inputValue: string;
  realInputValue: string;
  event: InputEvent;
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
  if (data === " " && inputValue === "") {
    event?.preventDefault();
  }
}

function onInsertText({ data, event }: OnInsertTextParams): void {
  if (data === " ") {
    TestInput.input.setCurrent(TestInput.input.getCurrent().trimEnd());
    TestInput.input.pushHistory();

    if (TestState.activeWordIndex === TestWords.words.length - 1) {
      void TestLogic.finish();
    } else {
      TestState.increaseActiveWordIndex();
    }

    setInputValue("");
    return;
  }

  if (
    TestInput.input.getCurrent() ===
    TestWords.words.get(TestState.activeWordIndex)
  ) {
    void TestLogic.finish();
  }
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
  const inputValue = realInputValue.trimStart();

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
    });
  } else if (event.inputType === "deleteContentBackward") {
    onBeforeContentDelete({
      inputValue,
      realInputValue,
      event,
    });
  }
});

wordsInput.addEventListener("input", (event) => {
  const realInputValue = wordsInput.value;
  const inputValue = wordsInput.value.trimStart();
  const now = performance.now();

  if (!(event instanceof InputEvent)) {
    event.preventDefault();
    return;
  }

  TestInput.input.setCurrent(inputValue);

  if (event.inputType === "insertText" && event.data !== null) {
    onInsertText({
      inputValue,
      realInputValue,
      event,
      data: event.data,
    });
  } else if (event.inputType === "deleteContentBackward") {
    onContentDelete({
      inputValue,
      realInputValue,
      event,
    });
  }

  if (!TestState.isActive) {
    TestLogic.startTest(now);
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

wordsInput.addEventListener("keydown", (event) => {
  if (
    ((event.metaKey || event.ctrlKey) && event.key === "a") ||
    event.key.startsWith("Arrow")
  ) {
    event.preventDefault();
    return;
  }
});
