import SlimSelect from "slim-select";
import { DataObjectPartial } from "slim-select/store";
import { getTestActivityCalendar } from "../db";
import * as ServerConfiguration from "../ape/server-configuration";
import * as DB from "../db";
import {
  TestActivityCalendar,
  TestActivityMonth,
} from "./test-activity-calendar";
import { safeNumber } from "@monkeytype/util/numbers";

let yearSelector: SlimSelect | undefined = undefined;

export function init(
  element: HTMLElement,
  calendar?: TestActivityCalendar,
  userSignUpDate?: Date,
): void {
  if (calendar === undefined) {
    clear(element);
    return;
  }
  element.classList.remove("hidden");

  if (element.querySelector(".yearSelect") !== null) {
    yearSelector = getYearSelector(element);
    initYearSelector(
      element,
      "current",
      safeNumber(userSignUpDate?.getFullYear()) ?? 2022,
    );
  }
  updateLabels(element, calendar.firstDayOfWeek);
  update(element, calendar);
}

export function clear(element?: HTMLElement): void {
  element?.classList.add("hidden");
  element?.querySelector(".activity")?.replaceChildren();
}

function update(element: HTMLElement, calendar?: TestActivityCalendar): void {
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
      title.innerHTML = calendar.getTotalTests() + " tests";
    }
  }

  for (const day of calendar.getDays()) {
    const elem = document.createElement("div");
    elem.setAttribute("data-level", day.level);
    if (day.label !== undefined) {
      elem.setAttribute("aria-label", day.label);
      elem.setAttribute("data-balloon-pos", "up");
    }
    container.appendChild(elem);
  }
}

export function initYearSelector(
  element: HTMLElement,
  selectedYear: number | "current",
  startYear: number,
): void {
  const currentYear = new Date().getFullYear();
  const years: DataObjectPartial[] = [
    {
      text: "last 12 months",
      value: "current",
      selected: selectedYear === "current",
    },
  ];
  for (let year = currentYear; year >= startYear; year--) {
    if (
      years.length < 2 ||
      (ServerConfiguration.get()?.users.premium.enabled &&
        DB.getSnapshot()?.isPremium)
    ) {
      years.push({
        text: year.toString(),
        value: year.toString(),
        selected: year === selectedYear,
      });
    }
  }

  const yearSelect = getYearSelector(element);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  yearSelect.setData(years);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  years.length > 1 ? yearSelect.enable() : yearSelect.disable();
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

function getYearSelector(element: HTMLElement): SlimSelect {
  if (yearSelector !== undefined) return yearSelector;
  yearSelector = new SlimSelect({
    select: element.querySelector(".yearSelect") as Element,
    settings: {
      showSearch: false,
    },
    events: {
      afterChange: async (newVal): Promise<void> => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        yearSelector?.disable();
        const selected = newVal[0]?.value as string;
        const activity = await getTestActivityCalendar(selected);
        update(element, activity);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if ((yearSelector?.getData() ?? []).length > 1) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          yearSelector?.enable();
        }
      },
    },
  });
  return yearSelector;
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
