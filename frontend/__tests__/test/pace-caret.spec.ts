import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const caretMock = vi.hoisted(() => ({
  hidden: true,
  goTo: vi.fn(),
}));

vi.mock("../../src/ts/elements/caret", () => ({
  Caret: class {
    goTo = caretMock.goTo;
    hide(): void {
      caretMock.hidden = true;
    }
    show(): void {
      caretMock.hidden = false;
    }
    isHidden(): boolean {
      return caretMock.hidden;
    }
    stopAllAnimations = vi.fn();
    clearMargins = vi.fn();
    setStyle = vi.fn();
  },
}));

vi.mock("../../src/ts/utils/dom", () => ({ qsr: () => null }));
vi.mock("../../src/ts/db", () => ({ getLocalPB: () => undefined }));
vi.mock("../../src/ts/collections/tags", () => ({ getActiveTagsPB: () => 0 }));
vi.mock("../../src/ts/collections/results", () => ({
  getUserAverage10Once: async () => ({ wpm: 0 }),
  getUserDailyBestOnce: async () => ({ wpm: 0 }),
}));
vi.mock("../../src/ts/test/funbox/list", () => ({
  getActiveFunboxes: () => [],
}));
vi.mock("../../src/ts/events/config", () => ({
  configEvent: { subscribe: () => undefined },
}));
vi.mock("../../src/ts/utils/misc", () => ({ getMode2: () => "10" }));
vi.mock("../../src/ts/config/store", () => ({
  Config: {
    paceCaret: "custom",
    paceCaretCustomSpeed: 60,
    paceCaretStyle: "default",
    blindMode: false,
    mode: "words",
  },
}));
vi.mock("../../src/ts/states/test", () => ({
  isDirectionReversed: () => false,
  isLanguageRightToLeft: () => false,
  getActiveWordIndex: () => 0,
  getCurrentQuote: () => null,
  getResultVisible: () => false,
  isPaceRepeat: () => false,
  isTestActive: () => true,
  setPaceCaretWpm: () => undefined,
}));

import { words } from "../../src/ts/test/test-words";
import * as PaceCaret from "../../src/ts/test/pace-caret";

// 60 wpm = 300 chars per minute = one step every 200ms
// start() takes the first step right away, so steps(n) means n + 1 steps total
const STEP = 200;

async function steps(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await vi.advanceTimersByTimeAsync(STEP);
  }
}

function lastPosition(): { wordIndex: number; letterIndex: number } {
  const call = caretMock.goTo.mock.lastCall?.[0] as {
    wordIndex: number;
    letterIndex: number;
  };
  return { wordIndex: call.wordIndex, letterIndex: call.letterIndex };
}

describe("pace-caret", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    words.reset();
    caretMock.hidden = true;
    caretMock.goTo.mockClear();
    words.push("one ", 0);
    words.push("two ", 0);
    words.push("three ", 0);
    await PaceCaret.init();
    PaceCaret.start();
  });

  afterEach(() => {
    PaceCaret.reset();
    vi.useRealTimers();
  });

  it("steps through generated words", async () => {
    await steps(2);
    expect(lastPosition()).toEqual({ wordIndex: 0, letterIndex: 3 });
    await steps(1);
    expect(lastPosition()).toEqual({ wordIndex: 1, letterIndex: 0 });
  });

  it("hides when it runs past the generated words", async () => {
    await steps(13);
    expect(caretMock.hidden).toBe(false);
    await steps(1);
    expect(caretMock.hidden).toBe(true);
  });

  it("comes back at the right spot once more words are generated", async () => {
    await steps(20);
    expect(caretMock.hidden).toBe(true);

    words.push("four ", 0);
    words.push("five ", 0);
    await steps(1);

    expect(caretMock.hidden).toBe(false);
    // 22 steps: 4 + 4 + 6 for the first three words, 5 for "four", 3 into "five"
    expect(lastPosition()).toEqual({ wordIndex: 4, letterIndex: 3 });
  });

  it("keeps stepping after coming back", async () => {
    await steps(20);
    words.push("four ", 0);
    words.push("five ", 0);
    await steps(2);
    expect(lastPosition()).toEqual({ wordIndex: 4, letterIndex: 4 });
  });
});
