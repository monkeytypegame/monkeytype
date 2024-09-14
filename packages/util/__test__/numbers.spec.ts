import { testNumber } from "../src/numbers";

describe("numbers", () => {
  describe("testNumber", () => {
    it("should return 1", () => {
      expect(testNumber()).toBe(1);
    });
  });
});
