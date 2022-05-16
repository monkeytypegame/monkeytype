import * as misc from "../../src/utils/misc";

describe("Misc Utils", () => {
  it("getCurrentDayTimestamp", () => {
    Date.now = jest.fn(() => 1652743381);

    const currentDay = misc.getCurrentDayTimestamp();
    expect(currentDay).toBe(1641600000);
  });

  it("matchesAPattern", () => {
    const patterns = ["eng.+", "hello", "\\d+"];
    const cases = ["english", "aenglish", "123", "hello", "helloworld", "hi"];

    const results = cases.map((text) => misc.matchesAPattern(text, patterns));
    expect(results).toEqual([true, false, true, true, false, false]);
  });
});
