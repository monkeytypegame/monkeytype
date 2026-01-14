import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import { Button } from "../../src/ts/components/common/Button";

describe("Button component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a button element when onClick is provided", () => {
    const onClick = vi.fn();

    const { container } = render(() => (
      <Button onClick={onClick} text="Click me" />
    ));

    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Click me");
  });

  it("renders an anchor element when href is provided", () => {
    const { container } = render(() => (
      <Button href="https://example.com" text="Go" />
    ));

    const anchor = container.querySelector("a");
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute("href")).toBe("https://example.com");
    expect(anchor?.getAttribute("target")).toBe("_blank");
    expect(anchor?.getAttribute("rel")).toContain("noreferrer");
  });

  it("calls onClick when button is clicked", async () => {
    const onClick = vi.fn();

    const { container } = render(() => (
      <Button onClick={onClick} text="Click me" />
    ));

    const button = container.querySelector("button");
    button?.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders icon when icon prop is provided", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        icon="fa-test"
      />
    ));

    const icon = container.querySelector("i");
    expect(icon).toBeTruthy();
    expect(icon?.className).toContain("icon");
    expect(icon?.className).toContain("fa-test");
  });

  it("applies fa-fw class when text is missing", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        icon="fa-test"
      />
    ));

    const icon = container.querySelector("i");
    expect(icon?.classList.contains("fa-fw")).toBe(true);
  });

  it("applies fa-fw class when fixedWidthIcon is true", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        icon="fa-test"
        text="Hello"
        fixedWidthIcon
      />
    ));

    const icon = container.querySelector("i");
    expect(icon?.classList.contains("fa-fw")).toBe(true);
  });

  it("does not apply fa-fw when text is present and fixedWidthIcon is false", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        icon="fa-test"
        text="Hello"
      />
    ));

    const icon = container.querySelector("i");
    expect(icon?.classList.contains("fa-fw")).toBe(false);
  });

  it("applies default button class", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        text="Hello"
      />
    ));

    const button = container.querySelector("button");
    expect(button?.classList.contains("button")).toBe(false);
  });

  it("applies textButton class when type is text", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        text="Hello"
        type="text"
      />
    ));

    const button = container.querySelector("button");
    expect(button?.classList.contains("textButton")).toBe(true);
  });

  it("applies custom class when class prop is provided", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
        text="Hello"
        class="custom-class"
      />
    ));

    const button = container.querySelector("button");
    expect(button?.classList.contains("custom-class")).toBe(true);
  });

  it("renders children content", () => {
    const { container } = render(() => (
      <Button
        onClick={() => {
          //
        }}
      >
        <span data-testid="child">Child</span>
      </Button>
    ));

    const child = container.querySelector('[data-testid="child"]');
    expect(child).toBeTruthy();
    expect(child?.textContent).toBe("Child");
  });
});
