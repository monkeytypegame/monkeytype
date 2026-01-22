import { describe, it, expect } from "vitest";
import { CustomBackgroundSchema } from "@monkeytype/schemas/configs";

describe("config schema", () => {
  describe("CustomBackgroundSchema", () => {
    it.for([
      {
        name: "http",
        input: `http://example.com/path/image.png`,
      },
      {
        name: "https",
        input: `https://example.com/path/image.png`,
      },
      {
        name: "png",
        input: `https://example.com/path/image.png`,
      },
      {
        name: "gif",
        input: `https://example.com/path/image.gif?width=5`,
      },
      {
        name: "jpeg",
        input: `https://example.com/path/image.jpeg`,
      },
      {
        name: "jpg",
        input: `https://example.com/path/image.jpg`,
      },
      {
        name: "tiff",
        input: `https://example.com/path/image.tiff`,
        expectedError: "Unsupported image format",
      },
      {
        name: "non-url",
        input: `test`,
        expectedError: "Needs to be an URI",
      },
      {
        name: "single quotes",
        input: `https://example.com/404.jpg?q=alert('1')`,
        expectedError: "May not contain quotes",
      },
      {
        name: "double quotes",
        input: `https://example.com/404.jpg?q=alert("1")`,
        expectedError: "May not contain quotes",
      },
      {
        name: "back tick",
        input: `https://example.com/404.jpg?q=alert(\`1\`)`,
        expectedError: "May not contain quotes",
      },
      {
        name: "javascript url",
        input: `javascript:alert('asdf');//https://example.com/img.jpg`,
        expectedError: "Unsupported protocol",
      },
      {
        name: "data url",
        input: `data:image/gif;base64,data`,
        expectedError: "Unsupported protocol",
      },
      {
        name: "long url",
        input: `https://example.com/path/image.jpeg?q=${new Array(2048)
          .fill("x")
          .join()}`,
        expectedError: "URL is too long",
      },
    ])(`$name`, ({ input, expectedError }) => {
      const parsed = CustomBackgroundSchema.safeParse(input);
      if (expectedError !== undefined) {
        expect(parsed.success).toEqual(false);
        expect(parsed.error?.issues[0]?.message).toEqual(expectedError);
      } else {
        expect(parsed.success).toEqual(true);
      }
    });
  });
});
