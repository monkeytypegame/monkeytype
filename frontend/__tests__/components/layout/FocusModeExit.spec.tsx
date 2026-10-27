import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { focusMode, setFocusModeMock } = vi.hoisted(() => ({
  focusMode: { get: (): boolean => false },
  setFocusModeMock: vi.fn<(value: boolean) => void>(),
}));
vi.mock("../../../src/ts/states/test", () => ({
  isFocusMode: () => focusMode.get(),
  setFocusMode: setFocusModeMock,
}));

import { FocusModeExit } from "../../../src/ts/components/layout/FocusModeExit";

function moveMouse(movementX: number, movementY: number): void {
  const event = new MouseEvent("mousemove");
  Object.defineProperties(event, {
    movementX: { value: movementX },
    movementY: { value: movementY },
  });
  document.dispatchEvent(event);
}

describe("FocusModeExit", () => {
  const [focused, setFocused] = createSignal(false);
  focusMode.get = focused;

  beforeEach(() => {
    setFocused(false);
    setFocusModeMock.mockClear();
  });

  it("exits focus mode when the mouse moves past the threshold", () => {
    render(() => <FocusModeExit />);
    setFocused(true);

    moveMouse(4, 0);
    expect(setFocusModeMock).toHaveBeenCalledWith(false);
  });

  it("exits on movement left or up too", () => {
    render(() => <FocusModeExit />);
    setFocused(true);

    moveMouse(0, -4);
    expect(setFocusModeMock).toHaveBeenCalledWith(false);
  });

  it("ignores small movements", () => {
    render(() => <FocusModeExit />);
    setFocused(true);

    moveMouse(3, -3);
    expect(setFocusModeMock).not.toHaveBeenCalled();
  });

  it("only listens while focus mode is on", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    render(() => <FocusModeExit />);
    expect(addSpy).not.toHaveBeenCalledWith("mousemove", expect.anything());

    moveMouse(10, 10);
    expect(setFocusModeMock).not.toHaveBeenCalled();

    setFocused(true);
    setFocused(false);
    moveMouse(10, 10);
    expect(setFocusModeMock).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });
});
