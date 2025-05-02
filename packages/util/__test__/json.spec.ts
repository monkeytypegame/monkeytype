import { parseWithSchema } from "../src/json";
import { z } from "zod";

describe("json", () => {
  describe("parseWithSchema", () => {
    const schema = z.object({
      test: z.boolean().optional(),
      name: z.string(),
      nested: z.object({ foo: z.string() }).strict().optional(),
    });
    it("should throw with invalid json", () => {
      expect(() => parseWithSchema("blah", schema)).toThrowError(
        new Error(
          `Invalid JSON: Unexpected token 'b', "blah" is not valid JSON`
        )
      );
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
    it("should throw with invalid schema", () => {
      const json = `{
            "test":"yes",
            "nested":{
                "foo":1
            }
          }`;

      expect(() => parseWithSchema(json, schema)).toThrowError(
        new Error(
          `JSON does not match schema: "test" expected boolean, received string, "name" required, "nested.foo" expected string, received number`
        )
      );
    });
    it("should migrate if valid json", () => {
      const json = `{
          "name": 1,
          }`;

      const result = parseWithSchema(json, schema, () => {
        return {
          name: "migrated",
          test: false,
        };
      });

      expect(result).toStrictEqual({
        name: "migrated",
        test: false,
      });
    });
    it("should migrate if invalid json", () => {
      const json = `blah`;

      const result = parseWithSchema(json, schema, () => {
        return {
          name: "migrated",
          test: false,
        };
      });

      expect(result).toStrictEqual({
        name: "migrated",
        test: false,
      });
    });
    it("should throw if migration fials", () => {
      const json = `{
          "name": 1,
          }`;

      expect(() => {
        //@ts-expect-error need to test migration failure
        parseWithSchema(json, schema, () => {
          return {
            name: null,
            test: "Hi",
          };
        });
      }).toThrowError(
        new Error(
          `Migrated value does not match schema: "test" expected boolean, received string, "name" expected string, received null`
        )
      );
    });
    it("migrate function should receive value", () => {
      const json = "invalid";

      const result = parseWithSchema(json, schema, (value) => {
        expect(value).toEqual(null);
        return {
          name: "migrated",
          test: false,
        };
      });
      expect(result).toStrictEqual({
        name: "migrated",
        test: false,
      });

      const json2 = `{
        "test":"test"
      }`;

      const result2 = parseWithSchema(json2, schema, (value) => {
        expect(value).toEqual({ test: "test" });
        return {
          name: "valid",
        };
      });

      expect(result2).toStrictEqual({
        name: "valid",
      });
    });
  });
});
