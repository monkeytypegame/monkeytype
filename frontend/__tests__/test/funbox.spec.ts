import { getAllFunboxes } from "../../src/ts/test/funbox/list";

describe("funbox", () => {
  describe("list", () => {
    it("should have every frontendFunctions function defined", () => {
      for (const funbox of getAllFunboxes()) {
        const packageFunctions = (funbox.frontendFunctions ?? []).sort();
        const implementations = Object.keys(funbox.functions ?? {}).sort();

        let message = "has mismatched functions";

        if (packageFunctions.length > implementations.length) {
          message = `missing function implementation in frontend`;
        } else if (implementations.length > packageFunctions.length) {
          message = `missing properties in frontendFunctions in the package`;
        }

        expect(packageFunctions, `Funbox ${funbox.name} ${message}`).toEqual(
          implementations
        );
      }
    });
  });
});
