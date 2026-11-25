import {
  getCells,
  getMonths,
  getTotalTests,
  TestActivityCalendar,
  TestActivityMonth,
} from "../states/test-activity";

// Stepping stone: replaced by a Solid activity calendar component in U2

const tooltipViewportPadding = 8;

function getTooltipHorizontalOffset(
  triggerLeft: number,
  triggerWidth: number,
  tooltipWidth: number,
  viewportWidth: number,
): number {
  const availableWidth = Math.max(
    0,
    viewportWidth - tooltipViewportPadding * 2,
  );
  const renderedTooltipWidth = Math.min(tooltipWidth, availableWidth);
  const triggerCenter = triggerLeft + triggerWidth / 2;
  const tooltipLeft = triggerCenter - renderedTooltipWidth / 2;
  const tooltipRight = triggerCenter + renderedTooltipWidth / 2;

  if (tooltipLeft < tooltipViewportPadding) {
    return tooltipViewportPadding - tooltipLeft;
  }

  if (tooltipRight > viewportWidth - tooltipViewportPadding) {
    return viewportWidth - tooltipViewportPadding - tooltipRight;
  }

  return 0;
}

function measureTooltipWidth(element: HTMLElement): number {
  const label = element.getAttribute("aria-label");
  if (label === null) {
    return 0;
  }

  const tooltipStyle = window.getComputedStyle(element, "::after");
  const measure = document.createElement("span");
  measure.textContent = label;
  Object.assign(measure.style, {
    fontFamily: tooltipStyle.fontFamily,
    fontSize: tooltipStyle.fontSize,
    fontStyle: tooltipStyle.fontStyle,
    fontWeight: tooltipStyle.fontWeight,
    letterSpacing: tooltipStyle.letterSpacing,
    paddingLeft: tooltipStyle.paddingLeft,
    paddingRight: tooltipStyle.paddingRight,
    position: "fixed",
    visibility: "hidden",
    whiteSpace: "nowrap",
  });
  document.body.appendChild(measure);
  const width = measure.getBoundingClientRect().width;
  measure.remove();

  return width;
}

function positionTooltip(element: HTMLElement): void {
  const triggerRect = element.getBoundingClientRect();
  const offset = getTooltipHorizontalOffset(
    triggerRect.left,
    triggerRect.width,
    measureTooltipWidth(element),
    document.documentElement.clientWidth,
  );

  element.style.setProperty("--activity-tooltip-offset", `${offset}px`);
}

export function initActivityCalendar(
  element: HTMLElement,
  calendar?: TestActivityCalendar,
): void {
  if (calendar === undefined) {
    clearActivityCalendar(element);
    return;
  }
  element.classList.remove("hidden");

  updateLabels(element, calendar.firstDayOfWeek);
  updateActivityCalendar(element, calendar);
}

export function clearActivityCalendar(element?: HTMLElement): void {
  element?.classList.add("hidden");
  element?.querySelector(".activity")?.replaceChildren();
}

export function updateActivityCalendar(
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

  updateMonths(getMonths(calendar));
  element.querySelector(".nodata")?.classList.add("hidden");

  const title = element.querySelector(".title");
  {
    if (title !== null) {
      title.innerHTML = `${getTotalTests(calendar)} tests`;
    }
  }

  for (const day of getCells(calendar)) {
    const elem = document.createElement("div");
    elem.setAttribute("data-level", day.level);
    if (day.label !== undefined) {
      elem.setAttribute("aria-label", day.label);
      elem.setAttribute("data-balloon-pos", "up");
      elem.addEventListener("pointerenter", () => positionTooltip(elem));
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
