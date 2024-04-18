import SlimSelect from "slim-select";
import type { DataObjectPartial } from "slim-select/dist/store";
import { getTestActivityCalendar } from "../db";

const yearSelector = new SlimSelect({
  select: "#testActivity .yearSelect",
  settings: {
    showSearch: false,
  },
  events: {
    afterChange: async (newVal): Promise<void> => {
      yearSelector?.disable();
      const selected = newVal[0]?.value as string;
      const activity = await getTestActivityCalendar(selected);
      update(activity);
      if ((yearSelector?.getData() ?? []).length > 1) {
        yearSelector?.enable();
      }
    },
  },
});

export function init(
  calendar?: MonkeyTypes.TestActivityCalendar,
  userSignUpDate?: Date
): void {
  if (calendar === undefined) {
    $("#testActivity").addClass("hidden");
    return;
  }
  $("#testActivity").removeClass("hidden");
  initYearSelector(new Date(), userSignUpDate?.getFullYear() || 2022);
  update(calendar);
}

function update(calendar?: MonkeyTypes.TestActivityCalendar): void {
  const container = document.querySelector(
    "#testActivity .activity"
  ) as HTMLElement;
  container.innerHTML = "";

  if (calendar === undefined) {
    updateMonths([]);
    $("#testActivity .nodata").removeClass("hidden");
    return;
  }

  updateMonths(calendar.getMonths());
  $("#testActivity .nodata").addClass("hidden");

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

function initYearSelector(selectedDate: Date, startYear: number): void {
  const selectedYear = selectedDate.getFullYear();
  const currentYear = new Date().getFullYear();

  const years: DataObjectPartial[] = [
    {
      text: currentYear.toString(),
      value: "current",
      selected: selectedYear == currentYear,
    },
  ];
  for (let year = currentYear - 1; year >= startYear; year--) {
    years.push({
      text: year.toString(),
      value: year.toString(),
      selected: year == selectedYear,
    });
  }

  yearSelector.setData(years);
  years.length > 1 ? yearSelector.enable() : yearSelector.disable();
}

function updateMonths(months: string[]): void {
  const element = document.querySelector("#testActivity .months") as Element;

  element.innerHTML = months.map((month) => `<div>${month}</div>`).join("");
}
