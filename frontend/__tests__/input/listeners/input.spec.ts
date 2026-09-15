import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  index: 1,
  active: true,
  restarting: false,
  calculating: false,
  awaiting: false,
  visible: true,
  inputs: ["wrong ", "typo"],
}));

vi.mock("../../../src/ts/input/input-element", () => {
  const element = document.createElement("textarea");
  return {
    getInputElement: () => element,
    getInputElementValue: () => ({
      realInputValue: element.value,
      inputValue: element.value.slice(1),
    }),
    setInputElementValue: (value: string) => {
      element.value = ` ${value}`;
    },
  };
});
vi.mock("../../../src/ts/config/store", () => ({
  Config: { language: "english", freedomMode: false, confidenceMode: "off" },
}));
vi.mock("../../../src/ts/states/test", () => ({
  getActiveWordIndex: () => state.index,
  decreaseActiveWordIndex: () => {
    state.index--;
  },
  isTestActive: () => state.active,
  isTestRestarting: () => state.restarting,
  isResultCalculating: () => state.calculating,
}));
vi.mock("../../../src/ts/input/state", () => ({
  isAwaitingNextWord: () => state.awaiting,
}));
vi.mock("../../../src/ts/test/test-ui", () => ({
  getWordElement: () => (state.visible ? {} : null),
  beforeTestWordChange: vi.fn(),
  afterTestWordChange: vi.fn(),
  afterTestDelete: vi.fn(),
}));
vi.mock("../../../src/ts/test/events/data", () => ({
  getCurrentInput: () => state.inputs[state.index] ?? "",
  getInputForWord: (index: number) => state.inputs[index] ?? "",
  logTestEvent: vi.fn(),
}));
vi.mock("../../../src/ts/test/funbox/list", () => ({
  isFunboxActiveWithProperty: () => false,
}));
vi.mock("../../../src/ts/test/funbox/funbox", () => ({
  toggleScript: vi.fn(),
}));
vi.mock("../../../src/ts/test/pace-caret", () => ({}));
vi.mock("../../../src/ts/test/test-logic", () => ({}));
vi.mock("../../../src/ts/test/events/stats", () => ({}));
vi.mock("../../../src/ts/input/handlers/insert-text", () => ({}));
vi.mock("../../../src/ts/input/handlers/before-insert-text", () => ({}));
vi.mock("../../../src/ts/test/words-generator", () => ({}));

import { Config } from "../../../src/ts/config/store";
import { getInputElement } from "../../../src/ts/input/input-element";
import { logTestEvent } from "../../../src/ts/test/events/data";
import { words } from "../../../src/ts/test/test-words";
import "../../../src/ts/input/listeners/input";

const element = getInputElement();

function deleteLine(inputType: string): void {
  const event = new InputEvent("beforeinput", { inputType, cancelable: true });
  element.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
}

describe.each(["deleteSoftLineBackward", "deleteHardLineBackward"])(
  "%s",
  (inputType) => {
    beforeEach(() => {
      vi.clearAllMocks();
      Object.assign(state, {
        index: 1,
        active: true,
        restarting: false,
        calculating: false,
        awaiting: false,
        visible: true,
        inputs: ["wrong ", "typo"],
      });
      Config.freedomMode = false;
      Config.confidenceMode = "off";
      element.value = " typo";
      words.reset();
      words.push("hello ", 0);
      words.push("world", 0);
    });

    it("clears only the current word and records a word deletion", () => {
      deleteLine(inputType);
      expect(element.value).toBe(" ");
      expect(state.index).toBe(1);
      expect(logTestEvent).toHaveBeenCalledExactlyOnceWith(
        "input",
        expect.any(Number),
        {
          inputType: "deleteWordBackward",
          wordIndex: 1,
          charIndex: 4,
          inputValue: "",
        },
      );
    });

    it("deletes the previous incorrect word when the current word is empty", () => {
      element.value = " ";
      state.inputs[1] = "";
      deleteLine(inputType);
      expect(state.index).toBe(0);
      expect(element.value).toBe(" ");
      expect(logTestEvent).toHaveBeenCalledWith("input", expect.any(Number), {
        inputType: "deleteWordBackward",
        wordIndex: 0,
        charIndex: 0,
        inputValue: "",
      });
    });

    it("stops at a correct word", () => {
      element.value = " ";
      state.inputs = ["hello ", ""];
      deleteLine(inputType);
      expect(state.index).toBe(1);
      expect(logTestEvent).not.toHaveBeenCalled();
    });

    it("allows deleting a correct word in freedom mode", () => {
      element.value = " ";
      state.inputs = ["hello ", ""];
      Config.freedomMode = true;
      deleteLine(inputType);
      expect(state.index).toBe(0);
      expect(logTestEvent).toHaveBeenCalled();
    });

    it.each([
      "inactive",
      "restarting",
      "calculating",
      "awaiting",
      "confidence",
    ] as const)("blocks deletion while %s", (reason) => {
      if (reason === "inactive") state.active = false;
      else if (reason === "confidence") Config.confidenceMode = "max";
      else state[reason] = true;
      deleteLine(inputType);
      expect(element.value).toBe(" typo");
      expect(logTestEvent).not.toHaveBeenCalled();
    });

    it.each(["first word", "hidden word", "confidence"])(
      "blocks backward navigation at %s",
      (reason) => {
        element.value = " ";
        state.inputs[1] = "";
        if (reason === "first word") state.index = 0;
        else if (reason === "hidden word") state.visible = false;
        else Config.confidenceMode = "on";
        const index = state.index;
        deleteLine(inputType);
        expect(state.index).toBe(index);
        expect(logTestEvent).not.toHaveBeenCalled();
      },
    );
  },
);
