import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it } from "vitest";

import { LoadingPage } from "../../../src/ts/components/pages/LoadingPage";
import {
  resetLoadingPage,
  updateLoadingPageBar,
} from "../../../src/ts/states/loading-page";

/**
 * The fill is animated, so its width lands a frame or two after the step's
 * duration has elapsed. Poll rather than asserting on the next microtask.
 */
async function waitForFillWidth(
  container: HTMLElement,
  expected: string,
): Promise<string | undefined> {
  const deadline = performance.now() + 500;
  let width: string | undefined;
  do {
    width = container.querySelector<HTMLElement>(".bg-main")?.style.width;
    if (width === expected) break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  } while (performance.now() < deadline);
  return width;
}

describe("LoadingPage bar", () => {
  afterEach(() => {
    cleanup();
    resetLoadingPage();
  });

  it("resolves a zero duration step", async () => {
    render(() => <LoadingPage />);
    await expect(updateLoadingPageBar(0, 0)).resolves.toBeUndefined();
  });

  it("fills to the requested percentage", async () => {
    const { container } = render(() => <LoadingPage />);
    await updateLoadingPageBar(42, 50);
    await expect(waitForFillWidth(container, "42%")).resolves.toBe("42%");
  });

  it("lets the newest step win when one supersedes another", async () => {
    const { container } = render(() => <LoadingPage />);
    void updateLoadingPageBar(10, 500);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await updateLoadingPageBar(90, 20);
    await expect(waitForFillWidth(container, "90%")).resolves.toBe("90%");
  });

  // regression: a step used to await the component reporting its animation done,
  // so with nothing mounted to animate it, page loading hung forever
  it("resolves with nothing mounted to animate the fill", async () => {
    await expect(updateLoadingPageBar(10, 0)).resolves.toBeUndefined();
  });
});
