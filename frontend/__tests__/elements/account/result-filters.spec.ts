import {
  defaultResultFilters,
  mergeWithDefaultFilters,
} from "../../../src/ts/elements/account/result-filters";

describe("result-filters.ts", () => {
  describe("mergeWithDefaultFilters", () => {
    it("should merge with default filters correctly", () => {
      const merged = mergeWithDefaultFilters({
        pb: {
          no: false,
          yes: false,
        },
      });

      const expected = JSON.parse(JSON.stringify(defaultResultFilters));
      expected.pb.no = false;
      expected.pb.yes = false;

      expect(merged).toEqual(expected);

      console.log(defaultResultFilters);
    });
  });
});
