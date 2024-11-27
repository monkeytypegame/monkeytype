import { getAllFunboxes } from "../../src/ts/test/funbox/list";

describe("funbox", () => {
  describe("list", () => {
    it("should have every frontendFunctions function defined", () => {
      for (const funbox of getAllFunboxes()) {
        const frontendFunctions = funbox.frontendFunctions ?? [];
        const functionImplementations = Object.keys(funbox.functions ?? {});

        expect(
          frontendFunctions
            .map((fn) => functionImplementations.includes(fn))
            .every((x) => x),
          `Funbox functions mismatch for ${
            funbox.name
          }. Make sure that all frontendFunctions are implemented in the frontend, and that all function keys are added in the package.\nPackage:\t${frontendFunctions.join(
            ", "
          )}\nFrontend:\t${functionImplementations.join(
            ", "
          )}\n\n(make sure the package rebuilds before rerunning the tests)\n\n`
        ).toBe(true);
      }
    });
  });
});
