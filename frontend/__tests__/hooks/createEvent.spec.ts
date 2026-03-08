import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import { createEvent } from "../../src/ts/hooks/createEvent";

describe("createEvent", () => {
  it("initial value is 0", () => {
    createRoot((dispose) => {
      const [event] = createEvent();
      expect(event()).toBe(0);
      dispose();
    });
  });

  it("dispatch increments the value by 1", () => {
    createRoot((dispose) => {
      const [event, dispatch] = createEvent();
      dispatch();
      expect(event()).toBe(1);
      dispose();
    });
  });

  it("each dispatch increments independently", () => {
    createRoot((dispose) => {
      const [event, dispatch] = createEvent();
      dispatch();
      dispatch();
      dispatch();
      expect(event()).toBe(3);
      dispose();
    });
  });

  it("two independent events do not share state", () => {
    createRoot((dispose) => {
      const [eventA, dispatchA] = createEvent();
      const [eventB, dispatchB] = createEvent();
      dispatchA();
      dispatchA();
      dispatchB();
      expect(eventA()).toBe(2);
      expect(eventB()).toBe(1);
      dispose();
    });
  });
});
