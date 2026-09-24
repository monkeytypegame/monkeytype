import { describe, it, expect, vi, afterEach } from "vitest";
import * as MonkeyPower from "../../src/ts/elements/monkey-power";

vi.mock("../../src/ts/config/store", () => ({
  Config: { monkeyPowerLevel: "3", blindMode: false },
}));
vi.mock("../../src/ts/legacy-states/slow-timer", () => ({
  get: () => false,
}));
vi.mock("../../src/ts/states/theme", () => ({
  getTheme: () => ({ caret: "#fff", error: "#f00" }),
}));
vi.mock("../../src/ts/utils/debounced-animation-frame", () => ({
  requestDebouncedAnimationFrame: (_id: string, cb: () => void) => cb(),
}));

describe("monkey-power", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reset cancels the pending shake reset", async () => {
    vi.spyOn(globalThis, "setTimeout").mockReturnValue(
      42 as unknown as NodeJS.Timeout,
    );
    const clear = vi.spyOn(globalThis, "clearTimeout");
    await MonkeyPower.addPower();
    MonkeyPower.reset();
    expect(clear).toHaveBeenCalledWith(42);
  });

  it("randomColor pads every channel", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(MonkeyPower.__testing.randomColor()).toBe("#000000");
  });
});
