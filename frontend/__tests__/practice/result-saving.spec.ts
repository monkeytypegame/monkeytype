import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Config } from "../../src/ts/config/store";
import { getDefaultConfig } from "../../src/ts/constants/default-config";
import { applyKeySelection } from "../../src/ts/practice/selection";
import { defaultConfig } from "../../src/ts/practice/types";
import { finish } from "../../src/ts/test/test-logic";
import { EventLog } from "../../src/ts/test/events/types";
import {
  getIncompleteTests,
  getLastResult,
  getLastSignedOutResult,
  pushIncompleteTest,
  resetIncompleteTests,
  setCurrentQuote,
  setIsRepeated,
  setLastSignedOutResult,
  setResultCalculating,
  setTestActive,
} from "../../src/ts/states/test";

const { eventLog, resultUpdate, addResult, account } = vi.hoisted(() => ({
  account: { signedIn: false },
  eventLog: { current: null as EventLog | null },
  resultUpdate: vi.fn().mockResolvedValue(undefined),
  addResult: vi.fn(),
}));
vi.mock("../../src/ts/test/events/data", async (original) => ({
  ...(await original<typeof import("../../src/ts/test/events/data")>()),
  buildEventLog: () => eventLog.current,
  cleanupData: vi.fn(),
  forceReleaseAllKeys: vi.fn(),
  logEventsDataToTheConsoleTable: vi.fn(),
}));
vi.mock("../../src/ts/firebase", () => ({
  getAuthenticatedUser: () =>
    account.signedIn ? { uid: "practice-user" } : null,
}));
vi.mock("../../src/ts/ape", () => ({
  default: { results: { add: addResult } },
}));
vi.mock("../../src/ts/test/result", () => ({
  update: resultUpdate,
  updateTodayTracker: vi.fn(),
}));
vi.mock("../../src/ts/test/test-ui", () => ({ onTestFinish: vi.fn() }));
vi.mock("../../src/ts/test/test-timer", () => ({ clear: vi.fn() }));
vi.mock("../../src/ts/test/pace-caret", () => ({ setLastTestWpm: vi.fn() }));
vi.mock("../../src/ts/collections/tags", () => ({
  __nonReactive: { getActiveTags: () => [] },
}));
vi.mock("../../src/ts/test/today-tracker", () => ({ addSeconds: vi.fn() }));
vi.mock("../../src/ts/controllers/analytics-controller", () => ({
  log: vi.fn(),
}));
vi.mock("../../src/ts/utils/misc", async (original) => ({
  ...(await original<typeof import("../../src/ts/utils/misc")>()),
  promiseAnimate: vi.fn().mockResolvedValue(undefined),
  sleep: vi.fn().mockResolvedValue(undefined),
}));

function completedDrill(): EventLog {
  const events: EventLog["events"] = [
    { type: "timer", testMs: 0, data: { event: "start", timer: 0, date: 0 } },
  ];
  for (let i = 0; i < 10; i++) {
    const time = i * 1000 + 200;
    events.push(
      { type: "keydown", testMs: time, data: { code: "KeyA" } },
      {
        type: "input",
        testMs: time,
        data: {
          wordIndex: i,
          charIndex: 0,
          inputValue: "a",
          inputType: "insertText",
          data: "a",
          correct: true,
        },
      },
      { type: "keyup", testMs: time + 50, data: { code: "KeyA" } },
    );
    if (i < 9) {
      events.push(
        { type: "keydown", testMs: time + 200, data: { code: "Space" } },
        {
          type: "input",
          testMs: time + 200,
          data: {
            wordIndex: i,
            charIndex: 1,
            inputValue: "a ",
            inputType: "insertText",
            data: " ",
            correct: true,
            commitsWord: true,
          },
        },
        { type: "keyup", testMs: time + 250, data: { code: "Space" } },
      );
    }
    events.push({
      type: "timer",
      testMs: (i + 1) * 1000,
      data: { event: "step", timer: i + 1, drift: 0 },
    });
  }
  events.push({
    type: "timer",
    testMs: 10000,
    data: { event: "end", timer: 10, date: 10000 },
  });
  return {
    version: 1,
    events,
    context: {
      targetWords: Array.from({ length: 10 }, (_, i) => (i === 9 ? "a" : "a ")),
      mode: "words",
      mode2: "10",
      bailedOut: false,
      koreanStatus: false,
    },
  };
}

beforeEach(() => {
  Object.assign(Config, getDefaultConfig(), {
    mode: "words",
    words: 10,
    resultSaving: true,
    funbox: [],
  });
  account.signedIn = false;
  eventLog.current = completedDrill();
  resetIncompleteTests();
  setCurrentQuote(null);
  setIsRepeated(false);
  setLastSignedOutResult(null);
  setTestActive(true);
  setResultCalculating(false);
  vi.clearAllMocks();
});
afterEach(() => {
  applyKeySelection(null);
  resetIncompleteTests();
  setTestActive(false);
  setResultCalculating(false);
});

describe("focused result isolation", () => {
  it.each([
    { kind: "completed", signedIn: false },
    { kind: "repeated", signedIn: false },
    { kind: "failed", signedIn: false },
    { kind: "completed", signedIn: true },
    { kind: "repeated", signedIn: true },
    { kind: "failed", signedIn: true },
  ])(
    "does not save $kind practice (signed in: $signedIn) or add it to normal incomplete tests",
    async ({ kind, signedIn }) => {
      account.signedIn = signedIn;
      applyKeySelection({ ...defaultConfig, characters: ["a"] });
      pushIncompleteTest({ acc: 95, seconds: 3 });
      setIsRepeated(kind === "repeated");
      await finish(kind === "failed");
      expect(getLastResult()?.acc).toBe(100);
      expect(getLastResult()?.testDuration).toBe(10);
      expect(getIncompleteTests()).toEqual([{ acc: 95, seconds: 3 }]);
      expect(getLastSignedOutResult()).toBeNull();
      expect(addResult).not.toHaveBeenCalled();
      expect(resultUpdate).toHaveBeenCalledOnce();
      expect(resultUpdate.mock.calls[0]?.[7]).toBe(true);
    },
  );
  it("still keeps normal failed tests and completed signed-out results", async () => {
    applyKeySelection(null);
    await finish(true);
    expect(getIncompleteTests()).toHaveLength(1);
    setTestActive(true);
    setResultCalculating(false);
    await finish();
    expect(getLastSignedOutResult()?.acc).toBe(100);
    expect(getLastSignedOutResult()?.testDuration).toBe(10);
  });
});
