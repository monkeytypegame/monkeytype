import _ from "lodash";
import * as pb from "../../src/utils/pb";

describe("Pb Utils", () => {
  it("funboxCatGetPb", () => {
    const testCases = [
      {
        funbox: "plus_one",
        expected: true,
      },
      {
        funbox: "none",
        expected: true,
      },
      {
        funbox: "nausea#plus_one",
        expected: true,
      },
      {
        funbox: "arrows",
        expected: false,
      },
    ];

    _.each(testCases, (testCase) => {
      const { funbox, expected } = testCase;
      //@ts-ignore ignore because this expects a whole result object
      const result = pb.canFunboxGetPb({
        funbox,
      });

      expect(result).toBe(expected);
    });
  });
});
