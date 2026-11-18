import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LoadingPage } from "../../../src/ts/components/pages/LoadingPage";
import { resetLoadingPage } from "../../../src/ts/states/loading-page";

function retryButton(container: HTMLElement): HTMLButtonElement {
  const button = [...container.querySelectorAll("button")].find((el) =>
    el.textContent?.includes("Retry"),
  );
  if (button === undefined) throw new Error("no Retry button");
  return button;
}

describe("LoadingPage Retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    resetLoadingPage();
    vi.useRealTimers();
  });

  it("can't be pressed again for 15 seconds, also after the page remounted", () => {
    const onRetry = vi.fn();
    const page = render(() => (
      <LoadingPage error={{ message: "down", onRetry }} />
    ));

    retryButton(page.container).click();
    expect(onRetry).toHaveBeenCalledOnce();

    // the retry failed again: a new error page
    cleanup();
    const again = render(() => (
      <LoadingPage error={{ message: "down", onRetry }} />
    ));
    expect(retryButton(again.container).disabled).toBe(true);
    expect(retryButton(again.container).textContent).toContain("Retry (15)");

    vi.advanceTimersByTime(14_000);
    expect(retryButton(again.container).textContent).toContain("Retry (1)");
    retryButton(again.container).click();
    expect(onRetry).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1_000);
    expect(retryButton(again.container).disabled).toBe(false);
    expect(retryButton(again.container).textContent).toBe("Retry");
    retryButton(again.container).click();
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});
