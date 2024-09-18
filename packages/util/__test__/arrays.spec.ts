import * as Arrays from "../src/arrays";

describe("arrays", () => {
  it("intersect", () => {
    const testCases = [
      {
        a: [1],
        b: [2],
        removeDuplicates: false,
        expected: [],
      },
      {
        a: [1],
        b: [1],
        removeDuplicates: false,
        expected: [1],
      },
      {
        a: [1, 1],
        b: [1],
        removeDuplicates: true,
        expected: [1],
      },
      {
        a: [1, 1],
        b: [1],
        removeDuplicates: false,
        expected: [1, 1],
      },
      {
        a: [1],
        b: [1, 2, 3],
        removeDuplicates: false,
        expected: [1],
      },
      {
        a: [1, 1],
        b: [1, 2, 3],
        removeDuplicates: true,
        expected: [1],
      },
    ];

    testCases.forEach(({ a, b, removeDuplicates, expected }) => {
      expect(Arrays.intersect(a, b, removeDuplicates)).toEqual(expected);
    });
  });
});
