import { replace } from "../../src/ts/test/british-english";
import Config from "../../src/ts/config";

describe("british-english", () => {
  describe("replace", () => {
    beforeEach(() => (Config.mode = "time"));

    it("should not replace words with no rule", async () => {
      await expect(replace("test", "")).resolves.toEqual("test");
      await expect(replace("Test", "")).resolves.toEqual("Test");
    });

    it("should replace words", async () => {
      await expect(replace("math", "")).resolves.toEqual("maths");
      await expect(replace("Math", "")).resolves.toEqual("Maths");
    });

    it("should replace words with non-word characters around", async () => {
      await expect(replace(" :math-. ", "")).resolves.toEqual(" :maths-. ");
      await expect(replace(" :Math-. ", "")).resolves.toEqual(" :Maths-. ");
    });

    it("should not replace in quote mode if previousWord matches excepted words", async () => {
      //GIVEN
      Config.mode = "quote";

      //WHEN/THEN
      await expect(replace("tire", "will")).resolves.toEqual("tire");
      await expect(replace("tire", "")).resolves.toEqual("tyre");
    });

    it("should replace hyphenated words", async () => {
      await expect(replace("cream-colored", "")).resolves.toEqual(
        "cream-coloured"
      );
      await expect(replace("armor-flavoring", "")).resolves.toEqual(
        "armour-flavouring"
      );
    });
  });
});
