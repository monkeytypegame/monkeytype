import * as List from "../src/list";
import * as Validation from "../src/validation";
import { FunboxMetadata } from "../src/types";

describe("validation", () => {
  describe("checkCompatibility", () => {
    const getFunboxMock = vi.spyOn(List, "getFunbox");

    beforeEach(() => {
      getFunboxMock.mockReset();
    });

    it("should fail for undefined funboxes", () => {
      //GIVEN
      getFunboxMock.mockReturnValueOnce([
        {
          name: "plus_one",
        } as FunboxMetadata,
        undefined as unknown as FunboxMetadata,
      ]);

      //WHEN / THEN
      expect(Validation.checkCompatibility(["plus_one", "plus_two"])).toBe(
        false
      );
      //THEN
    });

    it("should check for optional `withFunbox` ", () => {
      //GIVEN
      getFunboxMock
        .mockReturnValueOnce([
          {
            name: "plus_one",
            cssModifications: ["body", "main"],
          } as FunboxMetadata,
          {
            name: "plus_two",
          } as FunboxMetadata,
        ])
        .mockReturnValueOnce([
          {
            name: "plus_three",
            cssModifications: ["main", "typingTest"],
          } as FunboxMetadata,
        ]);

      //WHEN
      const result = Validation.checkCompatibility(
        ["plus_one", "plus_two"],
        "plus_three"
      );

      //THEN
      expect(result).toBe(false);

      expect(getFunboxMock).toHaveBeenNthCalledWith(1, [
        "plus_one",
        "plus_two",
      ]);
      expect(getFunboxMock).toHaveBeenNthCalledWith(2, "plus_three");
    });

    it("should reject two funboxes modifying the same css element", () => {
      //GIVEN
      getFunboxMock.mockReturnValueOnce([
        {
          name: "plus_one",
          cssModifications: ["body", "main"],
        } as FunboxMetadata,
        {
          name: "plus_two",
          cssModifications: ["main", "typingTest"],
        } as FunboxMetadata,
      ]);

      //WHEN
      const result = Validation.checkCompatibility(["plus_one", "plus_two"]);

      //THEN
      expect(result).toBe(false);

      expect(getFunboxMock).toHaveBeenCalledWith(["plus_one", "plus_two"]);
    });
    it("should allow two funboxes modifying different css elements", () => {
      //GIVEN
      getFunboxMock.mockReturnValueOnce([
        {
          name: "plus_one",
          cssModifications: ["body", "main"],
        } as FunboxMetadata,
        {
          name: "plus_two",
          cssModifications: ["words"],
        } as FunboxMetadata,
      ]);

      //WHEN
      const result = Validation.checkCompatibility(["plus_one", "plus_two"]);

      //THEN
      expect(result).toBe(true);

      expect(getFunboxMock).toHaveBeenCalledWith(["plus_one", "plus_two"]);
    });
  });
});
