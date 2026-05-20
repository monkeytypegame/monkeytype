import { render, screen, fireEvent } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";

import { Checkbox } from "../../../../src/ts/components/ui/form/Checkbox";

function makeField(name: string, checked = false) {
  return {
    name,
    state: { value: checked },
    handleBlur: vi.fn(),
    handleChange: vi.fn(),
  } as any;
}

describe("Checkbox", () => {
  it("renders with label text", () => {
    const field = makeField("agree");
    render(() => <Checkbox field={() => field} label="I agree" />);

    expect(screen.getByText("I agree")).toBeInTheDocument();
  });

  it("renders checkbox with field name", () => {
    const field = makeField("terms");
    render(() => <Checkbox field={() => field} />);

    const input = screen.getByRole("checkbox", { hidden: true });
    expect(input).toHaveAttribute("id", "terms");
    expect(input).toHaveAttribute("name", "terms");
  });

  it("reflects checked state", () => {
    const field = makeField("opt", true);
    render(() => <Checkbox field={() => field} />);

    const input = screen.getByRole("checkbox", { hidden: true });
    expect(input).toBeChecked();
  });

  it("reflects unchecked state", () => {
    const field = makeField("opt", false);
    render(() => <Checkbox field={() => field} />);

    const input = screen.getByRole("checkbox", { hidden: true });
    expect(input).not.toBeChecked();
  });

  it("calls handleChange on change", async () => {
    const field = makeField("opt");
    render(() => <Checkbox field={() => field} />);

    const input = screen.getByRole("checkbox", { hidden: true });
    await fireEvent.change(input, { target: { checked: true } });
    expect(field.handleChange).toHaveBeenCalledWith(true);
  });

  it("calls handleBlur on blur", async () => {
    const field = makeField("opt");
    render(() => <Checkbox field={() => field} />);

    const input = screen.getByRole("checkbox", { hidden: true });
    await fireEvent.blur(input);
    expect(field.handleBlur).toHaveBeenCalled();
  });

  it("renders disabled checkbox", () => {
    const field = makeField("opt");
    render(() => <Checkbox field={() => field} disabled />);

    const input = screen.getByRole("checkbox", { hidden: true });
    expect(input).toBeDisabled();
  });

  it("shows check icon styling when checked", () => {
    const field = makeField("opt", true);
    const { container } = render(() => <Checkbox field={() => field} />);

    const icon = container.querySelector(".fa-check");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-main");
  });

  it("shows transparent icon styling when unchecked", () => {
    const field = makeField("opt", false);
    const { container } = render(() => <Checkbox field={() => field} />);

    const icon = container.querySelector(".fa-check");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-transparent");
  });
});
