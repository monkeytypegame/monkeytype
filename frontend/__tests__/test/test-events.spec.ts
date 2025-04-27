import { vi } from "vitest";
import * as TestEvents from "../../src/ts/test/test-events";
import * as Test from "../../src/ts/test/test";

const mockEvents = {
  "1": {
    keydown: [],
    keyup: [],
    input: [
      {
        type: "input",
        char: "t",
        input: "",
        targetWord: "test",
        correct: true,
        ms: 1,
        wordIndex: 0,
      },
    ],
  },
  "2": {
    keydown: [],
    keyup: [],
    input: [
      {
        type: "input",
        char: "e",
        input: "t",
        targetWord: "test",
        correct: true,
        ms: 2,
        wordIndex: 0,
      },
    ],
  },
  "3": {
    keydown: [],
    keyup: [],
    input: [
      {
        type: "input",
        char: "s",
        input: "te",
        targetWord: "test",
        correct: true,
        ms: 3,
        wordIndex: 0,
      },
    ],
  },
} as { [key: string]: TestEvents.TimerStepEvents };

describe("test-events", () => {
  const getEventsByTimeMock = vi.spyOn(TestEvents, "getEventsByTime");

  beforeEach(() => {
    getEventsByTimeMock.mockReset();
    getEventsByTimeMock.mockReturnValue(mockEvents);
  });

  describe("getWpmForTimeIndex", () => {
    // beforeEach(() => {});
    it("should return the correct WPM for a given time index", () => {
      // mockReturnValue should be used instead of mockResolvedValue since getEventsByTime is not async
      // getEventsByTimeMock.mockReturnValue(mockEvents);

      // expect(TestEvents.getEventsByTime).toReturnWith(mockEvents);

      const testCases = [
        { timeIndex: 0, expectedWpm: 0 },
        { timeIndex: 1, expectedWpm: 0 },
        { timeIndex: 2, expectedWpm: 0 },
      ];

      // expect(getEventsByTimeMock).toReturnWith(mockEvents);

      testCases.forEach(({ timeIndex, expectedWpm }) => {
        const wpm = Test.getWpmForTimeIndex(timeIndex);
        expect(getEventsByTimeMock).toHaveBeenCalled();
        expect(wpm).toBe(expectedWpm);
      });
    });
  });
});
