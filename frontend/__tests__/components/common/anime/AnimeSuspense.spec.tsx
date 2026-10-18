import { cleanup, render, screen } from "@solidjs/testing-library";
import { createResource, JSXElement } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAnimate } = vi.hoisted(() => ({
  mockAnimate: vi.fn().mockImplementation(() => ({
    pause: vi.fn(),
    // exit animations complete at once
    then: vi.fn(async (cb: () => void) => {
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

import { AnimeSuspense } from "../../../../src/ts/components/common/anime/AnimeSuspense";

// Anime starts its enter animation on the next frame
async function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Content reading a resource that resolves when `resolve` is called. */
function createSuspending(): {
  Content: () => JSXElement;
  resolve: () => Promise<void>;
} {
  let resolvePromise: (value: string) => void = () => undefined;
  const promise = new Promise<string>((r) => (resolvePromise = r));
  return {
    Content: () => {
      const [data] = createResource(async () => promise);
      return <div data-testid="content">{data()}</div>;
    },
    resolve: async () => {
      resolvePromise("loaded");
      await promise;
      await Promise.resolve();
    },
  };
}

function fadeInCalls(): unknown[] {
  return mockAnimate.mock.calls.filter(
    ([, params]) => params.opacity === 1 && params.duration !== 0,
  );
}

describe("AnimeSuspense", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the content when nothing suspends", () => {
    render(() => (
      <AnimeSuspense fallback={<div data-testid="fallback" />}>
        <div data-testid="content">hello</div>
      </AnimeSuspense>
    ));
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });

  it("shows the fallback while suspended, then the content", async () => {
    const { Content, resolve } = createSuspending();
    render(() => (
      <AnimeSuspense fallback={<div data-testid="fallback" />}>
        <Content />
      </AnimeSuspense>
    ));
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();

    await resolve();
    await nextFrame();
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
    expect(screen.getByTestId("content")).toHaveTextContent("loaded");
  });

  it("fades the fallback out before fading the content in", async () => {
    const { Content, resolve } = createSuspending();
    render(() => (
      <AnimeSuspense fallback={<div data-testid="fallback" />} duration={200}>
        <Content />
      </AnimeSuspense>
    ));
    await nextFrame();
    vi.clearAllMocks();

    await resolve();
    await nextFrame();
    const calls = mockAnimate.mock.calls.map(
      ([, params]) => params as { opacity?: number; duration?: number },
    );
    const exitIndex = calls.findIndex(
      (params) => params.opacity === 0 && params.duration === 200,
    );
    const enterIndex = calls.findIndex(
      (params) => params.opacity === 1 && params.duration === 200,
    );
    expect(exitIndex).not.toBe(-1);
    expect(enterIndex).toBeGreaterThan(exitIndex);
  });

  it("fades in content that suspended, even with animateOnMount off", async () => {
    const { Content, resolve } = createSuspending();
    render(() => (
      <AnimeSuspense
        fallback={<div data-testid="fallback" />}
        animateOnMount={false}
      >
        <Content />
      </AnimeSuspense>
    ));
    await nextFrame();
    // the fallback shown on mount doesn't fade in
    expect(fadeInCalls()).toHaveLength(0);

    await resolve();
    await nextFrame();
    expect(fadeInCalls()).toHaveLength(1);
  });

  it("fades the content back in after it suspends again (refetch)", async () => {
    let resolveFetch: (value: string) => void = () => undefined;
    let refetch: () => void = () => undefined;
    const fetch = async (): Promise<string> =>
      new Promise<string>((r) => (resolveFetch = r));
    const Content = (): JSXElement => {
      const [data, actions] = createResource(fetch);
      refetch = () => void actions.refetch();
      return <div data-testid="content">{data()}</div>;
    };
    const settle = async (): Promise<void> => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
      await nextFrame();
    };

    render(() => (
      <AnimeSuspense fallback={<div data-testid="fallback" />} duration={200}>
        <Content />
      </AnimeSuspense>
    ));
    resolveFetch("first");
    await settle();
    expect(screen.getByTestId("content")).toHaveTextContent("first");

    refetch();
    await settle();
    expect(screen.getByTestId("fallback")).toBeInTheDocument();

    vi.clearAllMocks();
    resolveFetch("second");
    await settle();
    const content = screen.getByTestId("content");
    expect(content).toHaveTextContent("second");
    // the same element is back: it fades in again
    expect(mockAnimate).toHaveBeenCalledWith(
      content.parentElement,
      expect.objectContaining({ opacity: 1, duration: 200 }),
    );
  });

  it("doesn't fade in content shown on mount with animateOnMount off", async () => {
    render(() => (
      <AnimeSuspense animateOnMount={false}>
        <div data-testid="content">hello</div>
      </AnimeSuspense>
    ));
    await nextFrame();
    expect(fadeInCalls()).toHaveLength(0);
  });
});
