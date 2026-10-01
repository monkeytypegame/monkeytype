import { describe, it, expect, beforeEach, vi } from "vitest";

const mockConfig = vi.hoisted(() => ({ funbox: "" }));
vi.mock("../../../src/ts/config/store", () => ({
  Config: mockConfig,
}));

import {
  findInputValueMismatches,
  getInputFromDom,
  getTestEventCode,
} from "../../../src/ts/test/events/helpers";
import type { InputEvent } from "../../../src/ts/test/events/types";
import type { InsertInputType } from "../../../src/ts/input/helpers/input-type";

let nextMs = 0;
let charIndex = 0;
let wordIndex = 0;
let currentInput = "";

function insert(
  chars: string,
  inputType: InsertInputType = "insertText",
  overrides: { inputStopped?: true } = {},
): InputEvent[] {
  return [...chars].map((char) => {
    nextMs += 10;
    if (!overrides.inputStopped) {
      currentInput += char;
    }
    const event: InputEvent = {
      type: "input",
      ms: nextMs,
      testMs: nextMs,
      data: {
        charIndex,
        wordIndex,
        inputType,
        data: char,
        correct: true,
        inputValue: currentInput,
        ...overrides,
      },
    };
    if (char !== " ") {
      charIndex++;
    }
    if (char === " ") {
      wordIndex++;
      charIndex = 0;
    }
    return event;
  });
}

function deleteBackward(count = 1): InputEvent[] {
  return Array.from({ length: count }, () => {
    nextMs += 10;
    currentInput = currentInput.slice(0, -1);
    const event: InputEvent = {
      type: "input",
      ms: nextMs,
      testMs: nextMs,
      data: {
        charIndex,
        wordIndex,
        inputType: "deleteContentBackward",
        inputValue: currentInput,
      },
    };
    if (charIndex > 0) charIndex--;
    return event;
  });
}

function deleteWordBackward(): InputEvent {
  nextMs += 10;
  charIndex = 0;
  currentInput = currentInput.replace(/(?:\S+\s*|\s+)$/, "");
  const event = {
    type: "input",
    ms: nextMs,
    testMs: nextMs,
    data: {
      charIndex,
      wordIndex,
      inputType: "deleteWordBackward",
      inputValue: currentInput,
    },
  } as const;
  if (wordIndex > 0) wordIndex--;

  return event;
}

function reset(): void {
  nextMs = 0;
  charIndex = 0;
  wordIndex = 0;
  currentInput = "";
}

describe("getInputFromDom", () => {
  beforeEach(() => {
    reset();
  });

  it("returns the last event's inputValue", () => {
    expect(getInputFromDom([...insert("hello")])).toBe("hello");
  });

  it("returns inputValue with trailing space", () => {
    expect(getInputFromDom([...insert("hello ")])).toBe("hello ");
  });

  it("returns inputValue after deleteContentBackward", () => {
    expect(getInputFromDom([...insert("abc"), ...deleteBackward()])).toBe("ab");
  });

  it("returns inputValue after deleteContentBackward across space", () => {
    expect(getInputFromDom([...insert("abc "), ...deleteBackward()])).toBe(
      "abc",
    );
  });

  it("returns inputValue after multiple deletes", () => {
    expect(getInputFromDom([...insert("ab"), ...deleteBackward(2)])).toBe("");
  });

  it("returns inputValue after deleteWordBackward", () => {
    expect(getInputFromDom([...insert("hello"), deleteWordBackward()])).toBe(
      "",
    );
  });

  it("returns inputValue after deleteWordBackward across trailing space", () => {
    expect(getInputFromDom([...insert("hello "), deleteWordBackward()])).toBe(
      "",
    );
  });

  it("returns empty string for no events", () => {
    expect(getInputFromDom([])).toBe("");
  });

  it("returns empty after deleteContentBackward on empty string", () => {
    expect(getInputFromDom([...deleteBackward()])).toBe("");
  });

  it("inputStopped events keep prior inputValue", () => {
    // inputStopped events should not advance currentInput in the helper, so
    // the next character continues from "he"
    expect(
      getInputFromDom([
        ...insert("he"),
        ...insert("x", "insertText", { inputStopped: true }),
        ...insert("llo"),
      ]),
    ).toBe("hello");
  });

  it("returns inputValue after deleteWordBackward mid-word", () => {
    expect(getInputFromDom([...insert("a a"), deleteWordBackward()])).toBe(
      "a ",
    );
  });

  it("returns inputValue after deleteWordBackward with multiple words", () => {
    expect(
      getInputFromDom([...insert("foo bar baz"), deleteWordBackward()]),
    ).toBe("foo bar ");
  });

  it("returns inputValue after consecutive deleteWordBackward events", () => {
    expect(
      getInputFromDom([
        ...insert("foo bar baz"),
        deleteWordBackward(),
        deleteWordBackward(),
      ]),
    ).toBe("foo ");
  });

  it("trims trailing space when last event is incorrect last-word commit", () => {
    const events: InputEvent[] = [
      ...insert("hi"),
      {
        type: "input",
        ms: 100,
        testMs: 100,
        data: {
          inputType: "insertText",
          data: " ",
          charIndex: 2,
          wordIndex: 0,
          correct: false,
          inputValue: "hi ",
          commitsWord: true,
          lastWord: true,
        },
      },
    ];
    expect(getInputFromDom(events)).toBe("hi");
  });

  it("does not trim trailing space when commit is on non-last word", () => {
    const events: InputEvent[] = [
      ...insert("hi"),
      {
        type: "input",
        ms: 100,
        testMs: 100,
        data: {
          inputType: "insertText",
          data: " ",
          charIndex: 2,
          wordIndex: 0,
          correct: false,
          inputValue: "hi ",
          commitsWord: true,
        },
      },
    ];
    expect(getInputFromDom(events)).toBe("hi ");
  });
});

