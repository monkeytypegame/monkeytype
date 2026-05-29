import { describe, it, expect, beforeEach, vi } from "vitest";

const mockConfig = vi.hoisted(() => ({ funbox: "" }));
vi.mock("../../../src/ts/config/store", () => ({
  Config: mockConfig,
}));

import {
  getSimulatedInput,
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
  overrides: Partial<{ inputStopped: boolean }> = {},
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
        isCompositionEnding: false,
        inputStopped: false,
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

describe("getSimulatedInput", () => {
  beforeEach(() => {
    reset();
  });

  it("builds string from insertText events", () => {
    expect(getSimulatedInput([...insert("hello")])).toBe("hello");
  });

  it("builds string from insertText events with trailing space", () => {
    expect(getSimulatedInput([...insert("hello ")])).toBe("hello ");
  });

  it("handles deleteContentBackward", () => {
    expect(getSimulatedInput([...insert("abc"), ...deleteBackward()])).toBe(
      "ab",
    );
  });

  it("handles deleteContentBackward after space", () => {
    expect(getSimulatedInput([...insert("abc "), ...deleteBackward()])).toBe(
      "abc",
    );
  });

  it("handles multiple deletes", () => {
    expect(getSimulatedInput([...insert("ab"), ...deleteBackward(2)])).toBe("");
  });

  it("handles multiple deletes after space", () => {
    expect(getSimulatedInput([...insert("ab "), ...deleteBackward(2)])).toBe(
      "a",
    );
  });

  it("handles deleteWordBackward", () => {
    expect(getSimulatedInput([...insert("hello"), deleteWordBackward()])).toBe(
      "",
    );
  });

  it("handles deleteWordBackward after space", () => {
    expect(getSimulatedInput([...insert("hello "), deleteWordBackward()])).toBe(
      "",
    );
  });

  it("returns empty string for no events", () => {
    expect(getSimulatedInput([])).toBe("");
  });

  it("handles deleteContentBackward on empty string", () => {
    const events = [...deleteBackward()];
    expect(getSimulatedInput(events)).toBe("");
  });

  it("skips inputStopped events", () => {
    expect(
      getSimulatedInput([
        ...insert("he"),
        ...insert("x", "insertText", { inputStopped: true }),
        ...insert("llo"),
      ]),
    ).toBe("hello");
  });

  // it("handles insertCompositionText events", () => {
  //   const events = [
  //     ...insert("k", "insertCompositionText"),
  //     ...insert("ka", "insertCompositionText"),
  //   ];
  //   expect(getSimulatedInput(events)).toBe("ka");
  // });

  // it("handles composition followed by regular text", () => {
  //   const events = [
  //     ...insert("k", "insertCompositionText"),
  //     ...insert("ka", "insertCompositionText"),
  //     ...insert("b"),
  //   ];
  //   expect(getSimulatedInput(events)).toBe("kab");
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
