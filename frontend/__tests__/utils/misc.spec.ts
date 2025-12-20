import { describe, it, expect, vi } from "vitest";
import {
  getErrorMessage,
  isObject,
  escapeHTML,
  promiseWithResolvers,
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

  describe("escapeHTML", () => {
    it("should escape HTML characters correctly", () => {
      const tests = [
        {
          input: "hello world",
          expected: "hello world",
        },
        {
          input: "<script>alert('xss')</script>",
          expected: "&lt;script&gt;alert(&#39;xss&#39;)&lt;&#x2F;script&gt;",
        },
        {
          input: 'Hello "world" & friends',
          expected: "Hello &quot;world&quot; &amp; friends",
        },
        {
          input: "Click `here` to continue",
          expected: "Click &#x60;here&#x60; to continue",
        },
        {
          input: null,
          expected: null,
        },
        {
          input: undefined,
          expected: undefined,
        },
        {
          input: "",
          expected: "",
        },
      ];

      tests.forEach((test) => {
        const result = escapeHTML(test.input);
        expect(result).toBe(test.expected);
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

  describe("promiseWithResolvers", () => {
    it("should resolve the promise from outside", async () => {
      //GIVEN
      const { promise, resolve } = promiseWithResolvers<number>();

      //WHEN
      resolve(42);

      //THEN
      await expect(promise).resolves.toBe(42);
    });

    it("should resolve new promise after reset using same promise reference", async () => {
      const { promise, resolve, reset } = promiseWithResolvers<number>();
      const firstPromise = promise;

      reset();

      resolve(10);

      await expect(firstPromise).resolves.toBe(10);
      expect(promise).toBe(firstPromise);
    });

    it("should reject the promise from outside", async () => {
      //GIVEN
      const { promise, reject } = promiseWithResolvers<number>();
      const error = new Error("test error");

      //WHEN
      reject(error);

      //THEN
      await expect(promise).rejects.toThrow("test error");
    });

    it("should work with void type", async () => {
      //GIVEN
      const { promise, resolve } = promiseWithResolvers();

      //WHEN
      resolve();

      //THEN
      await expect(promise).resolves.toBeUndefined();
    });

    it("should allow multiple resolves (only first takes effect)", async () => {
      //GIVEN
      const { promise, resolve } = promiseWithResolvers<number>();

      //WHEN
      resolve(42);
      resolve(100); // This should have no effect

      //THEN
      await expect(promise).resolves.toBe(42);
    });

    it("should reset and create a new promise", async () => {
      //GIVEN
      const wrapper = promiseWithResolvers<number>();
      wrapper.resolve(42);
      await expect(wrapper.promise).resolves.toBe(42);

      //WHEN
      wrapper.reset();
      wrapper.resolve(100);

      //THEN
      await expect(wrapper.promise).resolves.toBe(100);
    });

    it("should keep the same promise reference after reset", async () => {
      //GIVEN
      const wrapper = promiseWithResolvers<number>();
      const firstPromise = wrapper.promise;
      wrapper.resolve(42);
      await expect(firstPromise).resolves.toBe(42);

      //WHEN
      wrapper.reset();
      const secondPromise = wrapper.promise;
      wrapper.resolve(100);

      //THEN
      expect(firstPromise).toBe(secondPromise); // Same reference
      await expect(wrapper.promise).resolves.toBe(100);
    });

    it("should allow reject after reset", async () => {
      //GIVEN
      const wrapper = promiseWithResolvers<number>();
      wrapper.resolve(42);
      await wrapper.promise;

      //WHEN
      wrapper.reset();
      const error = new Error("after reset");
      wrapper.reject(error);

      //THEN
      await expect(wrapper.promise).rejects.toThrow("after reset");
    });

    it("should work with complex types", async () => {
      //GIVEN
      type ComplexType = { id: number; data: string[] };
      const { promise, resolve } = promiseWithResolvers<ComplexType>();
      const data: ComplexType = { id: 1, data: ["a", "b", "c"] };

      //WHEN
      resolve(data);

      //THEN
      await expect(promise).resolves.toEqual(data);
    });

    it("should handle rejection with non-Error values", async () => {
      //GIVEN
      const { promise, reject } = promiseWithResolvers<number>();

      //WHEN
      reject("string error");

      //THEN
      await expect(promise).rejects.toBe("string error");
    });

    it("should allow chaining with then/catch", async () => {
      //GIVEN
      const { promise, resolve } = promiseWithResolvers<number>();
      const onFulfilled = vi.fn((value) => value * 2);
      const chained = promise.then(onFulfilled);

      //WHEN
      resolve(21);

      //THEN
      await expect(chained).resolves.toBe(42);
      expect(onFulfilled).toHaveBeenCalledWith(21);
    });

    it("should support async/await patterns", async () => {
      //GIVEN
      const { promise, resolve } = promiseWithResolvers<string>();

      //WHEN
      setTimeout(() => resolve("delayed"), 10);

      //THEN
      const result = await promise;
      expect(result).toBe("delayed");
    });

    it("should maintain independent state for multiple instances", async () => {
      //GIVEN
      const first = promiseWithResolvers<number>();
      const second = promiseWithResolvers<number>();

      //WHEN
      first.resolve(1);
      second.resolve(2);

      //THEN
      await expect(first.promise).resolves.toBe(1);
      await expect(second.promise).resolves.toBe(2);
    });

    it("should resolve old promise reference after reset", async () => {
      //GIVEN
      const wrapper = promiseWithResolvers<number>();
      const oldPromise = wrapper.promise;

      //WHEN
      wrapper.reset();
      wrapper.resolve(42);

      //THEN
      // Old promise reference should still resolve with the same value
      await expect(oldPromise).resolves.toBe(42);
      expect(oldPromise).toBe(wrapper.promise);
    });

    it("should work with Promise.all", async () => {
      //GIVEN
      const first = promiseWithResolvers<number>();
      const second = promiseWithResolvers<number>();
      const third = promiseWithResolvers<number>();

      //WHEN
      first.resolve(1);
      second.resolve(2);
      third.resolve(3);

      //THEN
      await expect(
        Promise.all([first.promise, second.promise, third.promise]),
      ).resolves.toEqual([1, 2, 3]);
    });

    it("should work with Promise.race", async () => {
      //GIVEN
      const first = promiseWithResolvers<string>();
      const second = promiseWithResolvers<string>();

      //WHEN
      first.resolve("first");
      setTimeout(() => second.resolve("second"), 100);

      //THEN
      await expect(Promise.race([first.promise, second.promise])).resolves.toBe(
        "first",
      );
    });
  });
});
