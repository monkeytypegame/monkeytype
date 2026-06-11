import { describe, it, expect, beforeEach, vi } from "vitest";

const mockConfig = vi.hoisted(() => ({ funbox: "" }));
vi.mock("../../../src/ts/config/store", () => ({
  Config: mockConfig,
}));

import {
  findInputValueMismatches,
  getInputFromDom,
  getInputFromEvents,
  getTestEventCode,
} from "../../../src/ts/test/events/helpers";
import type { InputEvent } from "../../../src/ts/test/events/types";
import type { InsertInputType } from "../../../src/ts/input/helpers/input-type";

let nextMs = 0;
let charIndex = 0;
let wordIndex = 0;

function insert(
  chars: string,
  inputType: InsertInputType = "insertText",
  overrides: { inputStopped?: true } = {},
): InputEvent[] {
  return [...chars].map((char) => {
    nextMs += 10;
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
    const event: InputEvent = {
      type: "input",
      ms: nextMs,
      testMs: nextMs,
      data: {
        charIndex,
        wordIndex,
        inputType: "deleteContentBackward",
      },
    };
    if (charIndex > 0) charIndex--;
    return event;
  });
}

function deleteWordBackward(): InputEvent {
  nextMs += 10;
  charIndex = 0;
  const event = {
    type: "input",
    ms: nextMs,
    testMs: nextMs,
    data: {
      charIndex,
      wordIndex,
      inputType: "deleteWordBackward",
    },
  } as const;
  if (wordIndex > 0) wordIndex--;

  return event;
}

function reset(): void {
  nextMs = 0;
  charIndex = 0;
  wordIndex = 0;
}

describe("getInputFromEvents", () => {
  beforeEach(() => {
    reset();
  });

  it("builds string from insertText events", () => {
    expect(getInputFromEvents([...insert("hello")])).toBe("hello");
  });

  it("builds string from insertText events with trailing space", () => {
    expect(getInputFromEvents([...insert("hello ")])).toBe("hello ");
  });

  it("handles deleteContentBackward", () => {
    expect(getInputFromEvents([...insert("abc"), ...deleteBackward()])).toBe(
      "ab",
    );
  });

  it("handles deleteContentBackward after space", () => {
    expect(getInputFromEvents([...insert("abc "), ...deleteBackward()])).toBe(
      "abc",
    );
  });

  it("handles multiple deletes", () => {
    expect(getInputFromEvents([...insert("ab"), ...deleteBackward(2)])).toBe(
      "",
    );
  });

  it("handles multiple deletes after space", () => {
    expect(getInputFromEvents([...insert("ab "), ...deleteBackward(2)])).toBe(
      "a",
    );
  });

  it("handles deleteWordBackward", () => {
    expect(getInputFromEvents([...insert("hello"), deleteWordBackward()])).toBe(
      "",
    );
  });

  it("handles deleteWordBackward after space", () => {
    expect(
      getInputFromEvents([...insert("hello "), deleteWordBackward()]),
    ).toBe("");
  });

  it("returns empty string for no events", () => {
    expect(getInputFromEvents([])).toBe("");
  });

  it("handles deleteContentBackward on empty string", () => {
    const events = [...deleteBackward()];
    expect(getInputFromEvents(events)).toBe("");
  });

  it("skips inputStopped events", () => {
    expect(
      getInputFromEvents([
        ...insert("he"),
        ...insert("x", "insertText", { inputStopped: true }),
        ...insert("llo"),
      ]),
    ).toBe("hello");
  });

  it("handles deleteContentBackward within the same word correctly", () => {
    expect(getInputFromEvents([...insert("a a"), deleteWordBackward()])).toBe(
      "a ",
    );
  });

  it("handles deleteWordBackward with multiple internal spaces", () => {
    expect(
      getInputFromEvents([...insert("foo bar baz"), deleteWordBackward()]),
    ).toBe("foo bar ");
  });

  it("handles deleteWordBackward with trailing space after multiple words", () => {
    expect(
      getInputFromEvents([...insert("foo bar "), deleteWordBackward()]),
    ).toBe("foo ");
  });

  it("handles consecutive deleteWordBackward events", () => {
    expect(
      getInputFromEvents([
        ...insert("foo bar baz"),
        deleteWordBackward(),
        deleteWordBackward(),
      ]),
    ).toBe("foo ");
  });

  it("handles deleteWordBackward on empty string", () => {
    expect(getInputFromEvents([deleteWordBackward()])).toBe("");
  });

  it("handles deleteWordBackward on only whitespace", () => {
    expect(getInputFromEvents([...insert("   "), deleteWordBackward()])).toBe(
      "",
    );
  });

  it("ignores recorded inputValue (pure op-based simulation)", () => {
    const events: InputEvent[] = [
      ...insert("hello"),
      {
        type: "input",
        ms: 100,
        testMs: 100,
        data: {
          inputType: "deleteWordBackward",
          charIndex: 5,
          wordIndex: 0,
          inputValue: "RECORDED_BUT_IGNORED",
        },
      },
    ];
    // pure simulation: deleteWordBackward on "hello" → ""
    expect(getInputFromEvents(events)).toBe("");
  });
});

describe("getInputFromDom", () => {
  beforeEach(() => {
    reset();
  });

  it("falls through to op-based logic when inputValue is absent", () => {
    expect(getInputFromDom([...insert("hello")])).toBe("hello");
  });

  it("uses recorded inputValue when present, overriding op-based logic", () => {
    const events: InputEvent[] = [
      ...insert("hello"),
      {
        type: "input",
        ms: 100,
        testMs: 100,
        data: {
          inputType: "deleteWordBackward",
          charIndex: 5,
          wordIndex: 0,
          inputValue: "he",
        },
      },
    ];
    // op-based would yield "", but inputValue is truth
    expect(getInputFromDom(events)).toBe("he");
  });

  it("uses latest event's inputValue across multiple recorded events", () => {
    const events: InputEvent[] = [
      ...insert("hello"),
      {
        type: "input",
        ms: 100,
        testMs: 100,
        data: {
          inputType: "deleteContentBackward",
          charIndex: 5,
          wordIndex: 0,
          inputValue: "hi",
        },
      },
    ];
    expect(getInputFromDom(events)).toBe("hi");
  });

  it("mixes captured and op-based across events", () => {
    const events: InputEvent[] = [
      ...insert("ab"), // no inputValue, op = "ab"
      {
        type: "input",
        ms: 100,
        testMs: 100,
        data: {
          inputType: "insertText",
          data: "c",
          charIndex: 2,
          wordIndex: 0,
          correct: true,
          inputValue: "abc",
        },
      },
      // next event has no inputValue, falls through to op (append "d")
      {
        type: "input",
        ms: 110,
        testMs: 110,
        data: {
          inputType: "insertText",
          data: "d",
          charIndex: 3,
          wordIndex: 0,
          correct: true,
        },
      },
    ];
    expect(getInputFromDom(events)).toBe("abcd");
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