describe("findInputValueMismatches", () => {
  beforeEach(() => {
    reset();
  });

  it("returns empty when no events have recorded inputValue", () => {
    expect(findInputValueMismatches([...insert("hello")])).toEqual([]);
  });

  it("returns empty when recorded values match derivation", () => {
    const events: InputEvent[] = [
      {
        type: "input",
        ms: 10,
        testMs: 10,
        data: {
          inputType: "insertText",
          data: "a",
          charIndex: 0,
          wordIndex: 0,
          correct: true,
          inputValue: "a",
        },
      },
      {
        type: "input",
        ms: 20,
        testMs: 20,
        data: {
          inputType: "insertText",
          data: "b",
          charIndex: 1,
          wordIndex: 0,
          correct: true,
          inputValue: "ab",
        },
      },
    ];
    expect(findInputValueMismatches(events)).toEqual([]);
  });

  it("returns mismatches when recorded value differs from derivation", () => {
    const events: InputEvent[] = [
      {
        type: "input",
        ms: 10,
        testMs: 10,
        data: {
          inputType: "insertText",
          data: "a",
          charIndex: 0,
          wordIndex: 0,
          correct: true,
          inputValue: "DIFFERENT",
        },
      },
    ];
    expect(findInputValueMismatches(events)).toEqual([
      { index: 0, derived: "a", recorded: "DIFFERENT" },
    ]);
  });

  it("skips events without inputValue, still tracks ones with it", () => {
    const events: InputEvent[] = [
      ...insert("hello"), // no inputValue on these
      {
        type: "input",
        ms: 100,
        testMs: 100,
        data: {
          inputType: "deleteContentBackward",
          charIndex: 5,
          wordIndex: 0,
          inputValue: "hell",
        },
      },
    ];
    // derivation: "hello" then slice = "hell". Recorded = "hell". Match.
    expect(findInputValueMismatches(events)).toEqual([]);
  });

  // it("handles insertCompositionText events", () => {
  //   const events = [
  //     ...insert("k", "insertCompositionText"),
  //     ...insert("ka", "insertCompositionText"),
  //   ];
  //   expect(getInputFromEvents(events)).toBe("ka");
  // });

  // it("handles composition followed by regular text", () => {
  //     ...insert("ka", "insertCompositionText"),
  //     ...insert("b"),
  //   ];
  //   expect(getInputFromEvents(events)).toBe("kab");
  // });
});

function kbd(code: string, key?: string): KeyboardEvent {
  return { code, key: key ?? "" } as KeyboardEvent;
}

describe("getTestEventCode", () => {
  beforeEach(() => {
    mockConfig.funbox = "";
  });

  it("returns the event code as-is for normal keys", () => {
    expect(getTestEventCode(kbd("KeyA"))).toBe("KeyA");
    expect(getTestEventCode(kbd("Space"))).toBe("Space");
    expect(getTestEventCode(kbd("Digit1"))).toBe("Digit1");
  });

  it("returns NoCode when code is empty string", () => {
    expect(getTestEventCode(kbd(""))).toBe("NoCode");
  });

  it("returns NoCode when key is Unidentified even with a valid code", () => {
    expect(getTestEventCode(kbd("Semicolon", "Unidentified"))).toBe("NoCode");
  });

  it("returns NoCode when key is Unidentified", () => {
    expect(getTestEventCode(kbd("KeyA", "Unidentified"))).toBe("NoCode");
  });

  it("returns Space for NumpadEnter when 58008 funbox is active", () => {
    mockConfig.funbox = "58008";
    expect(getTestEventCode(kbd("NumpadEnter"))).toBe("Space");
  });

  it("does not remap NumpadEnter without 58008 funbox", () => {
    expect(getTestEventCode(kbd("NumpadEnter"))).toBe("NumpadEnter");
  });

  it("returns NoCode for arrow keys when arrows funbox is active", () => {
    mockConfig.funbox = "arrows";
    expect(getTestEventCode(kbd("ArrowUp"))).toBe("NoCode");
    expect(getTestEventCode(kbd("ArrowDown"))).toBe("NoCode");
    expect(getTestEventCode(kbd("ArrowLeft"))).toBe("NoCode");
    expect(getTestEventCode(kbd("ArrowRight"))).toBe("NoCode");
  });

  it("does not remap arrow keys without arrows funbox", () => {
    expect(getTestEventCode(kbd("ArrowUp"))).toBe("ArrowUp");
  });

  it("handles 58008 funbox combined with other funboxes", () => {
    mockConfig.funbox = "other#58008";
    expect(getTestEventCode(kbd("NumpadEnter"))).toBe("Space");
  });

  it("handles arrows funbox combined with other funboxes", () => {
    mockConfig.funbox = "arrows#other";
    expect(getTestEventCode(kbd("ArrowLeft"))).toBe("NoCode");
  });
});
