import { z } from "zod";
import {
  deepClone,
  getErrorMessage,
  isObject,
  sanitize,
} from "../../src/ts/utils/misc";
import {
  getLanguageDisplayString,
  removeLanguageSize,
} from "../../src/ts/utils/strings";
import { Language } from "@monkeytype/schemas/languages";

describe("misc.ts", () => {
  describe("getLanguageDisplayString", () => {
    it("should return correctly formatted strings", () => {
      const tests: {
        input: Language;
        noSizeString: boolean;
        expected: string;
      }[] = [
        {
          input: "english",
          noSizeString: false,
          expected: "english",
        },
        {
          input: "english_1k",
          noSizeString: false,
          expected: "english 1k",
        },
        {
          input: "english_1k",
          noSizeString: true,
          expected: "english",
        },
        {
          input: "english_medical",
          noSizeString: false,
          expected: "english medical",
        },
        {
          input: "arabic_egypt_1k",
          noSizeString: false,
          expected: "arabic egypt 1k",
        },
        {
          input: "arabic_egypt_1k",
          noSizeString: true,
          expected: "arabic egypt",
        },
      ];

      tests.forEach((test) => {
        const result = getLanguageDisplayString(test.input, test.noSizeString);
        expect(result).toBe(test.expected);
      });
    });
  });
  describe("removeLanguageSize", () => {
    it("should remove language size", () => {
      const tests: { input: Language; expected: Language }[] = [
        {
          input: "english",
          expected: "english",
        },
        {
          input: "english_1k",
          expected: "english",
        },
        {
          input: "arabic_egypt",
          expected: "arabic_egypt",
        },
        {
          input: "arabic_egypt_1k",
          expected: "arabic_egypt",
        },
      ];

      tests.forEach((test) => {
        const result = removeLanguageSize(test.input);
        expect(result).toBe(test.expected);
      });
    });
  });
  describe("isObject", () => {
    it("should correctly identify objects", () => {
      const tests = [
        {
          input: {},
          expected: true,
        },
        {
          input: { a: 1 },
          expected: true,
        },
        {
          input: [],
          expected: false,
        },
        {
          input: [1, 2, 3],
          expected: false,
        },
        {
          input: "string",
          expected: false,
        },
        {
          input: 1,
          expected: false,
        },
        {
          input: null,
          expected: false,
        },
        {
          input: undefined,
          expected: false,
        },
      ];

      tests.forEach((test) => {
        const result = isObject(test.input);
        expect(result).toBe(test.expected);
      });
    });
  });
  describe("deepClone", () => {
    it("should correctly clone objects", () => {
      const tests = [
        {
          input: {},
          expected: {},
        },
        {
          input: { a: 1 },
          expected: { a: 1 },
        },
        {
          input: { a: { b: 2 } },
          expected: { a: { b: 2 } },
        },
        {
          input: { a: { b: 2 }, c: [1, 2, 3] },
          expected: { a: { b: 2 }, c: [1, 2, 3] },
        },
        {
          input: [],
          expected: [],
        },
        {
          input: [1, 2, 3],
          expected: [1, 2, 3],
        },
        {
          input: "string",
          expected: "string",
        },
        {
          input: 1,
          expected: 1,
        },
        {
          input: null,
          expected: null,
        },
        {
          input: undefined,
          expected: undefined,
        },
      ];

      tests.forEach((test) => {
        const result = deepClone(test.input);
        expect(result).toStrictEqual(test.expected);
      });
    });
  });
  describe("getErrorMesssage", () => {
    it("should correctly get the error message", () => {
      const tests = [
        {
          input: null,
          expected: undefined,
        },
        {
          input: undefined,
          expected: undefined,
        },
        {
          input: "",
          expected: undefined,
        },
        {
          input: {},
          expected: undefined,
        },
        {
          input: "error message",
          expected: "error message",
        },
        {
          input: 1,
          expected: "1",
        },
        {
          input: { message: "error message" },
          expected: "error message",
        },
        {
          input: { message: 1 },
          expected: "1",
        },
        {
          input: { message: "" },
          expected: undefined,
        },
        {
          input: { message: {} },
          expected: undefined,
        },
        {
          input: new Error("error message"),
          expected: "error message",
        },
      ];

      tests.forEach((test) => {
        const result = getErrorMessage(test.input);
        expect(result).toBe(test.expected);
      });
    });
  });
  describe("sanitize function", () => {
    describe("arrays", () => {
      const numberArraySchema = z.array(z.number());
      const numbersArrayMin2Schema = numberArraySchema.min(2);

      const testCases: {
        input: number[];
        expected: {
          numbers: number[] | boolean;
          numbersMin: number[] | boolean;
        };
      }[] = [
        { input: [], expected: { numbers: true, numbersMin: false } },
        { input: [1, 2], expected: { numbers: true, numbersMin: true } },
        {
          input: [1, "2" as any],
          expected: { numbers: [1], numbersMin: false },
        },
        {
          input: ["one", "two"] as any,
          expected: { numbers: [], numbersMin: false },
        },
      ];
      it.for(testCases)("number array with $input", ({ input, expected }) => {
        const sanitized = expect(
          expected.numbers === false
            ? () => sanitize(numberArraySchema, input)
            : sanitize(numberArraySchema, input)
        );

        if (expected.numbers === false) {
          sanitized.toThrowError();
        } else if (expected.numbers === true) {
          sanitized.toStrictEqual(input);
        } else {
          sanitized.toStrictEqual(expected.numbers);
        }
      });
      it.for(testCases)(
        "number array.min(2) with $input",
        ({ input, expected }) => {
          const sanitized = expect(
            expected.numbersMin === false
              ? () => sanitize(numbersArrayMin2Schema, input)
              : sanitize(numbersArrayMin2Schema, input)
          );

          if (expected.numbersMin === false) {
            sanitized.toThrowError();
          } else if (expected.numbersMin === true) {
            sanitized.toStrictEqual(input);
          } else {
            sanitized.toStrictEqual(expected.numbersMin);
          }
        }
      );
    });
    describe("objects", () => {
      const objectSchema = z.object({
        name: z.string(),
        age: z.number().positive(),
        tags: z.array(z.string()),
        enumArray: z.array(z.enum(["one", "two"])).min(2),
      });
      const objectSchemaFullPartial = objectSchema.partial().strip();
      const objectSchemaWithOptional = objectSchema.partial({
        tags: true,
        enumArray: true,
      });

      const testCases: {
        input: z.infer<typeof objectSchemaFullPartial>;
        expected: {
          mandatory: z.infer<typeof objectSchema> | boolean;
          partial: z.infer<typeof objectSchemaFullPartial> | boolean;
          optional: z.infer<typeof objectSchemaWithOptional> | boolean;
        };
      }[] = [
        {
          input: {},
          expected: { mandatory: false, partial: true, optional: false },
        },
        {
          input: {
            name: "Alice",
            age: 23,
            tags: ["one", "two"],
            enumArray: ["one", "two"],
          },
          expected: { mandatory: true, partial: true, optional: true },
        },
        {
          input: {
            name: "Alice",
            age: 23,
          },
          expected: { mandatory: false, partial: true, optional: true },
        },
        {
          input: {
            name: "Alice",
            age: "sixty" as any,
          },
          expected: {
            mandatory: false,
            partial: { name: "Alice" },
            optional: false,
          },
        },
        {
          input: {
            name: "Alice",
            age: 23,
            tags: ["one", 2 as any],
            enumArray: "one" as any,
          },
          expected: {
            mandatory: false,
            partial: { name: "Alice", age: 23, tags: ["one"] },
            optional: { name: "Alice", age: 23, tags: ["one"] },
          },
        },
        {
          input: {
            name: "Alice",
            age: 23,
            tags: [1, 2] as any,
            enumArray: [1, 2] as any,
          },
          expected: {
            mandatory: false,
            partial: { name: "Alice", age: 23 },
            optional: { name: "Alice", age: 23 },
          },
        },
        {
          input: {
            name: "Alice",
            age: 23,
            extraArray: [],
            extraObject: {},
            extraString: "",
          } as any,
          expected: {
            mandatory: false,
            partial: { name: "Alice", age: 23 },
            optional: { name: "Alice", age: 23 },
          },
        },
      ];

      it.for(testCases)(
        "object mandatory with $input",
        ({ input, expected }) => {
          const sanitized = expect(
            expected.mandatory === false
              ? () => sanitize(objectSchema, input as any)
              : sanitize(objectSchema, input as any)
          );

          if (expected.mandatory === false) {
            sanitized.toThrowError();
          } else if (expected.mandatory === true) {
            sanitized.toStrictEqual(input);
          } else {
            sanitized.toStrictEqual(expected.mandatory);
          }
        }
      );
      it.for(testCases)(
        "object full partial with $input",
        ({ input, expected }) => {
          const sanitized = expect(
            expected.partial === false
              ? () => sanitize(objectSchemaFullPartial, input as any)
              : sanitize(objectSchemaFullPartial, input as any)
          );

          if (expected.partial === false) {
            sanitized.toThrowError();
          } else if (expected.partial === true) {
            sanitized.toStrictEqual(input);
          } else {
            sanitized.toStrictEqual(expected.partial);
          }
        }
      );
      it.for(testCases)(
        "object optional with $input",
        ({ input, expected }) => {
          const sanitized = expect(
            expected.optional === false
              ? () => sanitize(objectSchemaWithOptional, input as any)
              : sanitize(objectSchemaWithOptional, input as any)
          );

          if (expected.optional === false) {
            sanitized.toThrowError();
          } else if (expected.optional === true) {
            sanitized.toStrictEqual(input);
          } else {
            sanitized.toStrictEqual(expected.optional);
          }
        }
      );
    });

    describe("nested", () => {
      const itemSchema = z.object({
        name: z.string(),
        enumArray: z.array(z.enum(["one", "two"])).min(2),
      });
      const nestedSchema = z.object({
        nested: z.array(itemSchema),
      });

      const nestedSchemaFullPartial = z
        .object({
          nested: z.array(itemSchema.partial()),
        })
        .partial();
      const nestedSchemaWithMin2Array = z.object({
        nested: z.array(itemSchema).min(2),
      });

      const testCases: {
        input: z.infer<typeof nestedSchema>;
        expected: {
          mandatory: z.infer<typeof nestedSchema> | boolean;
          partial: z.infer<typeof nestedSchemaFullPartial> | boolean;
          minArray: z.infer<typeof nestedSchemaWithMin2Array> | boolean;
        };
      }[] = [
        {
          input: {} as any,
          expected: {
            mandatory: false,
            partial: true,
            minArray: false,
          },
        },
        {
          input: {
            nested: [
              { name: "Alice", enumArray: ["one", "two"] },
              { name: "Bob", enumArray: ["one", "two"] },
            ],
          },
          expected: {
            mandatory: true,
            partial: true,
            minArray: true,
          },
        },
        {
          input: {
            nested: [
              { name: "Alice", enumArray: ["one", "two"] },
              { name: "Bob" } as any,
            ],
          },
          expected: {
            mandatory: {
              nested: [{ name: "Alice", enumArray: ["one", "two"] }],
            },
            partial: true,
            minArray: false,
          },
        },
        {
          input: {
            nested: [
              { enumArray: ["one", "two"] } as any,
              { name: "Bob" } as any,
            ],
          },
          expected: {
            mandatory: false,
            partial: true,
            minArray: false,
          },
        },
      ];

      it.for(testCases)(
        "nested mandatory with $input",
        ({ input, expected }) => {
          const sanitized = expect(
            expected.mandatory === false
              ? () => sanitize(nestedSchema, input as any)
              : sanitize(nestedSchema, input as any)
          );

          if (expected.mandatory === false) {
            sanitized.toThrowError();
          } else if (expected.mandatory === true) {
            sanitized.toStrictEqual(input);
          } else {
            sanitized.toStrictEqual(expected.mandatory);
          }
        }
      );
      it.for(testCases)("nested partial with $input", ({ input, expected }) => {
        const sanitized = expect(
          expected.partial === false
            ? () => sanitize(nestedSchemaFullPartial, input as any)
            : sanitize(nestedSchemaFullPartial, input as any)
        );

        if (expected.partial === false) {
          sanitized.toThrowError();
        } else if (expected.partial === true) {
          sanitized.toStrictEqual(input);
        } else {
          sanitized.toStrictEqual(expected.partial);
        }
      });
      it.for(testCases)(
        "nested array min(2) with $input",
        ({ input, expected }) => {
          const sanitized = expect(
            expected.minArray === false
              ? () => sanitize(nestedSchemaWithMin2Array, input as any)
              : sanitize(nestedSchemaWithMin2Array, input as any)
          );

          if (expected.minArray === false) {
            sanitized.toThrowError();
          } else if (expected.minArray === true) {
            sanitized.toStrictEqual(input);
          } else {
            sanitized.toStrictEqual(expected.minArray);
          }
        }
      );
    });

    const schema = z
      .object({
        name: z.string(),
        age: z.number().positive(),
        tags: z.array(z.string()),
        enumArray: z.array(z.enum(["one", "two"])).min(2),
      })
      .partial()
      .strip();

    it("should strip extra keys", () => {
      const obj = {
        name: "bob",
        age: 30,
        tags: ["developer", "coder"],
        powerLevel: 9001,
      } as any;
      const stripped = sanitize(schema.strip(), obj);
      expect(stripped).not.toHaveProperty("powerLevel");
    });
    it("should strip extra keys on error", () => {
      const obj = {
        name: "bob",
        age: 30,
        powerLevel: 9001,
      } as any;
      const stripped = sanitize(schema.strip(), obj);
      expect(stripped).not.toHaveProperty("powerLevel");
    });
    it("should provide a readable error message", () => {
      const obj = {
        arrayOneTwo: ["one", "nonexistent"],
      } as any;
      expect(() => {
        sanitize(schema.required().strip(), obj);
      }).toThrowError(
        "unable to sanitize: name: Required, age: Required, tags: Required, enumArray: Required"
      );
    });
  });
});
