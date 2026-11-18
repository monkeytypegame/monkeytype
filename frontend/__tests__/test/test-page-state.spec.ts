import { describe, expect, it } from "vitest";
import { createEffect, createRoot } from "solid-js";

import {
  isTestPageMounted,
  markTestPageMounted,
} from "../../src/ts/test/test-page-state";

describe("isTestPageMounted", () => {
  it("stays true when a remount happens before the old mount unbinds", () => {
    const first = new AbortController();
    const second = new AbortController();
    markTestPageMounted(first.signal);
    markTestPageMounted(second.signal);
    first.abort();
    expect(isTestPageMounted()).toBe(true);
    second.abort();
    expect(isTestPageMounted()).toBe(false);
  });

  it("notifies reactive readers on mount and unmount", () => {
    const controller = new AbortController();
    const seen: boolean[] = [];
    const dispose = createRoot((dispose) => {
      createEffect(() => seen.push(isTestPageMounted()));
      return dispose;
    });
    markTestPageMounted(controller.signal);
    controller.abort();
    dispose();
    expect(seen).toEqual([false, true, false]);
  });
});
