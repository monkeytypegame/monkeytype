import * as Util from "../src/util";

describe("util", () => {
  describe("stringToFunboxNames", () => {
    it("should get single funbox", () => {
      expect(Util.stringToFunboxNames("58008")).toEqual(["58008"]);
    });
    it("should fail for unknown funbox name", () => {
      expect(() => Util.stringToFunboxNames("unknown")).toThrowError(
        new Error("Invalid funbox name: unknown")
      );
    });
    it("should split multiple funboxes by hash", () => {
      expect(Util.stringToFunboxNames("58008#choo_choo")).toEqual([
        "58008",
        "choo_choo",
      ]);
    });
  });
});
