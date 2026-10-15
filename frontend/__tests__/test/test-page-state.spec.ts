import { afterEach, describe, expect, it } from "vitest";

import {
  canStartTest,
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
