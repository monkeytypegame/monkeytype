import { describe, it, expect } from "vitest";
import { createRoot } from "solid-js";
import { createSignalWithSetters } from "../../src/ts/hooks/createSignalWithSetters";

describe("createSignalWithSetters", () => {
  it("returns default value from getter", () => {
    createRoot((dispose) => {
      const [count] = createSignalWithSetters(42)({});
      expect(count()).toBe(42);
      dispose();
    });
  });

  it("exposes raw set on the setters object", () => {
    createRoot((dispose) => {
      const [count, { set }] = createSignalWithSetters(0)({});
      set(7);
      expect(count()).toBe(7);
      dispose();
    });
  });

  it("raw set accepts an updater function", () => {
    createRoot((dispose) => {
      const [count, { set }] = createSignalWithSetters(3)({});
      set((prev) => prev * 2);
      expect(count()).toBe(6);
      dispose();
    });
  });

  it("calls a no-arg named setter", () => {
    createRoot((dispose) => {
      const [count, { increment }] = createSignalWithSetters(0)({
        increment: (set) => set((n) => n + 1),
      });
      increment();
      expect(count()).toBe(1);
      increment();
      expect(count()).toBe(2);
      dispose();
    });
  });

  it("calls a named setter with custom args", () => {
    createRoot((dispose) => {
      const [count, { addBy }] = createSignalWithSetters(0)({
        addBy: (set, amount: number) => set((n) => n + amount),
      });
      addBy(5);
      expect(count()).toBe(5);
      addBy(3);
      expect(count()).toBe(8);
      dispose();
    });
  });

  it("supports multiple named setters independently", () => {
    createRoot((dispose) => {
      const [count, { increment, decrement, reset }] = createSignalWithSetters(
        10,
      )({
        increment: (set) => set((n) => n + 1),
        decrement: (set) => set((n) => n - 1),
        reset: (set) => set(0),
      });
      increment();
      expect(count()).toBe(11);
      decrement();
      decrement();
      expect(count()).toBe(9);
      reset();
      expect(count()).toBe(0);
      dispose();
    });
  });

  it("works with non-primitive default values", () => {
    createRoot((dispose) => {
      const [state, { setName }] = createSignalWithSetters({ name: "Alice" })({
        setName: (set, name: string) => set((prev) => ({ ...prev, name })),
      });
      setName("Bob");
      expect(state().name).toBe("Bob");
      dispose();
    });
  });

  it("raw set and named setters share the same underlying signal", () => {
    createRoot((dispose) => {
      const [count, { increment, set }] = createSignalWithSetters(0)({
        increment: (set) => set((n) => n + 1),
      });
      increment();
      set(100);
      expect(count()).toBe(100);
      increment();
      expect(count()).toBe(101);
      dispose();
    });
  });
});
