import { replaceAccents } from "../../src/ts/test/lazy-mode";

let germanAccents = [
  ["ö", "oe"],
  ["ä", "ae"],
  ["ü", "ue"],
] as [string, string][];

let multicharAccents = [
  ["a", "bc"],
  ["de", "f"],
  ["gh", "ij"],
] as [string, string][];

describe("lazy-mode", () => {
  describe("replaceAccents", () => {
    it("should replace common accents", () => {
      const result = replaceAccents("Héllö");
      expect(result).toBe("Hello");
    });
    it("should extend common accents with additional accents", () => {
      const result = replaceAccents("Héllö", [["ö", "oe"]]);
      expect(result).toBe("Helloe");
    });
    it("should remove accent if empty", () => {
      const result = replaceAccents("خصوصًا", [["ٌ", ""]]);
      expect(result).toBe("خصوصا");
    });
    it("should ignore empty word", () => {
      const result = replaceAccents("");
      expect(result).toBe("");
    });
    describe("german accents", () => {
      it("should replace additional accents", () => {
        const result = replaceAccents("Tränenüberströmt", germanAccents);
        expect(result).toBe("Traenenueberstroemt");
      });
      it("should replace starting with uppercase accent", () => {
        const result = replaceAccents("Äpfel", germanAccents);
        expect(result).toBe("Aepfel");
      });
      it("should replace common accents", () => {
        const result = replaceAccents("äße", germanAccents);
        expect(result).toBe("aesse");
      });
    });
    describe("multicharacter accents", () => {
      it("should correctly replace multicharacter accents", () => {
        const tests = [
          { input: "a", expected: "bc" },
          { input: "aa", expected: "bcbc" },
          { input: "de", expected: "f" },
          { input: "dede", expected: "ff" },
          { input: "gh", expected: "ij" },
          { input: "ghgh", expected: "ijij" },
          { input: "abcdefgh", expected: "bcbcffij" },
        ];

        tests.forEach(({ input, expected }) => {
          const result = replaceAccents(input, multicharAccents);
          expect(result).toBe(expected);
        });
      });
    });
  });
});
