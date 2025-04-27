import * as TestEvents from "../../src/ts/test/test-events";

const mockEvents: (TestEvents.TimerEvent | TestEvents.InputEvent)[] = [
  {
    type: "timer",
    mode: "start",
    ms: 0,
  },
  {
    type: "input",
    char: "t",
    input: "",
    targetWord: "test",
    correct: true,
    ms: 1,
    wordIndex: 0,
  },
  {
    type: "timer",
    mode: "step",
    ms: 2,
    time: 1,
  },
  {
    type: "input",
    char: "e",
    input: "t",
    targetWord: "test",
    correct: true,
    ms: 3,
    wordIndex: 0,
  },
  {
    type: "timer",
    mode: "step",
    ms: 4,
    time: 2,
  },
  {
    type: "input",
    char: "s",
    input: "te",
    targetWord: "test",
    correct: true,
    ms: 5,
    wordIndex: 0,
  },
  {
    type: "timer",
    mode: "end",
    ms: 6,
    time: 3,
  },
];

describe("test-events", () => {
  beforeEach(() => {
    TestEvents.reset();
    for (const event of mockEvents) {
      TestEvents.log(event);
    }
  });

  describe("getWpmForTimeIndex", () => {
    // beforeEach(() => {});
    it("should return the correct WPM for a given time index", () => {
      expect(TestEvents.getWpmForTimeIndex(0)).toBe(12);
      expect(TestEvents.getWpmForTimeIndex(1)).toBe(12);
      expect(TestEvents.getWpmForTimeIndex(2)).toBe(12);
    });
  });
});
