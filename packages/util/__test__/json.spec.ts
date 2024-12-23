import { parseWithSchema } from "../src/json";
import { z } from "zod";

describe("json", () => {
  describe("parseWithSchema", () => {
    const schema = z.object({
      test: z.boolean().optional(),
      name: z.string(),
      nested: z.object({ foo: z.string() }).strict().optional(),
    });
    it("should parse", () => {
      const json = `{
        "test":true,
        "name":"bob",
        "unknown":"unknown",
        "nested":{
            "foo":"bar"
        }
      }`;

      expect(parseWithSchema(json, schema)).toStrictEqual({
        test: true,
        name: "bob",
        nested: { foo: "bar" },
      });
    });
    it("should fail with invalid schema", () => {
      const json = `{
            "test":"yes",
            "nested":{
                "foo":1
            }
          }`;

      expect(() => parseWithSchema(json, schema)).toThrowError(
        new Error(
          `"test" Expected boolean, received string\n"name" Required\n"nested.foo" Expected string, received number`
        )
      );
    });
  });
});
