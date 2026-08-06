import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { update } from "../../src/ts/elements/test-activity";
import { TestActivityCalendar } from "../../src/ts/elements/test-activity-calendar";

describe("test-activity.ts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("aligns tooltips in the last week away from the right edge", () => {
    const element = document.createElement("div");
    element.className = "testActivity";
    element.innerHTML = `
      <div class="title"></div>
      <div class="months"></div>
      <div class="activity"></div>
      <div class="nodata"></div>
    `;
    document.body.append(element);

    const calendar = new TestActivityCalendar(
      [],
      new Date("2026-08-06T12:00:00Z"),
      0,
    );

    update(element, calendar);

    const days = Array.from(
      element.querySelectorAll<HTMLElement>(".activity > div"),
    );
    const previousWeeks = days
      .slice(0, -7)
      .filter((day) => day.hasAttribute("aria-label"));
    const lastWeek = days
      .slice(-7)
      .filter((day) => day.hasAttribute("aria-label"));

    expect(previousWeeks.at(-1)).toHaveAttribute("data-balloon-pos", "up");
    expect(lastWeek).not.toHaveLength(0);
    for (const day of lastWeek) {
      expect(day).toHaveAttribute("data-balloon-pos", "up-right");
    }
  });
});
