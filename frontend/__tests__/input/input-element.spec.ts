import { describe, expect, it } from "vitest";
import {
  blurInputElement,
  registerInputElement,
} from "../../src/ts/input/input-element";

describe("input-element", () => {
  it("blurring after the test page unmounted does nothing", () => {
    const controller = new AbortController();
    registerInputElement(document.createElement("textarea"), controller.signal);
    // the typing test unregisters its input before TestPage's cleanup blurs it
    controller.abort();

    expect(() => blurInputElement()).not.toThrow();
  });
});
