import { describe, it, expect } from "vitest";
import * as generate from "../../src/ts/utils/generate";

describe("hexadecimal", () => {
  it("should generate a random hexadecimal string", () => {
    const hex = generate.getHexadecimal();
    expect(hex.length).toSatisfy(
      (len: number) => len % 2 === 0,
      "The length of the hexadecimal string should be even."
    );

    expect(hex.length).toBeGreaterThanOrEqual(2);
    expect(hex.length).toBeLessThanOrEqual(16);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });
});

describe("specials", () => {
  it("should generate valid special character strings", () => {
    let foundComma = false;
    let foundPeriod = false;
    const expectedSpecials = generate.__testing.specials;

    // Generate 1000 special "words" and check each
    for (let i = 0; i < 1000; i++) {
      const specials = generate.getSpecials();

      // Check min/max length (1-7 as per implementation)
      expect(specials.length).toBeGreaterThanOrEqual(1);
      expect(specials.length).toBeLessThanOrEqual(7);

      // Check that every character is from the expected specials array
      for (const char of specials) {
        expect(expectedSpecials).toContain(char);
        if (char === ",") foundComma = true;
        if (char === ".") foundPeriod = true;
      }
    }

    // Ensure comma and period were found during the test
    expect(foundComma).toBe(true);
    expect(foundPeriod).toBe(true);
  });
});
