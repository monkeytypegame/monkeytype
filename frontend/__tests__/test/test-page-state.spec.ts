import { afterEach, describe, expect, it } from "vitest";
import { createEffect, createRoot } from "solid-js";

import {
  canStartTest,
  isTestPageMounted,
  markTestPageLeaving,
  markTestPageMounted,
} from "../../src/ts/test/test-page-state";

describe("canStartTest", () => {
  let controller = new AbortController();

  afterEach(() => {
    controller.abort();
    controller = new AbortController();
  });

  it("is false while the test page isn't mounted", () => {
    expect(canStartTest()).toBe(false);
  });

  it("is true once the test page is mounted", () => {
    markTestPageMounted(controller.signal);
    expect(canStartTest()).toBe(true);
  });

  it("is false while the test page is leaving", () => {
    markTestPageMounted(controller.signal);
    markTestPageLeaving();
    expect(canStartTest()).toBe(false);
  });

  it("is false once the test page unmounts", () => {
    markTestPageMounted(controller.signal);
    controller.abort();
    expect(canStartTest()).toBe(false);
  });

  it("is true again when the test page mounts after leaving", () => {
    markTestPageMounted(controller.signal);
    markTestPageLeaving();
    controller.abort();
    controller = new AbortController();
    markTestPageMounted(controller.signal);
    expect(canStartTest()).toBe(true);
  });
});

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
