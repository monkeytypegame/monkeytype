import SlimSelect from "slim-select";
import { DataObjectPartial } from "slim-select/store";
import * as ServerConfiguration from "../ape/server-configuration";
import * as DB from "../db";
import {
  TestActivityCalendar,
  TestActivityMonth,
} from "./test-activity-calendar";
import { safeNumber } from "@monkeytype/util/numbers";
import { TestActivity } from "@monkeytype/schemas/users";
import { getFirstDayOfTheWeek } from "../utils/date-and-time";
import { addDays } from "date-fns/addDays";
import * as AuthEvent from "../observables/auth-event";

let yearSelector: SlimSelect | undefined = undefined;
let calendar: TestActivityCalendar | undefined = undefined;
let activityByYear: Map<string, TestActivityCalendar> | undefined = undefined;

async function initActivityByYear(): Promise<void> {
  if (activityByYear !== undefined) return;
  activityByYear = new Map<string, TestActivityCalendar>();

  const data = await DB.getTestActivity();
  if (data === undefined) return;

  for (const year in data) {
    const testsByDays = data[year] as (number | null)[];
    const lastDay = addDays(new Date(parseInt(year), 0, 1), testsByDays.length);
    activityByYear.set(
      year,
      new TestActivityCalendar(testsByDays, lastDay, getFirstDayOfTheWeek()),
    );
  }
}

export function init(
  element: HTMLElement,
  testActivityData?: TestActivity,
  userSignUpDate?: Date,
): void {
  if (testActivityData === undefined) {
    clear(element);
    return;
  }

  calendar ??= new TestActivityCalendar(
    testActivityData.testsByDays,
    new Date(testActivityData.lastDay),
    getFirstDayOfTheWeek(),
  );

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

function update(
  element: HTMLElement,
  calendar?: TestActivityCalendar,
  fullYear = false,
): void {
  const container = element.querySelector(".activity");

  if (container === null) {
    return;
  }

  let calendarToShow = calendar;

  container.innerHTML = "";

  if (calendar === undefined) {
    updateMonths([]);
    element.querySelector(".nodata")?.classList.remove("hidden");

    return;
  }

  if (fullYear) {
    calendarToShow = calendar.getFullYearCalendar();
  } else {
    calendarToShow = calendar;
  }

  updateMonths(calendarToShow.getMonths());
  element.querySelector(".nodata")?.classList.add("hidden");

  const title = element.querySelector(".title");
  {
    if (title !== null) {
      title.innerHTML = calendar.getTotalTests() + " tests";
    }
  }

  for (const day of calendarToShow.getDays()) {
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
  // oxlint-disable-next-line no-unsafe-argument
  yearSelect.setData(years);
  // oxlint-disable-next-line no-unsafe-call
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
        // oxlint-disable-next-line no-unsafe-call
        yearSelector?.disable();
        const selected = newVal[0]?.value as string;
        const currentYear = new Date().getFullYear().toString();

        if (selected === "current") {
          update(element, calendar, false);
        } else if (selected === currentYear) {
          update(element, calendar, true);
        } else {
          if (activityByYear === undefined) {
            await initActivityByYear();
          }
          const activity = activityByYear?.get(selected);
          update(element, activity, true);
        }

        // oxlint-disable-next-line no-unsafe-call
        if ((yearSelector?.getData() ?? []).length > 1) {
          // oxlint-disable-next-line no-unsafe-call
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

AuthEvent.subscribe((data) => {
  if (data.type === "snapshotUpdated" && DB.getSnapshot() === undefined) {
    activityByYear?.clear();
  }
});
