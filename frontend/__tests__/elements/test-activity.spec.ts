import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTooltipHorizontalOffset,
  update,
} from "../../src/ts/elements/test-activity";
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

  it("keeps tooltip arrows centered above every activity day", () => {
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
    const labelledDays = days.filter((day) => day.hasAttribute("aria-label"));

    expect(labelledDays).not.toHaveLength(0);
    for (const day of labelledDays) {
      expect(day).toHaveAttribute("data-balloon-pos", "up");
    }
  });

  it.each([
    {
      description: "away from either edge",
      triggerLeft: 140,
      triggerWidth: 10,
      tooltipWidth: 100,
      viewportWidth: 300,
      expected: 0,
    },
    {
      description: "at the left edge",
      triggerLeft: 2,
      triggerWidth: 10,
      tooltipWidth: 100,
      viewportWidth: 300,
      expected: 51,
    },
    {
      description: "at the right edge",
      triggerLeft: 288,
      triggerWidth: 10,
      tooltipWidth: 100,
      viewportWidth: 300,
      expected: -51,
    },
  ])("offsets the tooltip box $description", (testCase) => {
    expect(
      getTooltipHorizontalOffset(
        testCase.triggerLeft,
        testCase.triggerWidth,
        testCase.tooltipWidth,
        testCase.viewportWidth,
      ),
    ).toBe(testCase.expected);
  });
});
