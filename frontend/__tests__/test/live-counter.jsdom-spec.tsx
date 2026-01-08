// __tests__/LiveCounter.test.tsx
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { LiveCounter } from "../../src/ts/test/live-counter";

afterEach(() => cleanup());

describe("LiveCounter", () => {
  it("renders initial value", () => {
    const [value] = createSignal(5);
    render(() => <LiveCounter value={value} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("updates reactively when signal changes", () => {
    const [value, setValue] = createSignal(1);
    render(() => <LiveCounter value={value} />);

    expect(screen.getByText("1")).toBeInTheDocument();

    setValue(42);
    expect(screen.getByText("42")).toBeInTheDocument();

    setValue(99);
    expect(screen.getByText("99")).toBeInTheDocument();
  });
});
