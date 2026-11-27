import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, JSXElement, Show } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { AnimePresence } from "../../../../src/ts/components/common/anime/AnimePresence";
import {
  Child,
  childrenInDom,
  finish,
  nextFrame,
  resetAnimations,
  running,
  settle,
} from "../../../__harness__/mock-anime";

/** One keyed child at a time, fading out then in. */
function renderSwitcher(
  initial: string,
  content: (key: string) => JSXElement = (key) => key,
): (key: string) => void {
  const [key, setKey] = createSignal(initial);
  render(() => (
    <AnimePresence exitBeforeEnter>
      <Show when={key()} keyed>
        {(current) => <Child name={current}>{content(current)}</Child>}
      </Show>
    </AnimePresence>
  ));
  return setKey;
}

describe("AnimePresence (exitBeforeEnter)", () => {
  afterEach(() => {
    cleanup();
    resetAnimations();
  });

  it("fades the old child out before the new one is in the DOM", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    expect(childrenInDom()).toEqual(["a"]);
    expect(finish()).toBe(0);

    expect(childrenInDom()).toEqual(["b"]);
    await nextFrame();
    expect(finish()).toBe(1);
    expect(running).toHaveLength(0);
  });

  it("holds the new child at its initial state until its fade in finishes", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    finish();

    const child = screen.getByTestId("child");
    expect(child.style.opacity).toBe("0");
    await nextFrame();
    expect(child.style.opacity).toBe("0");
    finish();
    expect(child.style.opacity).toBe("1");
  });

  it("ends on the last child after switching during the fade out", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    show("c");
    show("d");
    await settle();

    expect(childrenInDom()).toEqual(["d"]);
    expect(screen.getByTestId("child").style.opacity).toBe("1");
  });

  it("ends on the last child after switching during the fade in", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    finish();
    await nextFrame();
    expect(running.map((animation) => animation.opacity)).toEqual([1]);

    show("c");
    await settle();
    expect(childrenInDom()).toEqual(["c"]);
    expect(screen.getByTestId("child").style.opacity).toBe("1");
  });

  it("ends on the last child when switching before the fade in starts", async () => {
    const show = renderSwitcher("a");
    await settle();

    show("b");
    await nextFrame();
    finish();
    // the fade in starts on the next frame - switch before it
    show("c");
    await settle();

    expect(childrenInDom()).toEqual(["c"]);
    expect(screen.getByTestId("child").style.opacity).toBe("1");
  });
});
