import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

import {
  fromSchema,
  handleResult,
  allFieldsMandatory,
  fieldMandatory,
  type ValidationResult,
} from "../../../../src/ts/components/ui/form/utils";

describe("fromSchema", () => {
  const schema = z.string().min(3, "too short").max(10, "too long");
  const validate = fromSchema(schema);

  it("returns undefined for valid value", () => {
    expect(validate({ value: "hello" })).toBeUndefined();
  });

  it("returns error messages for invalid value", () => {
    expect(validate({ value: "ab" })).toEqual(["too short"]);
  });

  it("returns multiple error messages", () => {
    const numSchema = z.number().min(5, "too small").max(3, "too big");
    const v = fromSchema(numSchema);
    const result = v({ value: 4 });
    // 4 fails min(5) but passes max(3)? Actually 4 > 3, so both fail
    // number 4: min(5) fails, max(3) fails
    expect(result).toEqual(["too small", "too big"]);
  });
});

describe("handleResult", () => {
  const mockSetMeta = vi.fn();

  function makeField() {
    mockSetMeta.mockClear();
    return { setMeta: mockSetMeta } as any;
  }

  it("returns undefined for undefined results", () => {
    expect(handleResult(makeField(), undefined)).toBeUndefined();
  });

  it("returns undefined for empty results", () => {
    expect(handleResult(makeField(), [])).toBeUndefined();
  });

  it("returns error messages and ignores warnings", () => {
    const results: ValidationResult[] = [
      { type: "error", message: "bad email" },
      { type: "error", message: "too short" },
    ];
    expect(handleResult(makeField(), results)).toEqual([
      "bad email",
      "too short",
    ]);
  });

  it("sets warning meta on field", () => {
    const results: ValidationResult[] = [
      { type: "warning", message: "weak password" },
    ];
    const field = makeField();
    const result = handleResult(field, results);

    expect(result).toBeUndefined();
    expect(mockSetMeta).toHaveBeenCalledOnce();

    const updater = mockSetMeta.mock.calls[0]![0];
    const newMeta = updater({ existing: true });
    expect(newMeta).toEqual({
      existing: true,
      hasWarning: true,
      warnings: ["weak password"],
    });
  });

  it("handles both errors and warnings", () => {
    const results: ValidationResult[] = [
      { type: "warning", message: "not recommended" },
      { type: "error", message: "invalid" },
    ];
    const field = makeField();
    const result = handleResult(field, results);

    expect(mockSetMeta).toHaveBeenCalledOnce();
    expect(result).toEqual(["invalid"]);
  });
});

describe("allFieldsMandatory", () => {
  const validate = allFieldsMandatory<{ a: string; b: string }>();

  it("returns undefined when all fields have values", () => {
    expect(validate({ value: { a: "x", b: "y" } })).toBeUndefined();
  });

  it("returns error when a field is empty string", () => {
    expect(validate({ value: { a: "x", b: "" } })).toBe(
      "all fields are mandatory",
    );
  });

  it("returns error when a field is undefined", () => {
    expect(validate({ value: { a: "x", b: undefined } as any })).toBe(
      "all fields are mandatory",
    );
  });
});

describe("fieldMandatory", () => {
  it("returns undefined for non-empty value", () => {
    const validate = fieldMandatory();
    expect(validate({ value: "hello" })).toBeUndefined();
  });

  it("returns default message for empty string", () => {
    const validate = fieldMandatory();
    expect(validate({ value: "" })).toBe("mandatory");
  });

  it("returns default message for undefined", () => {
    const validate = fieldMandatory();
    expect(validate({ value: undefined })).toBe("mandatory");
  });

  it("returns custom message", () => {
    const validate = fieldMandatory("required field");
    expect(validate({ value: "" })).toBe("required field");
  });
});
