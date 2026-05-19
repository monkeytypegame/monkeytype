import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInputElementValue,
  setInputElementValue,
} from "../../../src/ts/input/input-element";
import { onInsertText } from "../../../src/ts/input/handlers/insert-text";
import {
  getLigatureCompletion,
  getMatchingLigatureOverride,
  resetPendingLigatureCompletion,
} from "../../../src/ts/input/helpers/ligatures";

const mocks = vi.hoisted(() => ({
  currentWord: "",
  input: {
    current: "",
    syncWithInputElement: vi.fn(),
  },
  incrementKeypressErrors: vi.fn(),
}));

vi.mock("../../../src/ts/test/test-ui", () => ({
  afterTestTextInput: vi.fn(),
}));
vi.mock("../../../src/ts/test/test-state", () => ({
  activeWordIndex: 0,
  isActive: true,
}));
vi.mock("../../../src/ts/test/test-logic", () => ({
  areAllTestWordsGenerated: vi.fn(() => false),
  startTest: vi.fn(),
}));
vi.mock("../../../src/ts/test/test-input", () => ({
  input: mocks.input,
  corrected: { update: vi.fn() },
  incrementAccuracy: vi.fn(),
  incrementKeypressCount: vi.fn(),
  incrementKeypressErrors: mocks.incrementKeypressErrors,
  pushKeypressWord: vi.fn(),
  pushMissedWord: vi.fn(),
  setBurstStart: vi.fn(),
  setCurrentNotAfk: vi.fn(),
}));
vi.mock("../../../src/ts/test/test-words", () => ({
  words: {
    getCurrentText: vi.fn(() => mocks.currentWord),
  },
}));
vi.mock("../../../src/ts/input/helpers/fail-or-finish", () => ({
  checkIfFailedDueToDifficulty: vi.fn(),
  checkIfFailedDueToMinBurst: vi.fn(),
  checkIfFinished: vi.fn(),
}));
vi.mock("../../../src/ts/test/funbox/list", () => ({
  findSingleActiveFunboxWithFunction: vi.fn(),
  isFunboxActiveWithProperty: vi.fn(() => false),
}));
vi.mock("../../../src/ts/test/replay", () => ({
  addReplayEvent: vi.fn(),
}));
vi.mock("../../../src/ts/config/store", () => ({
  Config: {
    blindMode: false,
    keymapMode: "off",
    language: "english",
    mode: "words",
    oppositeShiftMode: "off",
    stopOnError: "off",
  },
}));
vi.mock("../../../src/ts/events/keymap", () => ({
  flash: vi.fn(),
}));
vi.mock("../../../src/ts/test/weak-spot", () => ({
  updateScore: vi.fn(),
}));
vi.mock("../../../src/ts/legacy-states/composition", () => ({
  getComposing: vi.fn(() => false),
  getData: vi.fn(() => ""),
}));
vi.mock("../../../src/ts/input/state", () => ({
  getIncorrectShiftsInARow: vi.fn(() => 0),
  incrementIncorrectShiftsInARow: vi.fn(),
  isCorrectShiftUsed: vi.fn(() => true),
  resetIncorrectShiftsInARow: vi.fn(),
}));
vi.mock("../../../src/ts/states/notifications", () => ({
  showNoticeNotification: vi.fn(),
}));
vi.mock("../../../src/ts/input/helpers/word-navigation", () => ({
  goToNextWord: vi.fn(async () => ({
    increasedWordIndex: false,
    lastBurst: null,
  })),
}));
vi.mock("../../../src/ts/input/handlers/before-insert-text", () => ({
  onBeforeInsertText: vi.fn(),
}));

describe("insert-text ligature input overrides", () => {
  beforeEach(() => {
    mocks.currentWord = "";
    mocks.input.current = "";
    mocks.input.syncWithInputElement.mockImplementation(() => {
      mocks.input.current = getInputElementValue().inputValue;
    });
    setInputElementValue("");
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetPendingLigatureCompletion();
    setInputElementValue("");
  });

  it.each([
    ["o", "œ", "œ"],
    ["O", "Œ", "Œ"],
    ["a", "æ", "æ"],
    ["A", "Æ", "Æ"],
  ])(
    "normalizes '%s' to '%s' when target is '%s'",
    (data, target, expected) => {
      expect(getMatchingLigatureOverride(data, target)).toBe(expected);
    },
  );

  it.each([
    ["œ", "e"],
    ["Œ", "E"],
    ["æ", "e"],
    ["Æ", "E"],
  ])("gets completion '%s' after '%s'", (target, completion) => {
    expect(getLigatureCompletion(target)).toBe(completion);
  });

  it("does not normalize unrelated input", () => {
    expect(getMatchingLigatureOverride("e", "œ")).toBeNull();
    expect(getLigatureCompletion("o")).toBeNull();
  });

  it("removes the completion character and keeps input state synced", async () => {
    mocks.currentWord = "œuvre";

    setInputElementValue("o");
    await onInsertText({
      now: performance.now(),
      data: "o",
    });

    setInputElementValue("œe");

    await onInsertText({
      now: performance.now(),
      data: "e",
    });

    expect(getInputElementValue().inputValue).toBe("œ");
    expect(mocks.input.current).toBe("œ");
    expect(mocks.input.syncWithInputElement).toHaveBeenCalledTimes(2);
    expect(mocks.incrementKeypressErrors).not.toHaveBeenCalled();
  });

  it("penalizes skipping the ligature completion character", async () => {
    mocks.currentWord = "œuvre";

    setInputElementValue("o");
    await onInsertText({
      now: performance.now(),
      data: "o",
    });

    setInputElementValue("œu");
    await onInsertText({
      now: performance.now(),
      data: "u",
    });

    expect(mocks.input.current).toBe("œu");
    expect(mocks.incrementKeypressErrors).toHaveBeenCalledOnce();
  });
});
