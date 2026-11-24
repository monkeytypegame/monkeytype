import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createLocalStorageSignal } from "../../src/ts/hooks/createLocalStorageSignal";

const options = {
  key: "useLocalStorageSpec",
  schema: z.number().int().min(1),
  fallback: 1,
};

/** Another tab writing (or removing, with null) the key. */
function writeFromOtherTab(value: string | null): void {
  if (value === null) localStorage.removeItem(options.key);
  else localStorage.setItem(options.key, value);
  window.dispatchEvent(
    new StorageEvent("storage", { key: options.key, newValue: value }),
  );
}

describe("createLocalStorageSignal", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("works at module scope, without an owner or a warning", () => {
    const warn = vi.spyOn(console, "warn");
    const [get, set] = createLocalStorageSignal(options);

    expect(get()).toBe(1);
    expect(set(5)).toBe(true);
    expect(get()).toBe(5);
    expect(JSON.parse(localStorage.getItem(options.key) ?? "null")).toBe(5);
    expect(warn).not.toHaveBeenCalled();
  });

  it("reads the stored value", () => {
    localStorage.setItem(options.key, "7");
    const [get] = createLocalStorageSignal(options);
    expect(get()).toBe(7);
  });

  it("applies updaters to the current value", () => {
    const [get, set] = createLocalStorageSignal(options);
    set(2);
    expect(set((prev) => prev + 1)).toBe(true);
    expect(get()).toBe(3);
  });

  it("keeps the value when the new one fails validation", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const [get, set] = createLocalStorageSignal(options);
    set(4);

    expect(set(0)).toBe(false);
    expect(get()).toBe(4);
  });

  it("resets to the fallback and removes the key", () => {
    const [get, set, reset] = createLocalStorageSignal(options);
    set(9);

    reset();

    expect(get()).toBe(1);
    expect(localStorage.getItem(options.key)).toBeNull();
  });

  it("follows other tabs, including a reset there", () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const [get, set] = createLocalStorageSignal(options);

    writeFromOtherTab("6");
    expect(get()).toBe(6);

    set(8);
    writeFromOtherTab(null);
    expect(get()).toBe(1);
  });

  it("stores a value matching what it had before another tab's change", () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const [get, set] = createLocalStorageSignal(options);
    set(8);

    writeFromOtherTab("6");
    expect(set(8)).toBe(true);

    expect(get()).toBe(8);
    expect(localStorage.getItem(options.key)).toBe("8");
  });

  it("ignores other tabs when syncing is off", () => {
    const [get] = createLocalStorageSignal({
      ...options,
      syncAcrossTabs: false,
    });
    writeFromOtherTab("6");
    expect(get()).toBe(1);
  });

  it("stops following other tabs when its owner is disposed", () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const [get, dispose] = createRoot((dispose) => {
      const [get] = createLocalStorageSignal(options);
      return [get, dispose] as const;
    });

    dispose();
    writeFromOtherTab("6");

    expect(get()).toBe(1);
  });
});
