import { describe, expect, it } from "vitest";
import {
  blurInputElement,
  registerInputElement,
} from "../../src/ts/input/input-element";

describe("input-element", () => {
  it("blurring after the test page unmounted does nothing", () => {
    const unregister = registerInputElement(document.createElement("textarea"));
    // WordsInput unregisters its input before TestPage's cleanup blurs it
    unregister();

    expect(() => blurInputElement()).not.toThrow();
  });
});
