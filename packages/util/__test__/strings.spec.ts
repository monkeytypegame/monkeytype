import { describe, expect, it } from "vitest";
import { kebabToCamelCase } from "../src/strings";

describe("strings", () => {
  describe("kebabToCamelCase", () => {
    it("should convert kebab case to camel case", () => {
      expect(kebabToCamelCase("hello-world")).toEqual("helloWorld");
      expect(kebabToCamelCase("helloWorld")).toEqual("helloWorld");
      expect(
        kebabToCamelCase("one-two-three-four-five-six-seven-eight-nine-ten"),
      ).toEqual("oneTwoThreeFourFiveSixSevenEightNineTen");
    });
  });
});
