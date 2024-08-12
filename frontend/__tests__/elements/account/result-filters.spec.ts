import defaultResultFilters from "../../../src/ts/constants/default-result-filters";
import { mergeWithDefaultFilters } from "../../../src/ts/elements/account/result-filters";

describe("result-filters.ts", () => {
  describe("mergeWithDefaultFilters", () => {
    it("should merge with default filters correctly", () => {
      const tests = [
        {
          input: {
            pb: {
              no: false,
              yes: false,
            },
          },
          expected: () => {
            const expected = defaultResultFilters;
            expected.pb.no = false;
            expected.pb.yes = false;
            return expected;
          },
        },
        {
          input: {
            words: {
              "10": false,
            },
          },
          expected: () => {
            const expected = defaultResultFilters;
            expected.words["10"] = false;
            return expected;
          },
        },
        {
          input: {
            blah: true,
          },
          expected: () => {
            return defaultResultFilters;
          },
        },
        {
          input: 1,
          expected: () => {
            return defaultResultFilters;
          },
        },
        {
          input: null,
          expected: () => {
            return defaultResultFilters;
          },
        },
        {
          input: undefined,
          expected: () => {
            return defaultResultFilters;
          },
        },
        {
          input: {},
          expected: () => {
            return defaultResultFilters;
          },
        },
      ];
      tests.forEach((test) => {
        const merged = mergeWithDefaultFilters(test.input as any);
        expect(merged).toEqual(test.expected());
      });
    });
  });
});
