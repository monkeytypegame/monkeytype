import * as TestStats from "../../src/ts/test/test-stats";
import * as TestState from "../../src/ts/test/test-state";
import * as TestInput from "../../src/ts/test/test-input";
import * as TestWords from "../../src/ts/test/test-words";
import * as Config from "../../src/ts/config";

describe("test-stats", () => {
  describe("calculateWpmAndRaw", () => {
    describe("words mode ", () => {
      beforeEach(() => {
        Config.setMode("words");
        TestInput.restart();
        TestInput.input.setKoreanStatus(false);
      });
      it("should calculate during test with decimals", async () => {
        //GIVEN
        setTestDuration(5, true);
        setInput(["one", "twoooooo", "three"], "fo");
        TestWords.words.list = ["one", "two", "three", "four", "five"];
        TestWords.words.currentIndex = 3;

        //WHEN
        const wpmAndRaw = TestStats.calculateWpmAndRaw(true);

        //THEN
        expect(wpmAndRaw.wpm).toBeCloseTo(24.0, 1);
        expect(wpmAndRaw.raw).toBeCloseTo(50.4, 1);
      });

      it("should calculate during test without decimals", async () => {
        //GIVEN
        setTestDuration(5, true);
        setInput(["one", "twoooooo", "three"], "fo");
        TestWords.words.list = ["one", "two", "three", "four", "five"];
        TestWords.words.currentIndex = 3;

        //WHEN
        const wpmAndRaw = TestStats.calculateWpmAndRaw();

        //THEN
        expect(wpmAndRaw.wpm).toEqual(24);
        expect(wpmAndRaw.raw).toEqual(50);
      });

      it("should calculate after test with decimals", async () => {
        //GIVEN
        setTestDuration(5);
        setInput(["one", "twoooooo", "three"], "fo");
        TestWords.words.list = ["one", "two", "three", "four", "five"];
        TestWords.words.currentIndex = 3;

        //WHEN
        const wpmAndRaw = TestStats.calculateWpmAndRaw(true);

        //THEN
        expect(wpmAndRaw.wpm).toBeCloseTo(24.0, 1);
        expect(wpmAndRaw.raw).toBeCloseTo(50.4, 1);
      });

      it("should calculate after test without decimals", async () => {
        //GIVEN
        setTestDuration(5);
        setInput(["one", "twoooooo", "three"], "fo");
        TestWords.words.list = ["one", "two", "three", "four", "five"];
        TestWords.words.currentIndex = 3;

        //WHEN
        const wpmAndRaw = TestStats.calculateWpmAndRaw();

        //THEN
        expect(wpmAndRaw.wpm).toEqual(24);
        expect(wpmAndRaw.raw).toEqual(50);
      });
    });

    describe("zen mode ", () => {
      beforeEach(() => {
        Config.setMode("zen");
        TestInput.restart();
        TestInput.input.setKoreanStatus(false);
      });
      it("should calculate during test with decimals", async () => {
        //GIVEN
        setTestDuration(5, true);
        setInput(["one", "twoooooo", "three"], "fo");

        //WHEN
        const wpmAndRaw = TestStats.calculateWpmAndRaw(true);

        //THEN
        expect(wpmAndRaw.wpm).toBeCloseTo(50.4, 1);
        expect(wpmAndRaw.raw).toBeCloseTo(50.4, 1);
      });

      it("should calculate during test without decimals", async () => {
        //GIVEN
        setTestDuration(5, true);
        setInput(["one", "twoooooo", "three"], "fo");

        //WHEN
        const wpmAndRaw = TestStats.calculateWpmAndRaw();

        //THEN
        expect(wpmAndRaw.wpm).toEqual(50);
        expect(wpmAndRaw.raw).toEqual(50);
      });
    });

    describe("korean", () => {
      describe("words mode ", () => {
        beforeEach(() => {
          Config.setMode("words");
          TestInput.restart();
          TestInput.input.setKoreanStatus(true);
        });
        it("should calculate during test with decimals", async () => {
          //GIVEN
          setTestDuration(5, true);
          setInput(["하나", "둘둘", "셋"], "다");
          TestWords.words.list = ["하나", "둘", "셋", "넷", "다섯"];
          TestWords.words.currentIndex = 3;

          //WHEN
          const wpmAndRaw = TestStats.calculateWpmAndRaw(true);

          //THEN
          expect(wpmAndRaw.wpm).toBeCloseTo(21.6, 1);
          expect(wpmAndRaw.raw).toBeCloseTo(43.2, 1);
        });

        it("should calculate during test without decimals", async () => {
          //GIVEN
          setTestDuration(5, true);
          setInput(["하나", "둘둘", "셋"], "다");
          TestWords.words.list = ["하나", "둘", "셋", "넷", "다섯"];
          TestWords.words.currentIndex = 3;

          //WHEN
          const wpmAndRaw = TestStats.calculateWpmAndRaw();

          //THEN
          expect(wpmAndRaw.wpm).toEqual(22);
          expect(wpmAndRaw.raw).toEqual(43);
        });
      });
      describe("zen mode ", () => {
        beforeEach(() => {
          Config.setMode("zen");
          TestInput.restart();
          TestInput.input.setKoreanStatus(false);
        });
        it("should calculate during test with decimals", async () => {
          //GIVEN
          setTestDuration(5, true);
          setInput(["하나", "둘둘", "셋"], "다");

          //WHEN
          const wpmAndRaw = TestStats.calculateWpmAndRaw(true);

          //THEN
          expect(wpmAndRaw.wpm).toBeCloseTo(21.6, 1);
          expect(wpmAndRaw.raw).toBeCloseTo(21.6, 1);
        });

        it("should calculate during test without decimals", async () => {
          //GIVEN
          setTestDuration(5, true);
          setInput(["하나", "둘둘", "셋"], "다");

          //WHEN
          const wpmAndRaw = TestStats.calculateWpmAndRaw();

          //THEN
          expect(wpmAndRaw.wpm).toEqual(22);
          expect(wpmAndRaw.raw).toEqual(22);
        });
      });
    });
  });
});

function setInput(history: string[], current: string): void {
  TestInput.input.reset();
  for (let word of history) {
    TestInput.input.setCurrent(word);
    TestInput.input.pushHistory();
  }
  TestInput.input.setCurrent(current);
}

function setTestDuration(seconds: number, isActive?: boolean): void {
  const now = performance.now();
  TestStats.setStart(now - seconds * 1000);
  if (isActive === true) {
    TestState.setActive(true);
  } else {
    TestStats.setEnd(now);
  }
}
