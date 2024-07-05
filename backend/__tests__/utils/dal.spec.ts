import { wrapMongoFunction } from "../../src/utils/dal";

describe("dal", () => {
  describe("wrapMongoFunction", () => {
    it("just works", () => {
      const wrapped = wrapMongoFunction(test1);

      const fn = wrapped("$some.path", "fixedValue");

      console.log(fn);
      expect(fn).toStrictEqual({
        lang: "js",
        args: ["$some.path", "fixedValue"],
        body: "function test1(a, b) {\n  return a + b;\n}",
      });
    });
  });
});

function test1(a: string, b: string): string {
  return a + b;
}
