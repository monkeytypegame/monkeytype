import { render } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";

import { FieldIndicator } from "../../../../src/ts/components/ui/form/FieldIndicator";

function makeField(overrides: {
  isValidating?: boolean;
  isTouched?: boolean;
  isValid?: boolean;
  isDefaultValue?: boolean;
  errors?: string[];
  hasWarning?: boolean;
  warnings?: string[];
}) {
  return {
    state: {
      meta: {
        isValidating: overrides.isValidating ?? false,
        isTouched: overrides.isTouched ?? false,
        isValid: overrides.isValid ?? true,
        isDefaultValue: overrides.isDefaultValue ?? true,
        errors: overrides.errors ?? [],
      },
    },
    getMeta: () => ({
      hasWarning: overrides.hasWarning ?? false,
      warnings: overrides.warnings ?? [],
    }),
  } as any;
}

describe("FieldIndicator", () => {
  it("shows loading spinner when validating", () => {
    const { container } = render(() => (
      <FieldIndicator field={makeField({ isValidating: true })} />
    ));
    expect(container.querySelector(".fa-circle-notch")).toBeInTheDocument();
  });

  it("shows error icon when touched and invalid", () => {
    const { container } = render(() => (
      <FieldIndicator
        field={makeField({
          isTouched: true,
          isValid: false,
          errors: ["bad value"],
        })}
      />
    ));
    expect(container.querySelector(".fa-times")).toBeInTheDocument();
  });

  it("shows warning icon when has warning", () => {
    const { container } = render(() => (
      <FieldIndicator
        field={makeField({
          hasWarning: true,
          warnings: ["weak"],
        })}
      />
    ));
    expect(
      container.querySelector(".fa-exclamation-triangle"),
    ).toBeInTheDocument();
  });

  it("shows success check when touched, valid, and not default", () => {
    const { container } = render(() => (
      <FieldIndicator
        field={makeField({
          isTouched: true,
          isValid: true,
          isDefaultValue: false,
        })}
      />
    ));
    expect(container.querySelector(".fa-check")).toBeInTheDocument();
  });

  it("shows nothing when untouched and not validating", () => {
    const { container } = render(() => (
      <FieldIndicator field={makeField({})} />
    ));
    expect(container.querySelector(".fa-times")).not.toBeInTheDocument();
    expect(container.querySelector(".fa-check")).not.toBeInTheDocument();
    expect(container.querySelector(".fa-circle-notch")).not.toBeInTheDocument();
  });
});
