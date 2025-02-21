import { replace as replace } from "../../src/ts/test/british-english";
import Config from "../../src/ts/config";

describe("british-english", () => {
  describe("replace", () => {
    beforeEach(() => (Config.mode = "time"));

    it("should not replace words with no rule", () => {
      expect(replace("test", "")).resolves.toEqual("test");
      expect(replace("Test", "")).resolves.toEqual("Test");
    });

    it("should replace words", () => {
      expect(replace("math", "")).resolves.toEqual("maths");
      expect(replace("Math", "")).resolves.toEqual("Maths");
    });

    it("should replace words with non-word characters around", () => {
      expect(replace(" :math-. ", "")).resolves.toEqual(" :maths-. ");
      expect(replace(" :Math-. ", "")).resolves.toEqual(" :Maths-. ");
    });

    it("should not replace in quote mode if previousWord matches excepted words", () => {
      //GIVEN
      Config.mode = "quote";

      //WHEN/THEN
      expect(replace("tire", "will")).resolves.toEqual("tire");
      expect(replace("tire", "")).resolves.toEqual("tyre");
    });

    it("should replace hyphenated words", () => {
      expect(replace("cream-colored", "")).resolves.toEqual("cream-coloured");
      expect(replace("armor-flavoring", "")).resolves.toEqual(
        "armour-flavouring"
      );
    });
  });
});
