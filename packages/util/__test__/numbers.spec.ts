import * as Numbers from "../src/numbers";

describe("numbers", () => {
  describe("roundTo1", () => {
    it("should correctly round", () => {
      const tests = [
        {
          in: 0.0,
          out: 0,
        },
        {
          in: 0.01,
          out: 0.0,
        },
        {
          in: 0.09,
          out: 0.1,
        },
        {
          in: 0.123,
          out: 0.1,
        },
        {
          in: 0.456,
          out: 0.5,
        },
        {
          in: 0.789,
          out: 0.8,
        },
      ];

      tests.forEach((test) => {
        expect(Numbers.roundTo1(test.in)).toBe(test.out);
      });
    });

    it("mapRange", () => {
      const testCases = [
        {
          input: {
            value: 123,
            inMin: 0,
            inMax: 200,
            outMin: 0,
            outMax: 1000,
            clamp: false,
          },
          expected: 615,
        },
        {
          input: {
            value: 123,
            inMin: 0,
            inMax: 200,
            outMin: 1000,
            outMax: 0,
            clamp: false,
          },
          expected: 385,
        },
        {
          input: {
            value: 10001,
            inMin: 0,
            inMax: 10000,
            outMin: 0,
            outMax: 1000,
            clamp: false,
          },
          expected: 1000.1,
        },
        {
          input: {
            value: 10001,
            inMin: 0,
            inMax: 10000,
            outMin: 0,
            outMax: 1000,
            clamp: true,
          },
          expected: 1000,
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(
          Numbers.mapRange(
            input.value,
            input.inMin,
            input.inMax,
            input.outMin,
            input.outMax,
            input.clamp
          )
        ).toEqual(expected);
      });
    });
  });
});
