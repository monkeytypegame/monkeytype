import { describe, expect, it, vi } from "vitest";
import { createRoot, createSignal } from "solid-js";
import { Hotkey } from "@tanstack/solid-hotkeys";
import { NoKey, createHotkey } from "../../../src/ts/input/hotkeys/utils";

function register(
  hotkey: Hotkey,
  enabled?: boolean,
): { callback: ReturnType<typeof vi.fn>; dispose: () => void } {
  const callback = vi.fn();
  const dispose = createRoot((dispose) => {
    createHotkey(hotkey, callback, () =>
      enabled === undefined ? {} : { enabled },
    );
    return dispose;
  });
  return { callback, dispose };
}

// browser autofill fires keydowns without a key
function pressNoKey(): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
  document.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
}

function press(key: string): void {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  document.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
}

describe("createHotkey", () => {
  it("NoKey never fires, even when explicitly enabled", () => {
    const { callback, dispose } = register(NoKey, true);

    pressNoKey();

    expect(callback).not.toHaveBeenCalled();
    dispose();
  });

  it("fires a real key when enabled", () => {
    const { callback, dispose } = register("Tab", true);

    press("Tab");

    expect(callback).toHaveBeenCalledOnce();
    dispose();
  });

  it("does not fire a real key when disabled", () => {
    const { callback, dispose } = register("Tab", false);

    press("Tab");

    expect(callback).not.toHaveBeenCalled();
    dispose();
  });

  it("registers once a reactive hotkey changes from NoKey to a real key", () => {
    const [key, setKey] = createSignal<Hotkey>(NoKey);
    const callback = vi.fn();
    const dispose = createRoot((dispose) => {
      createHotkey(key, callback);
      return dispose;
    });

    pressNoKey();
    expect(callback).not.toHaveBeenCalled();

    setKey("Tab");
    press("Tab");
    expect(callback).toHaveBeenCalledOnce();

    setKey(NoKey);
    pressNoKey();
    press("Tab");
    expect(callback).toHaveBeenCalledOnce();
    dispose();
  });
});
