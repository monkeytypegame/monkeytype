import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/ts/collections/results", () => ({
  __nonReactive: { getResults: () => [] },
}));

import * as TodayTracker from "../../src/ts/test/today-tracker";

describe("today tracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds up the seconds typed on the same day", () => {
    vi.setSystemTime(new Date(2026, 0, 31, 10));
    TodayTracker.addAllFromToday();
    TodayTracker.addSeconds(30);
    TodayTracker.addSeconds(15);

    expect(TodayTracker.getString()).toBe("00:00:45 today");
  });

  it("starts over on the next day, across a month boundary", () => {
    vi.setSystemTime(new Date(2026, 0, 31, 23, 59));
    TodayTracker.addAllFromToday();
    TodayTracker.addSeconds(30);

    vi.setSystemTime(new Date(2026, 1, 1, 0, 1));
    TodayTracker.addSeconds(15);

    expect(TodayTracker.getString()).toBe("00:00:15 today");
  });

  it("keeps adding up after rolling over to a new day", () => {
    vi.setSystemTime(new Date(2026, 4, 10, 23, 59));
    TodayTracker.addAllFromToday();
    TodayTracker.addSeconds(30);

    vi.setSystemTime(new Date(2026, 4, 11, 9));
    TodayTracker.addSeconds(15);
    TodayTracker.addSeconds(20);

    expect(TodayTracker.getString()).toBe("00:00:35 today");
  });
});
