import { render, screen } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";

import { LabeledField } from "../../../../src/ts/components/ui/form/LabeledField";

describe("LabeledField", () => {
  it("renders label text correctly", () => {
    render(() => (
      <LabeledField label="test label">
        <input />
      </LabeledField>
    ));

    expect(screen.getByText("test label")).toBeInTheDocument();
  });

  it("renders children correctly", () => {
    render(() => (
      <LabeledField label="test">
        <div data-testid="child">child content</div>
      </LabeledField>
    ));

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders subtext when provided", () => {
    render(() => (
      <LabeledField label="test" sub="helper text">
        <input />
      </LabeledField>
    ));

    expect(screen.getByText("helper text")).toBeInTheDocument();
  });

  it("links label to input when id is provided", () => {
    const { container } = render(() => (
      <LabeledField label="test" id="test-id">
        <input id="test-id" />
      </LabeledField>
    ));

    const label = container.querySelector("label");
    expect(label).toHaveAttribute("for", "test-id");
  });

  it("applies custom class to wrapper", () => {
    const { container } = render(() => (
      <LabeledField label="test" class="custom-wrapper-class">
        <input />
      </LabeledField>
    ));

    expect(container.firstChild).toHaveClass("custom-wrapper-class");
  });
});
