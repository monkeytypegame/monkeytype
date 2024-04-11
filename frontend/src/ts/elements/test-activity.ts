import format from "date-fns/format";
import SlimSelect from "slim-select";
import type { DataObjectPartial } from "slim-select/dist/store";
import * as Dates from "date-fns";

type ActivityDay = {
  level: string;
  label?: string;
};
export class ActivityCalendar {
  private data: (number | null | undefined)[];
  private startDay: Date;
  private endDay: Date;

  constructor(data: (number | null)[], lastDay: Date) {
    this.endDay = Dates.endOfMonth(lastDay);
    this.startDay = Dates.addDays(Dates.subYears(this.endDay, 1), 1);

    //fill calendar with enough values
    const values = new Array(386 - data.length).fill(undefined);
    values.push(...data);

    //discard values outside the calendar range
    const days = Dates.differenceInDays(this.endDay, this.startDay) + 1;
    const offset =
      values.length - days + Dates.differenceInDays(this.endDay, lastDay);
    this.data = values.slice(offset);
  }

  getMonths(): string[] {
    return Dates.eachMonthOfInterval({
      start: this.startDay,
      end: this.endDay,
    }).map((month) => Dates.format(month, "MMM`yy"));
  }

  getYearSelector(): DataObjectPartial[] {
    const selectedYear = this.endDay.getFullYear();
    const currentYear = new Date().getFullYear();
    const years: DataObjectPartial[] = [
      {
        text: currentYear.toString(),
        value: "current",
        selected: selectedYear == currentYear,
      },
    ];
    for (let year = currentYear - 1; year >= 2020; year--) {
      years.push({
        text: year.toString(),
        value: year.toString(),
        selected: year == selectedYear,
      });
    }
    return years;
  }

  getDays(): ActivityDay[] {
    const result: ActivityDay[] = [];

    const buckets = this.getBuckets();
    const getValue = (v: number | null | undefined): string => {
      if (v === undefined) return "filler";
      if (v === null || v === 0) return "0";
      for (let b = 0; b < 4; b++)
        if (v <= (buckets[b] ?? 0)) return (1 + b).toString();

      return "4";
    };

    //skip weekdays in the previous month
    for (let i = 0; i < this.startDay.getDay(); i++) {
      result.push({
        level: "filler",
      });
    }

    const days = Dates.differenceInDays(this.endDay, this.startDay) + 1;

    let currentDate = this.startDay;
    for (let i = 0; i < days; i++) {
      const count = this.data[i];
      result.push({
        level: getValue(count),
        label:
          this.data[i] !== undefined
            ? `${count} ${count == 1 ? "test" : "tests"} on ${format(
                currentDate,
                "EEEE dd MMM yyyy"
              )}`
            : undefined,
      });
      currentDate = Dates.addDays(currentDate, 1);
    }

    //add weekdays missing
    for (let i = this.endDay.getDay(); i < 6; i++) {
      result.push({
        level: "filler",
      });
    }

    return result;
  }

  private getBuckets(): number[] {
    const filtered = this.data.filter(
      (it) => it !== null && it !== undefined
    ) as number[];
    const sorted = filtered.sort((a, b) => a - b);

    const trimmed = sorted.slice(
      Math.round(sorted.length * 0.1),
      sorted.length - Math.round(sorted.length * 0.1)
    );
    const sum = trimmed.reduce((a, c) => a + c, 0) as number;
    const mid = sum / trimmed.length;
    return [Math.floor(mid / 2), Math.round(mid), Math.round(mid * 1.5)];
  }
}

export function update(
  data: (number | null)[] | undefined,
  lastDay: Date
): void {
  if (data === undefined) {
    $("#testActivity").addClass("hidden");
    return;
  }
  $("#testActivity").removeClass("hidden");

  const container = document.querySelector("#testActivity .activity");
  if (container === null)
    throw new Error("cannot find container #testActivity .activity");
  container.innerHTML = "";

  const calendar = new ActivityCalendar(data, lastDay);
  initYearSelector(calendar.getYearSelector());
  updateMonths(calendar.getMonths());

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

function initYearSelector(years: DataObjectPartial[]): void {
  new SlimSelect({
    select: "#testActivity .yearSelect",
    settings: {
      showSearch: false,
    },
    data: years,
  });
}

function updateMonths(months: string[]): void {
  const element = document.querySelector("#testActivity .months") as Element;

  element.innerHTML = months.map((month) => `<div>${month}</div>`).join("");
}
