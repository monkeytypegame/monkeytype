import { describe, expect, it } from "vitest";

import { getActivityBalloonPos } from "../../src/ts/elements/test-activity";

describe("test-activity.ts", () => {
  describe("getActivityBalloonPos", () => {
    // ~53 weeks of activity cells (7 days each)
    const dayCount = 53 * 7;

    it("uses up-right for days in the last 10 weeks (right edge)", () => {
      // last day of the calendar (today / rightmost column)
      expect(getActivityBalloonPos(dayCount - 1, dayCount)).toBe("up-right");
      // first day of the 10th week from the end
      expect(getActivityBalloonPos((53 - 10) * 7, dayCount)).toBe("up-right");
    });

    it("uses up-left for days in the first 10 weeks (left edge)", () => {
      expect(getActivityBalloonPos(0, dayCount)).toBe("up-left");
      expect(getActivityBalloonPos(9 * 7 + 6, dayCount)).toBe("up-left");
    });

    it("uses centered up for days in the middle", () => {
      expect(getActivityBalloonPos(26 * 7, dayCount)).toBe("up");
      expect(getActivityBalloonPos(10 * 7, dayCount)).toBe("up");
      expect(getActivityBalloonPos((53 - 11) * 7 + 6, dayCount)).toBe("up");
    });
  });
});
