import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, JSXElement, onMount } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { AnimeSwap } from "../../../../src/ts/components/common/anime/AnimeSwap";
import { createNonRouterPage } from "../../../../src/ts/components/core/Page";
import {
  getVisiblePage,
  setVisiblePage,
} from "../../../../src/ts/states/router";
import {
  Child,
  childrenInDom,
  finish,
  log,
  nextFrame,
  resetAnimations,
  settle,
} from "../../../__harness__/mock-anime";

/** Like the page switcher: one keyed child at a time. */
function renderSwap(
  initial: string,
  content: (key: string) => JSXElement = (key) => key,
): (key: string) => void {
  const [key, setKey] = createSignal(initial);
  render(() => (
    <AnimeSwap key={key()}>
      {(current) => <Child name={current}>{content(current)}</Child>}
    </AnimeSwap>
  ));
  return setKey;
}

describe("AnimeSwap", () => {
  afterEach(() => {
    cleanup();
    resetAnimations();
    setVisiblePage("loading");
  });

  it("builds the new child once the old one is out of the DOM", async () => {
    const Content = (props: { name: string }): JSXElement => {
      let el: HTMLSpanElement | undefined;
      onMount(() =>
        log.push(`${props.name} mounted, attached: ${el?.isConnected}`),
      );
      return <span ref={(e) => (el = e)}>{props.name}</span>;
    };
    const show = renderSwap("a", (key) => <Content name={key} />);
    await settle();
    log.length = 0;

    show("b");
    await nextFrame();
    expect(childrenInDom()).toEqual(["a"]);
    // not built while the old one fades out
    expect(log).toEqual(["animate a to 0"]);
    expect(finish()).toBe(0);
    await settle();

    // a slow page render blocks the main thread: a fade started before it
    // would be over before the page is painted
    expect(log).toEqual([
      "animate a to 0",
      "b mounted, attached: true",
      "animate b to 1",
    ]);
    expect(childrenInDom()).toEqual(["b"]);
  });

  it("builds only the last key when it changes during an exit", async () => {
    const show = renderSwap("a", (key) => {
      log.push(`built ${key}`);
      return key;
    });
    await settle();
    log.length = 0;

    show("b");
    await nextFrame();
    show("c");
    await settle();

    expect(log).toEqual(["animate a to 0", "built c", "animate c to 1"]);
    expect(childrenInDom()).toEqual(["c"]);
  });

  it("builds the old key again when it comes back during an exit", async () => {
    const show = renderSwap("a", (key) => {
      log.push(`built ${key}`);
      return key;
    });
    await settle();
    log.length = 0;

    show("b");
    await nextFrame();
    show("a");
    await settle();

    expect(log).toEqual(["animate a to 0", "built a", "animate a to 1"]);
    expect(childrenInDom()).toEqual(["a"]);
  });

  it("replaces a child without an exit at once", async () => {
    const [key, setKey] = createSignal("a");
    render(() => (
      <AnimeSwap key={key()}>
        {(current) => <span data-testid="child">{current}</span>}
      </AnimeSwap>
    ));
    expect(childrenInDom()).toEqual(["a"]);

    setKey("b");

    expect(childrenInDom()).toEqual(["b"]);
  });

  it("makes a page the visible page once its wrapper is in the DOM", async () => {
    const SettingsPage = createNonRouterPage("settings", () => "content");
    const AboutPage = createNonRouterPage("about", () => "content");
    const show = renderSwap("a", (key) =>
      key === "b" ? <SettingsPage /> : <AboutPage />,
    );
    await settle();
    expect(getVisiblePage()).toBe("about");

    show("b");
    await nextFrame();
    // the old page is still fading out
    expect(getVisiblePage()).toBe("about");
    finish();
    await nextFrame();

    expect(screen.getByTestId("child").dataset["name"]).toBe("b");
    expect(getVisiblePage()).toBe("settings");
  });
});
