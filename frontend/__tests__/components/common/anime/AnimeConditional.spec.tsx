import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAnimate } = vi.hoisted(() => ({
  mockAnimate: vi.fn().mockImplementation(() => ({
    pause: vi.fn(),
    then: vi.fn((cb: () => void) => {
      cb();
      return Promise.resolve();
    }),
  })),
}));

vi.mock("animejs", () => ({
  animate: mockAnimate,
}));

vi.mock("../../../../src/ts/utils/misc", () => ({
  applyReducedMotion: vi.fn((duration: number) => duration),
}));

import { AnimeConditional } from "../../../../src/ts/components/common/anime/AnimeConditional";

describe("AnimeConditional", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders `then` content when `if` is truthy", () => {
    render(() => (
      <AnimeConditional
        if={true}
        then={<div data-testid="then-content">then</div>}
        else={<div data-testid="else-content">else</div>}
      />
    ));

    expect(screen.getByTestId("then-content")).toBeInTheDocument();
    expect(screen.queryByTestId("else-content")).not.toBeInTheDocument();
  });

  it("renders `else` content when `if` is falsy", () => {
    render(() => (
      <AnimeConditional
        if={false}
        then={<div data-testid="then-content">then</div>}
        else={<div data-testid="else-content">else</div>}
      />
    ));

    expect(screen.queryByTestId("then-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("else-content")).toBeInTheDocument();
  });

  it("renders `else` content when `if` is null", () => {
    render(() => (
      <AnimeConditional
        if={null}
        then={<div data-testid="then-content">then</div>}
        else={<div data-testid="else-content">else</div>}
      />
    ));

    expect(screen.queryByTestId("then-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("else-content")).toBeInTheDocument();
  });

  it("switches reactively from `then` to `else`", () => {
    const [condition, setCondition] = createSignal<boolean>(true);

    render(() => (
      <AnimeConditional
        if={condition()}
        then={<div data-testid="then-content">then</div>}
        else={<div data-testid="else-content">else</div>}
      />
    ));

    expect(screen.getByTestId("then-content")).toBeInTheDocument();

    setCondition(false);

    expect(screen.queryByTestId("then-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("else-content")).toBeInTheDocument();
  });

  it("switches reactively from `else` to `then`", () => {
    const [condition, setCondition] = createSignal<boolean>(false);

    render(() => (
      <AnimeConditional
        if={condition()}
        then={<div data-testid="then-content">then</div>}
        else={<div data-testid="else-content">else</div>}
      />
    ));

    expect(screen.getByTestId("else-content")).toBeInTheDocument();

    setCondition(true);

    expect(screen.getByTestId("then-content")).toBeInTheDocument();
    expect(screen.queryByTestId("else-content")).not.toBeInTheDocument();
  });

  it("supports `then` as a function and passes the truthy value", () => {
    const obj = { label: "hello" };
    render(() => (
      <AnimeConditional
        if={obj}
        then={(value) => <div data-testid="fn-content">{value().label}</div>}
      />
    ));

    expect(screen.getByTestId("fn-content")).toHaveTextContent("hello");
  });

  it("does not throw without `else` prop", () => {
    expect(() => {
      render(() => (
        <AnimeConditional
          if={true}
          then={<div data-testid="then-content">then</div>}
        />
      ));
    }).not.toThrow();

    expect(screen.getByTestId("then-content")).toBeInTheDocument();
  });

  it("does not throw on mount/unmount", () => {
    const [show, setShow] = createSignal<boolean>(true);

    expect(() => {
      render(() => (
        <AnimeConditional
          if={show()}
          then={<div>then</div>}
          else={<div>else</div>}
        />
      ));
    }).not.toThrow();

    expect(() => setShow(false)).not.toThrow();
    expect(() => setShow(true)).not.toThrow();
  });

  describe("default animations (opacity fade)", () => {
    it("applies default opacity animate on `then` branch", () => {
      render(() => <AnimeConditional if={true} then={<div>then</div>} />);

      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ opacity: 1, duration: 125 }),
      );
    });

    it("applies default opacity initial state on `then` branch", () => {
      render(() => <AnimeConditional if={true} then={<div>then</div>} />);

      // Initial call: opacity:0 with duration:0
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ opacity: 0, duration: 0 }),
      );
    });
  });

  describe("custom animeProps", () => {
    it("uses custom animate params when animeProps provided", () => {
      render(() => (
        <AnimeConditional
          if={true}
          then={<div>then</div>}
          animeProps={{
            initial: { opacity: 0, translateY: -10 },
            animate: { opacity: 1, translateY: 0, duration: 400 },
            exit: { opacity: 0, translateY: -10, duration: 200 },
          }}
        />
      ));

      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ opacity: 1, translateY: 0, duration: 400 }),
      );
    });

    it("uses custom initial state when animeProps provided", () => {
      render(() => (
        <AnimeConditional
          if={true}
          then={<div>then</div>}
          animeProps={{
            initial: { opacity: 0, translateY: -10 },
            animate: { opacity: 1, translateY: 0, duration: 400 },
          }}
        />
      ));

      // Initial state applied with duration:0
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ opacity: 0, translateY: -10, duration: 0 }),
      );
    });
  });

  it("exitBeforeEnter prop does not throw on condition change", () => {
    const [cond, setCond] = createSignal(true);

    expect(() => {
      render(() => (
        <AnimeConditional
          exitBeforeEnter
          if={cond()}
          then={<div>then</div>}
          else={<div>else</div>}
        />
      ));
    }).not.toThrow();

    expect(() => setCond(false)).not.toThrow();
  });
});
