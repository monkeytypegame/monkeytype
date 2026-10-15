import { createEffect, createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLoadingPageText,
  planLoadingBar,
  resetLoadingPage,
  runLoadingStep,
} from "../../src/ts/states/loading-page";

// every text value the loading page renders, in order
function recordTexts(): { texts: (string | null)[]; dispose: () => void } {
  const texts: (string | null)[] = [];
  const dispose = createRoot((dispose) => {
    createEffect(() => texts.push(getLoadingPageText()));
    return dispose;
  });
  return { texts, dispose };
}

describe("loading page", () => {
  afterEach(() => {
    resetLoadingPage();
    vi.useRealTimers();
  });

  it("never hides the text line between steps (the bar would jump)", async () => {
    vi.useFakeTimers();
    planLoadingBar(2);
    const { texts, dispose } = recordTexts();

    const first = runLoadingStep(
      {
        label: "first",
        keyframes: [{ percentage: 90, durationMs: 1000, text: "First..." }],
      },
      async () => undefined,
    );
    await vi.runAllTimersAsync();
    await first;

    const second = runLoadingStep(
      {
        label: "second",
        keyframes: [{ percentage: 90, durationMs: 1000, text: "Second..." }],
      },
      async () => undefined,
    );
    await vi.runAllTimersAsync();
    await second;
    dispose();

    // the boot state hides it, once a step started it stays
    expect(texts[0]).toBeNull();
    expect(texts.slice(1)).not.toContain(null);
    expect(texts.slice(1)).not.toContain("");
    expect(texts).toEqual([null, "First...", "Second..."]);
  });
});
