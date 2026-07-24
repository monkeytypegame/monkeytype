import { render, screen, fireEvent } from "@solidjs/testing-library";
import { AnyFieldApi } from "@tanstack/solid-form";
import { describe, it, expect, vi } from "vitest";

import { InputField } from "../../../../src/ts/components/ui/form/InputField";

function makeField(
  name: string,
  value?: string | number | boolean,
): AnyFieldApi {
  let current = value;
  const meta = {
    isValidating: false,
    isTouched: false,
    isValid: true,
    isDefaultValue: true,
    errors: [] as string[],
  };
  return {
    name,
    get state() {
      return {
        value: current,
        meta,
      };
    },
    options: { default: value },
    handleBlur: vi.fn(),
    handleChange: vi.fn((v: unknown) => {
      current = v as typeof value;
    }),
    setValue: vi.fn(),
    getMeta: () => ({ hasWarning: false, warnings: [] }),
    form: { options: { defaultValues: { [name]: value } } } as any,
  } as unknown as AnyFieldApi;
}

describe("InputField", () => {
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

    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "test" },
    });
    expect(field.handleChange).toHaveBeenCalledWith("test");
  });

  it("calls handleChange on input for number", async () => {
    const field = makeField("name", 2.5);
    render(() => <InputField field={() => field} type="number" />);

    fireEvent.input(screen.getByRole("spinbutton"), {
      target: { value: "1.25" },
    });
    expect(field.handleChange).toHaveBeenCalledWith(1.25);
  });

  it("calls handleBlur on blur", async () => {
    const field = makeField("name");
    render(() => <InputField field={() => field} />);

    fireEvent.blur(screen.getByRole("textbox"));
    expect(field.handleBlur).toHaveBeenCalled();
  });

  it("calls onFocus callback", async () => {
    const field = makeField("name");
    const onFocus = vi.fn();
    render(() => <InputField field={() => field} onFocus={onFocus} />);

    fireEvent.focus(screen.getByRole("textbox"));
    expect(onFocus).toHaveBeenCalled();
  });

  it("renders disabled input", () => {
    const field = makeField("name");
    render(() => <InputField field={() => field} disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("shows FieldIndicator", () => {
    const field = makeField("name");
    field.options = { validators: { onChange: () => undefined } } as any;
    field.state.meta.isValidating = true;
    const { container } = render(() => <InputField field={() => field} />);

    expect(container.querySelector(".fa-circle-notch")).toBeInTheDocument();
  });

  it("hides FieldIndicator by default", () => {
    const field = makeField("name");
    const { container } = render(() => <InputField field={() => field} />);

    expect(container.querySelector(".fa-circle-notch")).not.toBeInTheDocument();
  });

  it("resets to default value on blur when empty for type number", async () => {
    const field = makeField("age", 25);
    field.form = { options: { defaultValues: { age: 25 } } } as any;
    render(() => (
      <InputField
        field={() => field}
        type="number"
        resetToDefaultIfEmptyOnBlur
      />
    ));

    fireEvent.input(screen.getByRole("spinbutton"), {
      target: { value: "" },
    });
    fireEvent.blur(screen.getByRole("spinbutton"));
    expect(field.setValue).toHaveBeenCalledWith(25);
  });

  it("resets to default value on blur when empty for type string", async () => {
    const field = makeField("name", "Alice");
    field.form = { options: { defaultValues: { name: "Alice" } } } as any;
    render(() => (
      <InputField field={() => field} resetToDefaultIfEmptyOnBlur />
    ));

    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "" },
    });
    fireEvent.blur(screen.getByRole("textbox"));
    expect(field.setValue).toHaveBeenCalledWith("Alice");
  });

  it("renders NaN as empty string for type number", async () => {
    const field = makeField("value", NaN);
    render(() => <InputField field={() => field} type="number" />);

    expect(screen.getByRole("spinbutton").getAttribute("value")).toBeNull();
  });

  it("handles empty then numeric input with default value", async () => {
    const field = makeField("age", 5);
    render(() => <InputField field={() => field} type="number" />);
    const input = screen.getByRole("spinbutton");

    fireEvent.input(input, { target: { value: "" } });
    fireEvent.blur(input);

    // Set to 6
    fireEvent.input(input, { target: { value: "6" } });
    expect(field.handleChange).toHaveBeenCalledWith(6);
  });

  it("keeps empty string for string values", async () => {
    const field = makeField("age", "test");
    render(() => <InputField field={() => field} />);
    const input = screen.getByRole("textbox");

    fireEvent.input(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(field.handleChange).toHaveBeenCalledWith("");
  });
});
