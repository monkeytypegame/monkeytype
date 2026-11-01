import { describe, expect, it, vi } from "vitest";
import { listenForKeyState } from "../../src/ts/utils/key-state";

function press(type: "keydown" | "keyup", code: string): void {
  document.dispatchEvent(new KeyboardEvent(type, { code }));
}

describe("listenForKeyState", () => {
  it("reports keydown and keyup until the signal aborts", () => {
    const controller = new AbortController();
    const onKey = vi.fn<(event: KeyboardEvent, isKeyDown: boolean) => void>();
    listenForKeyState(controller.signal, onKey, () => undefined);

    press("keydown", "ShiftLeft");
    press("keyup", "ShiftLeft");
    controller.abort();
    press("keydown", "ShiftLeft");

    expect(onKey.mock.calls.map(([e, down]) => [e.code, down])).toEqual([
      ["ShiftLeft", true],
      ["ShiftLeft", false],
    ]);
  });

  it("resets when starting and when the signal aborts", () => {
    const controller = new AbortController();
    const reset = vi.fn();
    listenForKeyState(controller.signal, () => undefined, reset);
    expect(reset).toHaveBeenCalledTimes(1);

    controller.abort();
    expect(reset).toHaveBeenCalledTimes(2);
  });
});
