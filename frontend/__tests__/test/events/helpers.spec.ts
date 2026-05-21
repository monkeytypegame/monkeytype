import { describe, it, expect, beforeEach } from "vitest";
import { getSimulatedInput } from "../../../src/ts/test/events/helpers";
import type { InputEvent } from "../../../src/ts/test/events/types";
import type { InsertInputType } from "../../../src/ts/input/helpers/input-type";

let nextMs = 0;
let charIndex = 0;
let wordIndex = 0;

function insert(
  chars: string,
  inputType: InsertInputType = "insertText",
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

function deleteBackward(): InputEvent {
  nextMs += 10;
  if (charIndex > 0) charIndex--;
  return {
    type: "input",
    ms: nextMs,
    testMs: nextMs,
    data: {
      charIndex,
      wordIndex,
      inputType: "deleteContentBackward",
    },
  };
}

function deleteWordBackward(): InputEvent {
  nextMs += 10;
  charIndex = 0;
  return {
    type: "input",
    ms: nextMs,
    testMs: nextMs,
    data: {
      charIndex,
      wordIndex,
      inputType: "deleteWordBackward",
    },
  };
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
    expect(getSimulatedInput([...insert("hello ")])).toBe("hello ");
  });

  it("handles deleteContentBackward", () => {
    expect(getSimulatedInput([...insert("abc"), deleteBackward()])).toBe("ab");
    expect(getSimulatedInput([...insert("abc "), deleteBackward()])).toBe(
      "abc",
    );
  });

  it("handles multiple deletes", () => {
    expect(
      getSimulatedInput([...insert("ab"), deleteBackward(), deleteBackward()]),
    ).toBe("");
    expect(
      getSimulatedInput([...insert("ab "), deleteBackward(), deleteBackward()]),
    ).toBe("a");
  });

  it("handles deleteWordBackward", () => {
    expect(getSimulatedInput([...insert("hello"), deleteWordBackward()])).toBe(
      "",
    );
    expect(getSimulatedInput([...insert("hello "), deleteWordBackward()])).toBe(
      "",
    );
  });

  it("returns empty string for no events", () => {
    expect(getSimulatedInput([])).toBe("");
  });

  it("handles deleteContentBackward on empty string", () => {
    const events = [deleteBackward()];
    expect(getSimulatedInput(events)).toBe("");
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
