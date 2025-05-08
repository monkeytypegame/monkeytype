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
          "name": 1
          }`;

      const result = parseWithSchema(json, schema, {
        migrate: () => {
          return {
            name: "migrated",
            test: false,
          };
        },
      });

      expect(result).toStrictEqual({
        name: "migrated",
        test: false,
      });
    });
    it("should revert to fallback if invalid json", () => {
      const json = `blah`;

      const result = parseWithSchema(json, schema, {
        fallback: {
          name: "migrated",
          test: false,
        },
      });

      expect(result).toStrictEqual({
        name: "migrated",
        test: false,
      });
    });
    it("should throw if migration fails", () => {
      const json = `{
          "name": 1
          }`;

      expect(() => {
        parseWithSchema(json, schema, {
          //@ts-expect-error need to test migration failure
          migrate: () => {
            return {
              name: null,
              test: "Hi",
            };
          },
        });
      }).toThrowError(
        new Error(
          `Migrated value does not match schema: "test" expected boolean, received string, "name" expected string, received null`
        )
      );
    });
    it("should revert to fallback if migration fails", () => {
      const json = `{
          "name": 1
          }`;

      const result = parseWithSchema(json, schema, {
        fallback: {
          name: "fallback",
          test: false,
        },
        //@ts-expect-error need to test migration failure
        migrate: () => {
          return {
            name: null,
            test: "Hi",
          };
        },
      });

      expect(result).toStrictEqual({
        name: "fallback",
        test: false,
      });
    });
    it("migrate function should receive value", () => {
      const json = `{
        "test":"test"
      }`;

      const result = parseWithSchema(json, schema, {
        migrate: (value) => {
          expect(value).toEqual({ test: "test" });
          return {
            name: "valid",
          };
        },
      });

      expect(result).toStrictEqual({
        name: "valid",
      });
    });
  });
});
