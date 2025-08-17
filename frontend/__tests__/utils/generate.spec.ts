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
  const expectedSpecials = [
    "`",
    "~",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "_",
    "=",
    "+",
    "{",
    "}",
    "[",
    "]",
    "'",
    '"',
    "/",
    "\\",
    "|",
    "?",
    ";",
    ":",
    ">",
    "<",
    ",",
    ".",
  ];

  it("should generate a random string of special characters", () => {
    const specials = generate.getSpecials();

    // Check length is within expected range (1-7 as per implementation)
    expect(specials.length).toBeGreaterThanOrEqual(1);
    expect(specials.length).toBeLessThanOrEqual(7);

    // Check that every character in the generated string is from the expected specials array
    for (const char of specials) {
      expect(expectedSpecials).toContain(char);
    }
  });

  it("should include comma and period characters", () => {
    // Test multiple times to increase chance of getting these characters
    const results = new Set<string>();
    let foundComma = false;
    let foundPeriod = false;

    // Generate many samples to ensure we get comma and period
    for (let i = 0; i < 1000; i++) {
      const specials = generate.getSpecials();
      for (const char of specials) {
        results.add(char);
        if (char === ",") foundComma = true;
        if (char === ".") foundPeriod = true;
      }

      // Early exit if we found both
      if (foundComma && foundPeriod) break;
    }

    expect(foundComma).toBe(true);
    expect(foundPeriod).toBe(true);
  });

  it("should only contain valid special characters", () => {
    for (let i = 0; i < 100; i++) {
      const specials = generate.getSpecials();

      // Verify no letters, numbers, or unexpected characters
      expect(specials).not.toMatch(/[a-zA-Z0-9]/);

      // Verify all characters are in our expected list
      for (const char of specials) {
        expect(expectedSpecials).toContain(char);
      }
    }
  });
});
