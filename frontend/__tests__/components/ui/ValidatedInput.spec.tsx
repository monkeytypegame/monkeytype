import { render, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ValidatedInput } from "../../../src/ts/components/ui/ValidatedInput";

vi.mock("../../../src/ts/config", () => ({}));

describe("ValidatedInput", () => {
  it("renders with valid initial value", async () => {
    const schema = z.string().min(4);
    const { container } = render(() => (
      <ValidatedInput class="test" value="Kevin" schema={schema} />
    ));

    await waitFor(() => container.querySelector(".inputAndIndicator") !== null);

    const wrapper = container.querySelector(".inputAndIndicator");
    const input = container.querySelector("input");
    console.log(container?.innerHTML);
    expect(wrapper).toHaveClass("inputAndIndicator");
    expect(wrapper).toHaveAttribute("data-indicator-status", "success");
    expect(input).toHaveValue("Kevin");

    const indicator = wrapper?.querySelector("div.indicator:not(.hidden)");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-option-id", "success");
    expect(indicator?.querySelector("i")).toHaveClass("fa-check");
  });

  it("renders with invalid initial value", async () => {
    const schema = z.string().min(4);
    const { container } = render(() => (
      <ValidatedInput class="test" value="Bob" schema={schema} />
    ));

    await waitFor(() => container.querySelector(".inputAndIndicator") !== null);

    const wrapper = container.querySelector(".inputAndIndicator");
    const input = container.querySelector("input");
    console.log(container?.innerHTML);
    expect(wrapper).toHaveClass("inputAndIndicator");
    expect(wrapper).toHaveAttribute("data-indicator-status", "failed");
    expect(input).toHaveValue("Bob");

    const indicator = wrapper?.querySelector("div.indicator:not(.hidden)");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-option-id", "failed");
    expect(indicator?.querySelector("i")).toHaveClass("fa-times");
  });

  it("updates callback", async () => {
    const [value, setValue] = createSignal("Bob");
    const schema = z.string().min(4);
    const { container } = render(() => (
      <ValidatedInput
        class="test"
        value={value()}
        onInput={setValue}
        schema={schema}
      />
    ));

    await waitFor(() => container.querySelector(".inputAndIndicator") !== null);
    console.log(container.innerHTML);
    const input = container.querySelector("input") as HTMLInputElement;
    expect(container.querySelector(".inputAndIndicator")).toHaveAttribute(
      "data-indicator-status",
      "failed",
    );

    await userEvent.type(input, "ington");

    expect(value()).toEqual("Bobington");
    expect(container.querySelector(".inputAndIndicator")).toHaveAttribute(
      "data-indicator-status",
      "success",
    );
  });
});
