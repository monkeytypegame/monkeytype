import { not } from "../src/predicates";

describe("predicates", () => {
  describe("not", () => {
    it("should not a simple boolean function", () => {
      const isTrue = (): boolean => true;
      const isFalse = not(isTrue);

      expect(isFalse()).toBe(false);
    });

    it("should not a numeric predicate", () => {
      const isPositive = (num: number): boolean => num > 0;
      const isNotPositive = not(isPositive);

      expect(isNotPositive(-5)).toBe(true);
      expect(isNotPositive(10)).toBe(false);
    });

    it("should not a predicate taking multiple arguments", () => {
      const containsLetter = (
        str1: string,
        str2: string,
        letter: string
      ): boolean => str1.includes(letter) || str2.includes(letter);
      const doesNotContainLetter = not(containsLetter);

      expect(doesNotContainLetter("hello", "world", "x")).toBe(true);
      expect(doesNotContainLetter("apple", "banana", "a")).toBe(false);
    });

    it("should preserve type safety", () => {
      const isEven = (num: number): boolean => num % 2 === 0;
      const isOdd = not(isEven);

      expect(isOdd(3)).toBe(true);
      expect(isOdd(4)).toBe(false);
    });
  });
});
