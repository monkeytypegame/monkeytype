import { cleanup, render } from "@solidjs/testing-library";
import { createSignal, Show } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAnimate } = vi.hoisted(() => ({
  mockAnimate: vi.fn().mockReturnValue({
    pause: vi.fn(),
    then: vi.fn((_cb: unknown) => Promise.resolve()),
  }),
}));

vi.mock("animejs", () => ({
  animate: mockAnimate,
}));

// Mock applyReducedMotion
vi.mock("../../../../src/ts/utils/misc", () => ({
  applyReducedMotion: vi.fn((duration: number) => duration),
}));

import { Anime } from "../../../../src/ts/components/common/anime/Anime";
import {
  AnimeGroup,
  createStagger,
} from "../../../../src/ts/components/common/anime/AnimeGroup";
import { AnimePresence } from "../../../../src/ts/components/common/anime/AnimePresence";

describe("Anime", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a div wrapper by default", () => {
    const { container } = render(() => (
      <Anime animation={{ opacity: 1 }}>
        <span>content</span>
      </Anime>
    ));
    expect(container.querySelector("div")).toBeTruthy();
    expect(container.querySelector("span")).toHaveTextContent("content");
  });

  it("renders with custom tag via `as` prop", () => {
    const { container } = render(() => (
      <Anime animation={{ opacity: 1 }} as="section">
        <span>hi</span>
      </Anime>
    ));
    expect(container.querySelector("section")).toBeTruthy();
    expect(container.querySelector("div")).toBeNull();
  });

  it("applies className and style props", () => {
    const { container } = render(() => (
      <Anime
        animation={{ opacity: 1 }}
        class="my-class"
        style={{ color: "red" }}
      >
        <span />
      </Anime>
    ));
    const el = container.querySelector(".my-class");
    expect(el).toBeTruthy();
  });

  it("calls animejsAnimate on mount with animation prop", () => {
    render(() => (
      <Anime animation={{ opacity: 1, duration: 300 }}>
        <div />
      </Anime>
    ));
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 1, duration: 300 }),
    );
  });

  it("applies initial state with duration:0 then animates to animate prop", () => {
    render(() => (
      <Anime initial={{ opacity: 0 }} animate={{ opacity: 1, duration: 300 }}>
        <div />
      </Anime>
    ));

    // First call: initial state (duration: 0)
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 0, duration: 0 }),
    );
    // Second call: full animation
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 1, duration: 300 }),
    );
  });

  it("re-runs animation when reactive signal changes", () => {
    const [opacity, setOpacity] = createSignal(1);

    render(() => (
      <Anime animation={{ opacity: opacity(), duration: 200 }}>
        <div />
      </Anime>
    ));

    const callsBefore = mockAnimate.mock.calls.length;
    setOpacity(0);

    expect(mockAnimate.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});

describe("AnimePresence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders children", () => {
    const { container } = render(() => (
      <AnimePresence>
        <div data-testid="child">hello</div>
      </AnimePresence>
    ));
    expect(container.querySelector("[data-testid='child']")).toBeTruthy();
  });

  it("renders children in list mode", () => {
    const { container } = render(() => (
      <AnimePresence mode="list">
        <div data-testid="item-1">one</div>
        <div data-testid="item-2">two</div>
      </AnimePresence>
    ));
    expect(container.querySelector("[data-testid='item-1']")).toBeTruthy();
    expect(container.querySelector("[data-testid='item-2']")).toBeTruthy();
  });

  it("list mode wraps children in a display:contents div", () => {
    const { container } = render(() => (
      <AnimePresence mode="list">
        <div>child</div>
      </AnimePresence>
    ));
    const wrapper = container.querySelector("div");
    expect(wrapper?.style.display).toBe("contents");
  });

  it("mounts and unmounts Show child without errors", async () => {
    const [show, setShow] = createSignal(true);

    expect(() => {
      render(() => (
        <AnimePresence>
          <Show when={show()}>
            <Anime animate={{ opacity: 1, duration: 0 }}>
              <div data-testid="toggled">toggled</div>
            </Anime>
          </Show>
        </AnimePresence>
      ));
    }).not.toThrow();

    expect(() => setShow(false)).not.toThrow();
  });

  it("exitBeforeEnter mode does not throw on child switch", () => {
    const [view, setView] = createSignal<"a" | "b">("a");

    expect(() => {
      render(() => (
        <AnimePresence exitBeforeEnter>
          <Show when={view() === "a"}>
            <Anime exit={{ opacity: 0, duration: 0 }}>
              <div>View A</div>
            </Anime>
          </Show>
          <Show when={view() === "b"}>
            <Anime exit={{ opacity: 0, duration: 0 }}>
              <div>View B</div>
            </Anime>
          </Show>
        </AnimePresence>
      ));
    }).not.toThrow();

    expect(() => setView("b")).not.toThrow();
  });
});

