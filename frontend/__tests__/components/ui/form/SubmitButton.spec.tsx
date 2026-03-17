import { render, screen } from "@solidjs/testing-library";
import { JSXElement } from "solid-js";
import { describe, it, expect } from "vitest";

import { SubmitButton } from "../../../../src/ts/components/ui/form/SubmitButton";

type FormState = {
  canSubmit: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
};

function makeForm(state: Partial<FormState> = {}) {
  const fullState: FormState = {
    canSubmit: true,
    isSubmitting: false,
    isValid: true,
    isDirty: true,
    ...state,
  };

  return {
    Subscribe: (props: {
      selector: (state: FormState) => FormState;
      children: (state: () => FormState) => JSXElement;
    }) => props.children(() => props.selector(fullState)),
  };
}

describe("SubmitButton", () => {
  it("renders enabled when form is dirty, valid, and can submit", () => {
    render(() => <SubmitButton form={makeForm()} text="Save" />);
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("renders as submit type", () => {
    render(() => <SubmitButton form={makeForm()} text="Save" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("disables when form is not dirty", () => {
    render(() => (
      <SubmitButton form={makeForm({ isDirty: false })} text="Save" />
    ));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables when form cannot submit", () => {
    render(() => (
      <SubmitButton form={makeForm({ canSubmit: false })} text="Save" />
    ));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables when form is submitting", () => {
    render(() => (
      <SubmitButton form={makeForm({ isSubmitting: true })} text="Save" />
    ));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables when form is not valid", () => {
    render(() => (
      <SubmitButton form={makeForm({ isValid: false })} text="Save" />
    ));
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables when disabled prop is true even if form is ready", () => {
    render(() => <SubmitButton form={makeForm()} text="Save" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
