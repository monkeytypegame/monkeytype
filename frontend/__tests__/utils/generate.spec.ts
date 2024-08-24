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
