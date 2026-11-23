import { describe, it, expect, beforeEach } from "vitest";
import { __testing } from "../../src/ts/config/testing";
import { setConfigStore } from "../../src/ts/config/store";
import { before } from "../../src/ts/test/practise-words";

describe("practise words", () => {
  beforeEach(() => {
    __testing.replaceConfig({ mode: "time" });
    before.mode = "time";
    before.punctuation = false;
    before.numbers = false;
  });

  it("keeps what it reverts to when practise sets custom mode", () => {
    setConfigStore("mode", "custom");
    expect(before.mode).toBe("time");
  });

  it("leaves practise on a change to another mode", () => {
    setConfigStore("mode", "custom");
    setConfigStore("mode", "words");
    expect(before.mode).toBeNull();
  });
});
