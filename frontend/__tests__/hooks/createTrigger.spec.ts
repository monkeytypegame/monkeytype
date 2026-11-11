import { describe, it, expect } from "vitest";
import { createEffect, createRoot } from "solid-js";
import { createTrigger } from "../../src/ts/hooks/createTrigger";

function setup(tracked: boolean): {
  trigger: () => void;
  runs: () => number;
  dispose: () => void;
} {
  let runs = 0;
  return createRoot((dispose) => {
    const [track, trigger] = createTrigger();
    createEffect(() => {
      if (tracked) track();
      runs++;
    });
    return { trigger, runs: () => runs, dispose };
  });
}

describe("createTrigger", () => {
  it("re-runs a tracking effect on every trigger", () => {
    const { trigger, runs, dispose } = setup(true);
    expect(runs()).toBe(1);
    trigger();
    expect(runs()).toBe(2);
    trigger();
    expect(runs()).toBe(3);
    dispose();
  });

  it("does not re-run effects that did not track", () => {
    const { trigger, runs, dispose } = setup(false);
    trigger();
    expect(runs()).toBe(1);
    dispose();
  });

  it("stops re-running after dispose", () => {
    const { trigger, runs, dispose } = setup(true);
    dispose();
    trigger();
    expect(runs()).toBe(1);
  });
});
