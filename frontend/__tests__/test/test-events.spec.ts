import * as TestEvents from "../../src/ts/test/test-events";
// import * as TestStats from "../../src/ts/test/test-stats";

// const mockEvents: (TestEvents.TimerEvent | TestEvents.InputEvent)[] = [
//   {
//     type: "timer",
//     mode: "start",
//     ms: 0,
//   },
//   {
//     type: "input",
//     char: "t",
//     input: "",
//     targetWord: "test",
//     correct: true,
//     ms: 1,
//     wordIndex: 0,
//   },
//   {
//     type: "timer",
//     mode: "step",
//     ms: 2,
//     time: 1,
//   },
//   {
//     type: "input",
//     char: "e",
//     input: "t",
//     targetWord: "test",
//     correct: true,
//     ms: 3,
//     wordIndex: 0,
//   },
//   {
//     type: "timer",
//     mode: "step",
//     ms: 4,
//     time: 2,
//   },
//   {
//     type: "input",
//     char: "x",
//     input: "te",
//     targetWord: "test",
//     correct: true,
//     ms: 5,
//     wordIndex: 0,
//   },
//   {
//     type: "timer",
//     mode: "end",
//     ms: 6,
//     time: 3,
//   },
// ];

// vi.spyOn(TestStats, "start").mockReturnValue(0);

type MinifiedTimer = ["timer", "start" | "step" | "end", number];
type MinifiedInput = ["input", "insert", string] | ["input", "remove"];
type MinifiedEvents = (MinifiedTimer | MinifiedInput)[];

function logEvents(events: MinifiedEvents, words: string[]): void {
  TestEvents.reset();

  let currentWordIndex = 0;
  let currentTime = 0;
  let currentMs = 0;
  let currentInput = "";

  for (const event of events) {
    if (event[0] === "timer") {
      TestEvents.log({
        type: "timer",
        mode: event[1],
        ms: currentMs,
        time: currentTime,
      });
      currentTime++;
    }

    if (event[0] === "input") {
      if (event[1] === "insert") {
        let correct = false;

        if (event[2] === " ") {
          correct = words[currentWordIndex] === currentInput;
        } else {
          correct =
            words[currentWordIndex]?.startsWith(currentInput + event[2]) ??
            false;
        }

        TestEvents.log({
          type: "input",
          mode: "insert",
          char: event[2],
          input: currentInput,
          targetWord: words[currentWordIndex] as string,
          correct,
          ms: currentMs,
          wordIndex: currentWordIndex,
        });
        currentInput += event[2];
      } else if (event[1] === "remove") {
        if (currentInput.length === 0) throw new Error("No input to remove");
        TestEvents.log({
          type: "input",
          mode: "remove",
          input: currentInput,
          targetWord: words[currentWordIndex] as string,
          ms: currentMs,
          wordIndex: currentWordIndex,
        });
        currentInput = currentInput.slice(0, -1);
      }
    }

    currentMs++;
  }
}

describe("test-events", () => {
  describe("getWpmHistory", () => {
    const words = ["test", "words"];

    it("should correctly calculate wpm history", () => {
      const events = [
        ["timer", "start"],
        ["input", "insert", "t"],
        ["timer", "step"],
        ["input", "insert", "e"],
        ["timer", "step"],
        ["input", "insert", "s"],
        ["timer", "end"],
      ] as MinifiedEvents;
      logEvents(events, words);
      const history = TestEvents.getWpmHistory();
      expect(history.length).toEqual(
        events.filter(
          (e) => e[0] === "timer" && (e[1] === "step" || e[1] === "end")
        ).length
      );
      // console.log(JSON.stringify(TestEvents.getAll(), null, 2));
      expect(TestEvents.getWpmHistory()).toEqual([12, 12, 12]);
      // expect(TestEvents.getWpmForTimeIndex(1)).toEqual(12);
    });

    it("should correctly calculate wpm history", () => {
      const events = [
        ["timer", "start"],
        ["input", "insert", "t"],
        ["timer", "step"],
        ["input", "insert", "e"],
        ["timer", "step"],
        ["input", "insert", "s"],
        ["timer", "step"],
        ["input", "insert", "t"],
        ["timer", "step"],
        ["input", "insert", " "],
        ["timer", "step"],
        ["input", "insert", "w"],
        ["timer", "step"],
        ["input", "insert", "o"],
        ["timer", "step"],
        ["input", "insert", "r"],
        ["timer", "step"],
        ["input", "insert", "d"],
        ["timer", "end"],
      ] as MinifiedEvents;
      logEvents(events, words);
      // console.log(JSON.stringify(TestEvents.getAll(), null, 2));
      const history = TestEvents.getWpmHistory();
      expect(history.length).toEqual(
        events.filter(
          (e) => e[0] === "timer" && (e[1] === "step" || e[1] === "end")
        ).length
      );
      expect(history).toEqual([12, 12, 12, 12, 12, 12, 12, 12]);
      // expect(TestEvents.getWpmForTimeIndex(1)).toEqual(12);
    });

    it("should correctly calculate wpm history", () => {
      const events = [
        ["timer", "start"],
        ["input", "insert", "t"],
        ["input", "remove"],
        ["timer", "step"],
        ["timer", "step"],
        ["timer", "end"],
      ] as MinifiedEvents;
      logEvents(events, words);
      // console.log(JSON.stringify(TestEvents.getAll(), null, 2));
      expect(TestEvents.getWpmHistory()).toEqual([0, 0, 0]);
    });

    it("should correctly calculate wpm history", () => {
      const events = [
        ["timer", "start"],
        ["input", "insert", "t"],
        ["timer", "step"],
        ["input", "remove"],
        ["timer", "step"],
        ["timer", "end"],
      ] as MinifiedEvents;
      logEvents(events, words);
      // console.log(JSON.stringify(TestEvents.getAll(), null, 2));
      expect(TestEvents.getWpmHistory()).toEqual([12, 0, 0]);
    });
  });
});
