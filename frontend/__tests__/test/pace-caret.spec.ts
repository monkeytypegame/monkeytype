import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __testing as ConfigTesting } from "../../src/ts/config";
import * as PaceCaret from "../../src/ts/test/pace-caret";
import * as TestState from "../../src/ts/test/test-state";
import * as TestWords from "../../src/ts/test/test-words";

describe("pace-caret", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    ConfigTesting.replaceConfig({
      paceCaret: "custom",
      paceCaretCustomSpeed: 100,
      blindMode: false,
    });
    TestState.setActive(true);
    TestState.setResultVisible(false);
    TestWords.words.reset();
    PaceCaret.reset();
  });

  afterEach(() => {
    PaceCaret.reset();
    TestWords.words.reset();
    TestState.setActive(false);
    TestState.setResultVisible(false);
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("recovers when the pace caret reaches words that are not generated yet", async () => {
    TestWords.words.push("alpha", 0);
    await PaceCaret.init();

    const initialSettings = PaceCaret.settings;
    expect(initialSettings).not.toBeNull();
    if (initialSettings === null) {
      throw new Error("Pace caret settings were not initialized");
    }

    const showMock = vi.spyOn(PaceCaret.caret, "show");
    const hideMock = vi.spyOn(PaceCaret.caret, "hide");
    vi.spyOn(PaceCaret.caret, "isHidden").mockReturnValue(true);
    vi.spyOn(PaceCaret.caret, "goTo").mockImplementation(() => undefined);

    const endOfFirstWord = TestWords.words.get(0)?.length ?? 1;
    initialSettings.currentWordIndex = 0;
    initialSettings.currentLetterIndex = endOfFirstWord;
    initialSettings.correction = 1;

    await PaceCaret.update(0);

    expect(PaceCaret.settings).not.toBeNull();
    expect(PaceCaret.settings?.currentWordIndex).toBe(0);
    expect(PaceCaret.settings?.currentLetterIndex).toBe(endOfFirstWord);
    expect(PaceCaret.settings?.correction).toBe(1);
    expect(hideMock).toHaveBeenCalled();
    expect(showMock).not.toHaveBeenCalled();

    if (PaceCaret.settings !== null) {
      PaceCaret.settings.correction = 0;
    }
    TestWords.words.push("beta", 1);

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();

    expect(PaceCaret.settings?.currentWordIndex).toBe(1);
    expect(PaceCaret.settings?.currentLetterIndex).toBe(0);
    expect(showMock).toHaveBeenCalledTimes(1);
  });

  it("catches up retry timing when schedule is already behind", async () => {
    ConfigTesting.replaceConfig({
      paceCaret: "custom",
      paceCaretCustomSpeed: 60,
      blindMode: false,
      mode: "time",
      time: 30,
    });
    TestWords.words.push("alpha", 0);
    await PaceCaret.init();

    const currentSettings = PaceCaret.settings;
    expect(currentSettings).not.toBeNull();
    if (currentSettings === null) {
      throw new Error("Pace caret settings were not initialized");
    }

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    vi.spyOn(performance, "now").mockReturnValue(1000);
    vi.spyOn(PaceCaret.caret, "isHidden").mockReturnValue(true);
    vi.spyOn(PaceCaret.caret, "goTo").mockImplementation(() => undefined);

    const endOfFirstWord = TestWords.words.get(0)?.length ?? 1;
    currentSettings.currentWordIndex = 0;
    currentSettings.currentLetterIndex = endOfFirstWord;
    currentSettings.correction = 1;

    await PaceCaret.update(0);

    expect(setTimeoutSpy).toHaveBeenCalled();
    const retryDelay = setTimeoutSpy.mock.calls.at(-1)?.[1];
    expect(retryDelay).toBe(16);
  });

  it("stops retrying when no additional words can be generated", async () => {
    ConfigTesting.replaceConfig({
      paceCaret: "custom",
      paceCaretCustomSpeed: 100,
      blindMode: false,
      mode: "words",
      words: 1,
    });
    TestWords.words.push("alpha", 0);
    await PaceCaret.init();

    const currentSettings = PaceCaret.settings;
    expect(currentSettings).not.toBeNull();
    if (currentSettings === null) {
      throw new Error("Pace caret settings were not initialized");
    }

    vi.spyOn(PaceCaret.caret, "isHidden").mockReturnValue(true);
    vi.spyOn(PaceCaret.caret, "goTo").mockImplementation(() => undefined);

    const endOfFirstWord = TestWords.words.get(0)?.length ?? 1;
    currentSettings.currentWordIndex = 0;
    currentSettings.currentLetterIndex = endOfFirstWord;
    currentSettings.correction = 1;

    await PaceCaret.update(0);

    expect(vi.getTimerCount()).toBe(0);
    expect(PaceCaret.settings).toBeNull();
  });
});
