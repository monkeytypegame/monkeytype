import { describe, it, expect, beforeEach, vi } from "vitest";

const mockConfig = vi.hoisted(() => ({ funbox: "" }));
vi.mock("../../../src/ts/config/store", () => ({
  Config: mockConfig,
}));

import {
  getTestEventCode,
  keysToTrack,
} from "../../../src/ts/input/helpers/test-event-code";

function kbd(code: string, key?: string): KeyboardEvent {
  return { code, key: key ?? "" } as KeyboardEvent;
}

describe("getTestEventCode", () => {
  beforeEach(() => {
    mockConfig.funbox = "";
  });

  it("returns the event code as-is for normal keys", () => {
    expect(getTestEventCode(kbd("KeyA"))).toBe("KeyA");
    expect(getTestEventCode(kbd("Space"))).toBe("Space");
    expect(getTestEventCode(kbd("Digit1"))).toBe("Digit1");
  });

  it("returns NoCode when code is empty string", () => {
    expect(getTestEventCode(kbd(""))).toBe("NoCode");
  });

  it("returns NoCode when key is Unidentified even with a valid code", () => {
    expect(getTestEventCode(kbd("Semicolon", "Unidentified"))).toBe("NoCode");
  });

  it("returns NoCode when key is Unidentified", () => {
    expect(getTestEventCode(kbd("KeyA", "Unidentified"))).toBe("NoCode");
  });

  it("returns Space for NumpadEnter when 58008 funbox is active", () => {
    mockConfig.funbox = "58008";
    expect(getTestEventCode(kbd("NumpadEnter"))).toBe("Space");
  });

  it("does not remap NumpadEnter without 58008 funbox", () => {
    expect(getTestEventCode(kbd("NumpadEnter"))).toBe("NumpadEnter");
  });

  it("returns NoCode for arrow keys when arrows funbox is active", () => {
    mockConfig.funbox = "arrows";
    expect(getTestEventCode(kbd("ArrowUp"))).toBe("NoCode");
    expect(getTestEventCode(kbd("ArrowDown"))).toBe("NoCode");
    expect(getTestEventCode(kbd("ArrowLeft"))).toBe("NoCode");
    expect(getTestEventCode(kbd("ArrowRight"))).toBe("NoCode");
  });

  it("does not remap arrow keys without arrows funbox", () => {
    expect(getTestEventCode(kbd("ArrowUp"))).toBe("ArrowUp");
  });

  it("handles 58008 funbox combined with other funboxes", () => {
    mockConfig.funbox = "other#58008";
    expect(getTestEventCode(kbd("NumpadEnter"))).toBe("Space");
  });

  it("handles arrows funbox combined with other funboxes", () => {
    mockConfig.funbox = "arrows#other";
    expect(getTestEventCode(kbd("ArrowLeft"))).toBe("NoCode");
  });
});

describe("keysToTrack", () => {
  it("tracks typing keys, not editing keys", () => {
    expect(keysToTrack.has("KeyA")).toBe(true);
    expect(keysToTrack.has("NoCode")).toBe(true);
    expect(keysToTrack.has("Backspace")).toBe(false);
  });
});