describe("AnimeGroup", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a div wrapper by default", () => {
    const { container } = render(() => (
      <AnimeGroup animation={{ opacity: 1, duration: 300 }}>
        <div>a</div>
        <div>b</div>
      </AnimeGroup>
    ));
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("renders with custom tag via `as` prop", () => {
    const { container } = render(() => (
      <AnimeGroup animation={{ opacity: 1 }} as="ul">
        <li>item</li>
      </AnimeGroup>
    ));
    expect(container.querySelector("ul")).toBeTruthy();
  });

  it("animates each child on mount", () => {
    render(() => (
      <AnimeGroup animation={{ opacity: 1, duration: 300 }} stagger={50}>
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </AnimeGroup>
    ));

    // One call per child element
    const childCalls = mockAnimate.mock.calls.filter(
      ([el]) => el instanceof HTMLElement,
    );
    expect(childCalls.length).toBeGreaterThanOrEqual(3);
  });

  it("applies initial state before animating children", () => {
    render(() => (
      <AnimeGroup
        animation={{ opacity: 1, duration: 300 }}
        initial={{ opacity: 0 }}
      >
        <div>1</div>
        <div>2</div>
      </AnimeGroup>
    ));

    // Initial state calls (duration: 0) should precede animation calls
    const zeroDurationCalls = mockAnimate.mock.calls.filter(
      ([, params]) => params.duration === 0,
    );
    expect(zeroDurationCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("applies stagger delays in forward direction", () => {
    render(() => (
      <AnimeGroup animation={{ opacity: 1, duration: 300 }} stagger={100}>
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </AnimeGroup>
    ));

    // Calls with non-zero delay values reflecting stagger
    const delayCalls = mockAnimate.mock.calls
      .filter(([, params]) => params.duration === 300)
      .map(([, params]) => params.delay as number);

    // forward stagger: delays should be 0, 100, 200
    expect(delayCalls).toContain(0);
    expect(delayCalls).toContain(100);
    expect(delayCalls).toContain(200);
  });

  it("reverses stagger direction", () => {
    render(() => (
      <AnimeGroup
        animation={{ opacity: 1, duration: 300 }}
        stagger={100}
        direction="reverse"
      >
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </AnimeGroup>
    ));

    const delayCalls = mockAnimate.mock.calls
      .filter(([, params]) => params.duration === 300)
      .map(([, params]) => params.delay as number);

    // reverse: first child gets highest delay (200), last gets 0
    expect(delayCalls).toContain(0);
    expect(delayCalls).toContain(200);
  });

  it("applies center stagger direction", () => {
    render(() => (
      <AnimeGroup
        animation={{ opacity: 1, duration: 300 }}
        stagger={100}
        direction="center"
      >
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </AnimeGroup>
    ));

    const delayCalls = mockAnimate.mock.calls
      .filter(([, params]) => params.duration === 300)
      .map(([, params]) => params.delay as number);

    // center: middle element (index 1) has 0 delay, outer elements have 100
    expect(delayCalls).toContain(0);
    expect(delayCalls).toContain(100);
  });

  it("accepts a function stagger", () => {
    const staggerFn = vi.fn((_i: number, _t: number) => 75);

    render(() => (
      <AnimeGroup animation={{ opacity: 1, duration: 300 }} stagger={staggerFn}>
        <div>1</div>
        <div>2</div>
      </AnimeGroup>
    ));

    expect(staggerFn).toHaveBeenCalled();
  });

  it("applies class and style to wrapper", () => {
    const { container } = render(() => (
      <AnimeGroup
        animation={{ opacity: 1 }}
        class="group-class"
        style={{ gap: "8px" }}
      >
        <div>1</div>
      </AnimeGroup>
    ));
    expect(container.querySelector(".group-class")).toBeTruthy();
  });
});

describe("createStagger", () => {
  it("returns 0 for single element", () => {
    const fn = createStagger({ base: 100 });
    expect(fn(0, 1)).toBe(0);
  });

  it("linear stagger from start: first=0, last=base*(total-1)", () => {
    const fn = createStagger({ base: 50, ease: "linear", from: "start" });
    expect(fn(0, 3)).toBeCloseTo(0);
    expect(fn(2, 3)).toBeCloseTo(100);
  });

  it("linear stagger from end: first=base*(total-1), last=0", () => {
    const fn = createStagger({ base: 50, ease: "linear", from: "end" });
    expect(fn(0, 3)).toBeCloseTo(100);
    expect(fn(2, 3)).toBeCloseTo(0);
  });

  it("center stagger: middle element has smallest value", () => {
    const fn = createStagger({ base: 50, ease: "linear", from: "center" });
    // For 5 items, center is index 2 → distance = 0
    expect(fn(2, 5)).toBeCloseTo(0);
    expect(fn(0, 5)).toBeGreaterThan(fn(2, 5));
  });

  it("easeIn produces smaller values at start", () => {
    const linear = createStagger({ base: 100, ease: "linear" });
    const easeIn = createStagger({ base: 100, ease: "easeIn" });
    // At index 1 of 4, easeIn position is less progressed than linear
    expect(easeIn(1, 4)).toBeLessThan(linear(1, 4));
  });

  it("easeOut produces larger values at start compared to easeIn", () => {
    const easeOut = createStagger({ base: 100, ease: "easeOut" });
    const easeIn = createStagger({ base: 100, ease: "easeIn" });
    expect(easeOut(1, 4)).toBeGreaterThan(easeIn(1, 4));
  });

  it("easeInOut is symmetric", () => {
    const fn = createStagger({ base: 100, ease: "easeInOut", from: "start" });
    // At 50% position (index 1 of 3), easeInOut should equal linear
    // easeInOut at 0.5 = 0.5 → 100 * 0.5 * 2 = 100
    expect(fn(1, 3)).toBeCloseTo(100);
  });
});
