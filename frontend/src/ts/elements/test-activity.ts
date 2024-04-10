import format from "date-fns/format";
import SlimSelect from "slim-select";
import type { DataObjectPartial } from "slim-select/dist/store";
import * as Dates from "date-fns";

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

  //test data
  const data2 = [
    12,
    23,
    null,
    null,
    11,
    19,
    49,
    null,
    null,
    null,
    10,
    8,
    14,
    11,
    46,
    22,
    null,
    39,
    37,
    19,
    7,
    null,
    13,
    25,
    9,
    null,
    11,
    36,
    19,
    null,
    null,
    null,
    null,
    16,
    null,
    36,
    null,
    13,
    null,
    null,
    27,
    22,
    8,
    20,
    9,
    19,
    20,
    8,
    null,
    26,
    28,
    34,
    4,
    null,
    40,
    null,
    16,
    41,
    50,
    null,
    12,
    39,
    null,
    15,
    39,
    30,
    38,
    49,
    27,
    7,
    25,
    null,
    24,
    40,
    1,
    16,
    null,
    12,
    38,
    24,
    19,
    null,
    null,
    27,
    null,
    40,
    38,
    38,
    null,
    37,
    null,
    38,
    18,
    null,
    48,
    null,
    null,
    32,
    47,
    41,
    39,
    null,
    22,
    21,
    null,
    null,
    29,
    38,
    26,
    8,
    27,
    36,
    39,
    46,
    12,
    35,
    null,
    null,
    null,
    16,
    null,
    44,
    29,
    12,
    28,
    39,
    null,
    40,
    50,
    null,
    9,
    23,
    26,
    null,
    29,
    9,
    16,
    47,
    2,
    46,
    23,
    null,
    2,
    38,
    43,
    null,
    48,
    30,
    42,
    33,
    16,
    14,
    23,
    27,
    null,
    null,
    13,
    39,
    24,
    34,
    1,
    6,
    22,
    null,
    49,
    20,
    20,
    44,
    43,
    null,
    22,
    18,
    37,
    27,
    21,
    15,
    30,
    37,
    null,
    15,
    29,
    null,
    null,
    13,
    null,
    21,
    7,
    22,
    2,
    null,
    44,
    null,
    null,
    46,
    25,
    37,
    40,
    null,
    11,
    null,
    32,
    null,
    27,
    null,
    null,
    4,
    24,
    49,
    null,
    22,
    null,
    12,
    12,
    26,
    44,
    6,
    1,
    40,
    49,
    33,
    1,
    null,
    49,
    null,
    null,
    44,
    8,
    46,
    null,
    46,
    5,
    28,
    42,
    null,
    43,
    35,
    45,
    32,
    null,
    6,
    27,
    null,
    1,
    25,
    36,
    34,
    16,
    25,
    10,
    null,
    16,
    36,
    37,
    null,
    17,
    null,
    17,
    4,
    8,
    25,
    6,
    37,
    null,
    null,
    47,
    42,
    26,
    4,
    13,
    33,
    39,
    32,
    38,
    null,
    15,
    null,
    48,
    null,
    null,
    25,
    null,
    18,
    35,
    20,
    null,
    32,
    26,
    49,
    28,
    17,
    41,
    null,
    38,
    4,
    null,
    23,
    15,
    38,
    46,
    null,
    35,
    null,
    47,
    47,
    45,
    6,
    33,
    13,
    45,
    null,
    27,
    null,
    null,
    9,
    9,
    19,
    34,
    45,
    null,
    16,
    48,
    8,
    null,
    45,
    null,
    22,
    47,
    null,
    4,
    27,
    39,
    42,
    null,
    42,
    null,
    23,
    48,
    10,
    35,
    50,
    18,
    36,
    14,
    17,
    5,
    27,
    12,
    47,
    null,
    13,
    28,
    18,
    null,
    35,
    49,
    18,
    33,
    32,
    38,
    48,
    null,
    3,
    null,
    19,
    16,
    23,
  ];

  //data = data.slice(0, -21);
  const endDay = Dates.startOfDay(Dates.endOfMonth(lastDay));
  const startDay = Dates.addDays(Dates.subYears(endDay, 1), 1);
  const interval = { start: startDay, end: endDay };

  //start more test data
  const dataInterval = {
    start: Dates.subDays(Dates.startOfDay(Dates.subYears(lastDay, 1)), 20),
    end: Dates.startOfDay(lastDay),
  };
  console.log(dataInterval);

  const data3 = Dates.eachDayOfInterval(dataInterval).map((it) =>
    Dates.getDayOfYear(it)
  );
  console.log(data3);

  //end

  data = data2;

  updateYearSelector(endDay);
  updateMonths(interval);

  const buckets = getBuckets(data);
  const getValue = (v: number | null): number => {
    if (v === null || v === 0) return 0;
    for (let b = 0; b < 4; b++) if (v <= (buckets[b] ?? 0)) return 1 + b;

    return 4;
  };

  //skip weekdays in the previous year
  for (let i = 0; i < startDay.getDay(); i++) {
    const elem = document.createElement("div");
    elem.className = "filler";
    container.appendChild(elem);
  }

  const days = Dates.differenceInDays(interval.end, interval.start) + 1;
  const offset =
    data.length -
    days +
    Math.abs(Dates.differenceInDays(interval.end, lastDay)) +
    1;

  console.log({ days, offset });

  let currentDate = startDay;
  for (let i = offset; i < days + offset; i++) {
    const elem = document.createElement("div");
    if (data[i] === undefined) {
      elem.className = "filler";
    } else {
      elem.setAttribute("data-level", getValue(data[i] ?? null).toString());
      if (data[i] !== null) {
        elem.setAttribute("data-balloon-pos", "up");
        elem.setAttribute(
          "aria-label",
          `${data[i]} tests on ${format(currentDate, "EEEE dd MMM yyyy")}`
        );
      }
    }
    container.appendChild(elem);
    currentDate = Dates.addDays(currentDate, 1);
  }
}

function updateYearSelector(startDate: Date): void {
  const selectedYear = startDate.getFullYear();
  const currentYear = new Date().getFullYear();
  const years: DataObjectPartial[] = [
    { text: currentYear.toString(), value: "current" },
  ];
  for (let year = currentYear - 1; year >= 2020; year--) {
    years.push({
      text: year.toString(),
      value: year.toString(),
      selected: year == selectedYear,
    });
  }

  new SlimSelect({
    select: "#testActivity .yearSelect",
    settings: {
      showSearch: false,
    },
    data: years,
  });
}

function getBuckets(data: (number | null)[]): number[] {
  const filtered = data.filter((it) => it !== null) as number[];
  const sorted = filtered.sort((a, b) => a - b);

  const trimmed = sorted.slice(
    Math.round(sorted.length * 0.1),
    data.length - Math.round(sorted.length * 0.1)
  );
  const sum = trimmed.reduce((a, c) => a + c, 0) as number;
  const mid = sum / trimmed.length;
  return [Math.floor(mid / 2), Math.round(mid), Math.round(mid * 1.5)];
}

function updateMonths(interval: Interval): void {
  const months = document.querySelector("#testActivity .months") as Element;

  months.innerHTML = Dates.eachMonthOfInterval(interval)
    .map((month) => `<div>${Dates.format(month, "MMM`yy")}</div>`)
    .join("");
}
