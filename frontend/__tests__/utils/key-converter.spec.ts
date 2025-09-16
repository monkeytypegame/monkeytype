import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { layoutKeyToKeycode } from "../../src/ts/utils/key-converter";

const isoDvorak = JSON.parse(
  readFileSync(
    import.meta.dirname + "/../../static/layouts/swedish_dvorak.json",
    "utf-8"
  )
);
const dvorak = JSON.parse(
  readFileSync(
    import.meta.dirname + "/../../static/layouts/dvorak.json",
    "utf-8"
  )
);

describe("key-converter", () => {
  describe("layoutKeyToKeycode", () => {
    it("handles unknown key", () => {
      const keycode = layoutKeyToKeycode("🤷", isoDvorak);

      expect(keycode).toBeUndefined();
    });
    it("handles iso backslash", () => {
      const keycode = layoutKeyToKeycode("*", isoDvorak);

      expect(keycode).toEqual("Backslash");
    });
    it("handles iso IntlBackslash", () => {
      const keycode = layoutKeyToKeycode("<", isoDvorak);

      expect(keycode).toEqual("IntlBackslash");
    });
    it("handles iso row4", () => {
      const keycode = layoutKeyToKeycode("q", isoDvorak);

      expect(keycode).toEqual("KeyX");
    });
    it("handles ansi", () => {
      const keycode = layoutKeyToKeycode("q", dvorak);

      expect(keycode).toEqual("KeyX");
    });
  });
});
