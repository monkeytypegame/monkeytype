import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAnimate } = vi.hoisted(() => ({
  mockAnimate: vi.fn().mockImplementation(() => {
    const callbacks: Array<() => void> = [];
    const animation = {
      pause: vi.fn(),
      then: vi.fn(async (cb: () => void) => {
        callbacks.push(cb);
        // Invoke immediately so exit animations complete synchronously in tests
        cb();
        return Promise.resolve();
      }),
    };
    return animation;
  }),
}));

vi.mock("animejs", () => ({
  animate: mockAnimate,
}));

vi.mock("../../../../src/ts/utils/misc", () => ({
  applyReducedMotion: vi.fn((duration: number) => duration),
}));

import { AnimeShow } from "../../../../src/ts/components/common/anime/AnimeShow";

describe("AnimeShow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders children when `when` is true", () => {
    render(() => (
      <AnimeShow when={true}>
        <div data-testid="content">hello</div>
      </AnimeShow>
    ));
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("does not render children when `when` is false", () => {
    render(() => (
      <AnimeShow when={false}>
        <div data-testid="content">hello</div>
      </AnimeShow>
    ));
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("shows and hides reactively", () => {
    const [visible, setVisible] = createSignal(true);

    render(() => (
      <AnimeShow when={visible()}>
        <div data-testid="content">hello</div>
      </AnimeShow>
    ));

    expect(screen.getByTestId("content")).toBeInTheDocument();
    setVisible(false);
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    setVisible(true);
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("applies class to the wrapper element when visible", () => {
    const { container } = render(() => (
      <AnimeShow when={true} class="my-class">
        <span>content</span>
      </AnimeShow>
    ));
    expect(container.querySelector(".my-class")).toBeTruthy();
  });

  it("does not throw on mount/unmount", () => {
    const [show, setShow] = createSignal(true);

    expect(() => {
      render(() => (
        <AnimeShow when={show()}>
          <div>content</div>
        </AnimeShow>
      ));
    }).not.toThrow();

    expect(() => setShow(false)).not.toThrow();
  });

  describe("slide mode", () => {
    it("renders children when `when` is true in slide mode", () => {
      render(() => (
        <AnimeShow when={true} slide>
          <div data-testid="slide-content">slide</div>
        </AnimeShow>
      ));
      expect(screen.getByTestId("slide-content")).toBeInTheDocument();
    });

    it("does not render children when `when` is false in slide mode", () => {
      render(() => (
        <AnimeShow when={false} slide>
          <div data-testid="slide-content">slide</div>
        </AnimeShow>
      ));
      expect(screen.queryByTestId("slide-content")).not.toBeInTheDocument();
    });

    it("animates height on mount in slide mode", () => {
      render(() => (
        <AnimeShow when={true} slide>
          <div>content</div>
        </AnimeShow>
      ));

      const heightCalls = mockAnimate.mock.calls.filter(
        ([, params]) => params.height !== undefined,
      );
      expect(heightCalls.length).toBeGreaterThan(0);
    });
  });

  describe("animateOnMount prop", () => {
    const opacityCalls = (): unknown[] =>
      mockAnimate.mock.calls.filter(
        ([, params]) => params.opacity !== undefined,
      );
    const heightCalls = (): unknown[] =>
      mockAnimate.mock.calls.filter(
        ([, params]) => params.height !== undefined,
      );

    it("animates opacity on mount by default", () => {
      render(() => (
        <AnimeShow when={true}>
          <div>content</div>
        </AnimeShow>
      ));
      expect(opacityCalls().length).toBeGreaterThan(0);
    });

    it("does not animate opacity on mount when false", () => {
      render(() => (
        <AnimeShow when={true} animateOnMount={false}>
          <div data-testid="content">content</div>
        </AnimeShow>
      ));
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(opacityCalls()).toHaveLength(0);
    });

    it("does not animate height on mount when false in slide mode", () => {
      render(() => (
        <AnimeShow when={true} slide animateOnMount={false}>
          <div data-testid="content">content</div>
        </AnimeShow>
      ));
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(heightCalls()).toHaveLength(0);
    });

    it("still animates opacity when shown after mount", () => {
      const [when, setWhen] = createSignal(false);
      render(() => (
        <AnimeShow when={when()} animateOnMount={false}>
          <div>content</div>
        </AnimeShow>
      ));

      setWhen(true);
      expect(opacityCalls().length).toBeGreaterThan(0);
    });

    it("still animates height when shown after mount in slide mode", () => {
      const [when, setWhen] = createSignal(false);
      render(() => (
        <AnimeShow when={when()} slide animateOnMount={false}>
          <div>content</div>
        </AnimeShow>
      ));

      setWhen(true);
      expect(heightCalls().length).toBeGreaterThan(0);
    });
  });

  describe("duration prop", () => {
    it("uses the provided duration", () => {
      render(() => (
        <AnimeShow when={true} duration={400}>
          <div>content</div>
        </AnimeShow>
      ));

      const durationCalls = mockAnimate.mock.calls.filter(
        ([, params]) => params.duration === 400,
      );
      expect(durationCalls.length).toBeGreaterThan(0);
    });

    it("defaults to 125ms when no duration is provided", () => {
      render(() => (
        <AnimeShow when={true}>
          <div>content</div>
        </AnimeShow>
      ));

      const defaultDurationCalls = mockAnimate.mock.calls.filter(
        ([, params]) => params.duration === 125,
      );
      expect(defaultDurationCalls.length).toBeGreaterThan(0);
    });
  });
});
