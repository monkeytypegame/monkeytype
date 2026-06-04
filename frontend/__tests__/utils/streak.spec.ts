import type { Mode } from "@monkeytype/schemas/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SnapshotResult } from "../../src/ts/constants/default-snapshot";
import {
  getStreakExtraText,
  getStreakIndicatorState,
  getStreakHoverText,
  hasClaimedStreakToday,
} from "../../src/ts/utils/streak";

function resultAt(timestamp: number): SnapshotResult<Mode> {
  return { timestamp } as SnapshotResult<Mode>;
}

describe("streak utils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides the header indicator when signed out", () => {
    expect(getStreakIndicatorState(undefined, undefined)).toEqual({
      show: false,
      claimedToday: false,
      hoverText: "",
    });
  });

  it("shows a hollow flame with a zero label before the first streak claim", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const state = getStreakIndicatorState(
      {
        streak: 0,
        maxStreak: 0,
      },
      undefined,
    );

    expect(state).toMatchObject({
      show: true,
      claimedToday: false,
      label: "0",
      hoverText: "Longest streak: 0 days",
    });
  });

  it("does not claim a zero streak even if a stale last result is present", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const state = getStreakIndicatorState(
      {
        streak: 0,
        maxStreak: 0,
      },
      resultAt(new Date("2026-06-03T09:00:00Z").getTime()),
    );

    expect(state).toMatchObject({
      show: true,
      claimedToday: false,
      label: "0",
      hoverText: "Longest streak: 0 days",
    });
  });

  it("shows a solid flame and one-day label after the first saved result", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const state = getStreakIndicatorState(
      {
        streak: 1,
        maxStreak: 1,
      },
      resultAt(new Date("2026-06-03T09:00:00Z").getTime()),
    );

    expect(state.show).toBe(true);
    expect(state.claimedToday).toBe(true);
    expect(state.label).toBe("1");
    expect(state.hoverText).toContain("Longest streak: 1 day");
    expect(state.hoverText).toContain("Claimed today: yes");
  });

  it("uses the snapshot streak timestamp before result history loads", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const state = getStreakIndicatorState(
      {
        streak: 1,
        maxStreak: 1,
        streakLastResultTimestamp: new Date("2026-06-03T09:00:00Z").getTime(),
      },
      undefined,
    );

    expect(state.claimedToday).toBe(true);
    expect(state.label).toBe("1");
    expect(state.hoverText).toContain("Claimed today: yes");
  });

  it("prefers the snapshot streak timestamp over a stale cached result", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const state = getStreakIndicatorState(
      {
        streak: 365,
        maxStreak: 365,
        streakLastResultTimestamp: new Date("2026-06-02T12:00:00Z").getTime(),
      },
      resultAt(new Date("2026-06-03T09:00:00Z").getTime()),
    );

    expect(state.claimedToday).toBe(false);
    expect(state.label).toBe("365");
    expect(state.hoverText).toContain("Claimed today: no");
  });

  it("updates a long streak from unclaimed to claimed after today's result save", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const yesterday = new Date("2026-06-02T12:00:00Z").getTime();

    const beforeToday = getStreakIndicatorState(
      {
        streak: 365,
        maxStreak: 365,
      },
      resultAt(yesterday),
    );
    const afterToday = getStreakIndicatorState(
      {
        streak: 366,
        maxStreak: 366,
      },
      resultAt(new Date("2026-06-03T00:00:00Z").getTime()),
    );

    expect(beforeToday.show).toBe(true);
    expect(beforeToday.claimedToday).toBe(false);
    expect(beforeToday.label).toBe("365");
    expect(beforeToday.hoverText).toContain("Claimed today: no");

    expect(afterToday.show).toBe(true);
    expect(afterToday.claimedToday).toBe(true);
    expect(afterToday.label).toBe("366");
    expect(afterToday.hoverText).toContain("Longest streak: 366 days");
    expect(afterToday.hoverText).toContain("Claimed today: yes");
  });

  it("omits account-only extra text unless opted in", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const yesterday = new Date("2026-06-02T12:00:00Z").getTime();

    expect(getStreakHoverText({ maxStreak: 30 })).toBe(
      "Longest streak: 30 days",
    );
    expect(
      getStreakHoverText({
        maxStreak: 30,
        lastResult: resultAt(yesterday),
      }),
    ).toBe("Longest streak: 30 days");
    expect(
      getStreakHoverText({
        maxStreak: 30,
        lastResult: resultAt(yesterday),
        showExtraText: true,
      }),
    ).toContain("Claimed today: no");
  });

  it("describes a streak at risk after yesterday's last result", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const state = getStreakIndicatorState(
      {
        streak: 5,
        maxStreak: 10,
      },
      resultAt(new Date("2026-06-02T12:00:00Z").getTime()),
    );

    expect(state.claimedToday).toBe(false);
    expect(state.label).toBe("5");
    expect(state.hoverText).toContain("Claimed today: no");
    expect(state.hoverText).toContain("Streak lost in:");
  });

  it("shows a zero label when the current streak is already lost", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const state = getStreakIndicatorState(
      {
        streak: 7,
        maxStreak: 12,
      },
      resultAt(new Date("2026-06-01T12:00:00Z").getTime()),
    );

    expect(state.claimedToday).toBe(false);
    expect(state.label).toBe("0");
    expect(state.hoverText).toContain("Longest streak: 12 days");
    expect(state.hoverText).toContain("Streak lost ");
  });

  it("describes lost streaks from the actual reset time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T20:00:00Z"));
    const extraText = getStreakExtraText(
      resultAt(new Date("2026-06-01T12:00:00Z").getTime()),
      undefined,
    );

    expect(extraText).toContain("Streak lost 20 hours ago");
  });

  it("uses the streak hour offset when checking today's claim", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T01:00:00Z"));
    const lateYesterdayUtc = resultAt(
      new Date("2026-06-02T23:30:00Z").getTime(),
    );

    expect(hasClaimedStreakToday(lateYesterdayUtc, undefined)).toBe(false);
    expect(hasClaimedStreakToday(lateYesterdayUtc, 6)).toBe(true);
  });

  it("describes an already lost streak without the timezone hint when offset is set", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
    const extraText = getStreakExtraText(
      resultAt(new Date("2026-06-01T12:00:00Z").getTime()),
      2,
    );

    expect(extraText).toContain("Streak lost ");
    expect(extraText).toContain("(+2 offset)");
    expect(extraText).toContain(
      "It will be removed from your profile on the next result save",
    );
    expect(extraText).not.toContain("If the streak reset time");
  });
});
