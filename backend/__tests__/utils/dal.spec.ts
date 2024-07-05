import * as Dal from "../../src/utils/dal";

describe("dal", () => {
  describe("topMongoFunction", () => {
    it("just works", () => {
      const fn = Dal.toMongoFunction(test1);

      expect(fn).toStrictEqual({
        lang: "js",
        body: "function test1(a, b) {\n  return a + b.toString();\n}",
      });
    });
  });
});

function test1(a: string, b: number): string {
  return a + b.toString();
}
