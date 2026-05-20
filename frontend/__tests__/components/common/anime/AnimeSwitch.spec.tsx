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

import { AnimeMatch } from "../../../../src/ts/components/common/anime/AnimeMatch";
import { AnimeSwitch } from "../../../../src/ts/components/common/anime/AnimeSwitch";

describe("AnimeSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the matched child", () => {
    render(() => (
      <AnimeSwitch>
        <AnimeMatch when={true}>
          <div data-testid="match-a">A</div>
        </AnimeMatch>
        <AnimeMatch when={false}>
          <div data-testid="match-b">B</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));

    expect(screen.getByTestId("match-a")).toBeInTheDocument();
    expect(screen.queryByTestId("match-b")).not.toBeInTheDocument();
  });

  it("switches to the next matched child reactively", () => {
    const [tab, setTab] = createSignal<"a" | "b">("a");

    render(() => (
      <AnimeSwitch>
        <AnimeMatch when={tab() === "a"}>
          <div data-testid="view-a">View A</div>
        </AnimeMatch>
        <AnimeMatch when={tab() === "b"}>
          <div data-testid="view-b">View B</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));

    expect(screen.getByTestId("view-a")).toBeInTheDocument();
    expect(screen.queryByTestId("view-b")).not.toBeInTheDocument();

    setTab("b");

    expect(screen.queryByTestId("view-a")).not.toBeInTheDocument();
    expect(screen.getByTestId("view-b")).toBeInTheDocument();
  });

  it("renders nothing when no match", () => {
    const { container } = render(() => (
      <AnimeSwitch>
        <AnimeMatch when={false}>
          <div data-testid="no-match">never</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));

    expect(screen.queryByTestId("no-match")).not.toBeInTheDocument();
    // Only AnimePresence wrapper remains
    expect(container.querySelectorAll("[data-testid]").length).toBe(0);
  });

  it("does not throw when switching between children", () => {
    const [view, setView] = createSignal<"a" | "b">("a");

    expect(() => {
      render(() => (
        <AnimeSwitch exitBeforeEnter>
          <AnimeMatch when={view() === "a"}>
            <div>View A</div>
          </AnimeMatch>
          <AnimeMatch when={view() === "b"}>
            <div>View B</div>
          </AnimeMatch>
        </AnimeSwitch>
      ));
    }).not.toThrow();

    expect(() => setView("b")).not.toThrow();
  });

  it("passes animeProps down to all AnimeMatch children", () => {
    render(() => (
      <AnimeSwitch
        animeProps={{
          initial: { opacity: 0 },
          animate: { opacity: 1, duration: 300 },
          exit: { opacity: 0, duration: 300 },
        }}
      >
        <AnimeMatch when={true}>
          <div>content</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));

    // Expect animate call with the shared animeProps
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 1, duration: 300 }),
    );
  });
});

describe("AnimeMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders children when `when` is true", () => {
    render(() => (
      <AnimeSwitch>
        <AnimeMatch when={true}>
          <div data-testid="match-content">match</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));
    expect(screen.getByTestId("match-content")).toBeInTheDocument();
  });

  it("does not render children when `when` is false", () => {
    render(() => (
      <AnimeSwitch>
        <AnimeMatch when={false}>
          <div data-testid="hidden">hidden</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));
    expect(screen.queryByTestId("hidden")).not.toBeInTheDocument();
  });

  it("per-match animate overrides the shared animeProps", () => {
    render(() => (
      <AnimeSwitch
        animeProps={{
          animate: { opacity: 1, duration: 200 },
        }}
      >
        <AnimeMatch when={true} animate={{ opacity: 1, duration: 500 }}>
          <div>override</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));

    // The per-match duration (500) should be used, not the shared one (200)
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 1, duration: 500 }),
    );
    const callsWithSharedDuration = mockAnimate.mock.calls.filter(
      ([, params]) => params.duration === 200,
    );
    expect(callsWithSharedDuration.length).toBe(0);
  });

  it("falls back to context animeProps when no per-match props provided", () => {
    render(() => (
      <AnimeSwitch
        animeProps={{
          initial: { opacity: 0 },
          animate: { opacity: 1, duration: 250 },
        }}
      >
        <AnimeMatch when={true}>
          <div>content</div>
        </AnimeMatch>
      </AnimeSwitch>
    ));

    // Should use context duration 250
    expect(mockAnimate).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: 1, duration: 250 }),
    );
  });
});
