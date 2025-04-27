import { describe, it, expect } from "vitest";
import { tryCatch, tryCatchSync } from "../src/trycatch";

describe("tryCatch", () => {
  it("should return data on successful promise resolution", async () => {
    const result = await tryCatch(Promise.resolve("success"));
    expect(result.data).toBe("success");
    expect(result.error).toBeNull();
  });

  it("should return error on promise rejection", async () => {
    const testError = new Error("test error");
    const result = await tryCatch(Promise.reject(testError));
    expect(result.data).toBeNull();
    expect(result.error).toBe(testError);
  });

  it("should handle custom error types", async () => {
    class CustomError extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    }

    const customError = new CustomError("custom error", "E123");
    const result = await tryCatch<string, CustomError>(
      Promise.reject(customError)
    );
    expect(result.data).toBeNull();
    expect(result.error).toBe(customError);
    expect(result.error?.code).toBe("E123");
  });

  it("should handle exceptions in async functions", async () => {
    const testError = new Error("test error");
    const fn = async (): Promise<void> => {
      throw testError;
    };

    const result = await tryCatch(fn());
    expect(result.data).toBeNull();
    expect(result.error).toBe(testError);
  });
});

describe("tryCatchSync", () => {
  it("should return data on successful function execution", () => {
    const result = tryCatchSync(() => "success");
    expect(result.data).toBe("success");
    expect(result.error).toBeNull();
  });

  it("should return error when function throws", () => {
    const testError = new Error("test error");
    const result = tryCatchSync(() => {
      throw testError;
    });
    expect(result.data).toBeNull();
    expect(result.error).toBe(testError);
  });

  it("should handle complex data structures", () => {
    const complexData = {
      foo: "bar",
      numbers: [1, 2, 3],
      nested: { value: true },
    };
    const result = tryCatchSync(() => complexData);
    expect(result.data).toEqual(complexData);
    expect(result.error).toBeNull();
  });

  it("should handle custom error types", () => {
    class CustomError extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    }

    const customError = new CustomError("custom error", "E123");
    const result = tryCatchSync<string, CustomError>(() => {
      throw customError;
    });
    expect(result.data).toBeNull();
    expect(result.error).toBe(customError);
    expect(result.error?.code).toBe("E123");
  });
});
