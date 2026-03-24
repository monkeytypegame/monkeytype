import { render, screen, fireEvent } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";

import { InputField } from "../../../../src/ts/components/ui/form/InputField";

function makeField(name: string, value = "") {
  return {
    name,
    state: {
      value,
      meta: {
        isValidating: false,
        isTouched: false,
        isValid: true,
        isDefaultValue: true,
        errors: [],
      },
    },
    handleBlur: vi.fn(),
    handleChange: vi.fn(),
    getMeta: () => ({ hasWarning: false, warnings: [] }),
  } as any;
}

describe("InputField", () => {
  it("uses field name as default placeholder", () => {
    const field = makeField("username");
    render(() => <InputField field={() => field} />);

    expect(screen.getByPlaceholderText("username")).toBeInTheDocument();
  });

  it("uses custom placeholder when provided", () => {
    const field = makeField("email");
    render(() => <InputField field={() => field} placeholder="Enter email" />);

    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("defaults to text type", () => {
    const field = makeField("name");
    render(() => <InputField field={() => field} />);

    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });

  it("uses custom type", () => {
    const field = makeField("password");
    const { container } = render(() => (
      <InputField field={() => field} type="password" />
    ));

    expect(container.querySelector("input")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("calls handleChange on input", async () => {
    const field = makeField("name");
    render(() => <InputField field={() => field} />);

    await fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "test" },
    });
    expect(field.handleChange).toHaveBeenCalledWith("test");
  });

  it("calls handleBlur on blur", async () => {
    const field = makeField("name");
    render(() => <InputField field={() => field} />);

    await fireEvent.blur(screen.getByRole("textbox"));
    expect(field.handleBlur).toHaveBeenCalled();
  });

  it("calls onFocus callback", async () => {
    const field = makeField("name");
    const onFocus = vi.fn();
    render(() => <InputField field={() => field} onFocus={onFocus} />);

    await fireEvent.focus(screen.getByRole("textbox"));
    expect(onFocus).toHaveBeenCalled();
  });

  it("renders disabled input", () => {
    const field = makeField("name");
    render(() => <InputField field={() => field} disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("shows FieldIndicator when showIndicator is true", () => {
    const field = makeField("name");
    field.state.meta.isValidating = true;
    const { container } = render(() => (
      <InputField field={() => field} showIndicator />
    ));

    expect(container.querySelector(".fa-circle-notch")).toBeInTheDocument();
  });

  it("hides FieldIndicator by default", () => {
    const field = makeField("name");
    const { container } = render(() => <InputField field={() => field} />);

    expect(container.querySelector(".fa-circle-notch")).not.toBeInTheDocument();
  });
});
