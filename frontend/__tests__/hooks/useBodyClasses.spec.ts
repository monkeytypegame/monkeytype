import { describe, it, expect, afterEach } from "vitest";
import { createRoot, createSignal } from "solid-js";
import { useBodyClasses } from "../../src/ts/hooks/useBodyClasses";

function setup(initial: Record<string, boolean>): {
  set: (classes: Record<string, boolean>) => void;
  dispose: () => void;
} {
  return createRoot((dispose) => {
    const [classes, set] = createSignal(initial);
    useBodyClasses(classes);
    return { set, dispose };
  });
}

describe("useBodyClasses", () => {
  afterEach(() => {
    document.body.className = "";
  });

  it("adds the enabled classes to the body", () => {
    const { dispose } = setup({ a: true, b: true, c: false });
    expect([...document.body.classList]).toEqual(["a", "b"]);
    dispose();
  });

  it("swaps the classes when they change", () => {
    const { set, dispose } = setup({ a: true, b: true });
    set({ a: false, b: true, c: true });
    expect([...document.body.classList].sort()).toEqual(["b", "c"]);
    set({});
    expect([...document.body.classList]).toEqual([]);
    dispose();
  });

  it("removes the classes on dispose, keeping others", () => {
    document.body.classList.add("other");
    const { dispose } = setup({ a: true });
    dispose();
    expect([...document.body.classList]).toEqual(["other"]);
  });
});
