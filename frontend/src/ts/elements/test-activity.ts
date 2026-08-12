import {
  TestActivityCalendar,
  TestActivityMonth,
} from "./test-activity-calendar";

// Non-centered balloons on edge weeks so tooltips aren't clipped by viewport.
const BALLOON_EDGE_WEEKS = 10;

export type ActivityBalloonPos = "up" | "up-left" | "up-right";

/** Right-edge cells → `up-right` (extends left); left-edge → `up-left`. */
export function getActivityBalloonPos(
  dayIndex: number,
  dayCount: number,
): ActivityBalloonPos {
  const weekCount = Math.ceil(dayCount / 7);
  const week = Math.floor(dayIndex / 7);
  if (week >= weekCount - BALLOON_EDGE_WEEKS) {
    return "up-right";
  }
  if (week < BALLOON_EDGE_WEEKS) {
    return "up-left";
  }
  return "up";
}

export function init(
  element: HTMLElement,
  calendar?: TestActivityCalendar,
): void {
  if (calendar === undefined) {
    clear(element);
    return;
  }
  element.classList.remove("hidden");

  updateLabels(element, calendar.firstDayOfWeek);
  update(element, calendar);
}

export function clear(element?: HTMLElement): void {
  element?.classList.add("hidden");
  element?.querySelector(".activity")?.replaceChildren();
}

export function update(
  element: HTMLElement,
  calendar?: TestActivityCalendar,
): void {
  const container = element.querySelector(".activity");

  if (container === null) {
    return;
  }

  container.innerHTML = "";

  if (calendar === undefined) {
    updateMonths([]);
    element.querySelector(".nodata")?.classList.remove("hidden");

    return;
  }

  updateMonths(calendar.getMonths());
  element.querySelector(".nodata")?.classList.add("hidden");

  const title = element.querySelector(".title");
  {
    if (title !== null) {
      title.innerHTML = `${calendar.getTotalTests()} tests`;
    }
  }

  const days = calendar.getDays();
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (day === undefined) continue;
    const elem = document.createElement("div");
    elem.setAttribute("data-level", day.level);
    if (day.label !== undefined) {
      elem.setAttribute("aria-label", day.label);
      elem.setAttribute(
        "data-balloon-pos",
        getActivityBalloonPos(i, days.length),
      );
    }
    container.appendChild(elem);
  }
}

function updateMonths(months: TestActivityMonth[]): void {
  const element = document.querySelector(".testActivity .months");

  if (element === null) {
    return;
  }

  element.innerHTML = months
    .map(
      (month) =>
        `<div style="grid-column: span ${month.weeks}">${month.text}</div>`,
    )
    .join("");
}

const daysDisplay = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
function updateLabels(element: HTMLElement, firstDayOfWeek: number): void {
  const days: (string | undefined)[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(
      i % 2 !== firstDayOfWeek % 2
        ? daysDisplay[(firstDayOfWeek + i) % 7]
        : undefined,
    );
  }

  const buildHtml = (maxLength?: number): string => {
    const shorten =
      maxLength !== undefined
        ? (it: string) => it.substring(0, maxLength)
        : (it: string) => it;
    return days
      .map((it) =>
        it !== undefined
          ? `<div><div class="text">${shorten(it)}</div></div>`
          : "<div></div>",
      )
      .join("");
  };

  (element.querySelector(".daysFull") as HTMLElement).innerHTML = buildHtml();
  (element.querySelector(".days") as HTMLElement).innerHTML = buildHtml(3);
}
