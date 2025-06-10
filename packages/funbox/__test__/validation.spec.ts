import * as List from "../src/list";
import * as Validation from "../src/validation";
import { FunboxMetadata } from "../src/types";

describe("validation", () => {
  describe("checkCompatibility", () => {
    const getFunboxMock = vi.spyOn(List, "getFunbox");

    beforeEach(() => {
      getFunboxMock.mockReset();
    });

    it("should pass without funboxNames", () => {
      //WHEN / THEN
      expect(Validation.checkCompatibility([])).toBe(true);
    });

    it("should fail for undefined funboxNames", () => {
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
    });

    it("should fail for undefined withFunbox param", () => {
      //GIVEN
      getFunboxMock
        .mockReturnValueOnce([])
        .mockReturnValue([undefined as unknown as FunboxMetadata]);

      //WHEN / THEN
      expect(
        Validation.checkCompatibility(["plus_one", "plus_two"], "plus_three")
      ).toBe(false);
    });

    it("should check for optional withFunbox param ", () => {
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

      //WHEN / THEN
      expect(Validation.checkCompatibility(["plus_one", "plus_two"])).toBe(
        false
      );
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

      //WHEN / THEN
      expect(Validation.checkCompatibility(["plus_one", "plus_two"])).toBe(
        true
      );
    });
    describe("should validate two funboxes modifying the wordset", () => {
      const testCases = [
        {
          firstFunction: "withWords",
          secondFunction: "withWords",
          compatible: false,
        },
        {
          firstFunction: "withWords",
          secondFunction: "getWord",
          compatible: false,
        },
        {
          firstFunction: "getWord",
          secondFunction: "pullSection",
          compatible: false,
        },
      ];

      it.for(testCases)(
        `expect $firstFunction and $secondFunction to be compatible $compatible`,
        ({ firstFunction, secondFunction, compatible }) => {
          //GIVEN
          getFunboxMock.mockReturnValueOnce([
            {
              name: "plus_one",
              frontendFunctions: [firstFunction],
            } as FunboxMetadata,
            {
              name: "plus_two",
              frontendFunctions: [secondFunction],
            } as FunboxMetadata,
          ]);

          //WHEN / THEN
          expect(Validation.checkCompatibility(["plus_one", "plus_two"])).toBe(
            compatible
          );
        }
      );
    });
  });
});
