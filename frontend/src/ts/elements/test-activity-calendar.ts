import { UTCDateMini } from "@date-fns/utc/date/mini";
import {
  format,
  endOfMonth,
  addDays,
  differenceInDays,
  eachMonthOfInterval,
  isSameDay,
  isBefore,
  endOfYear,
  startOfYear,
  differenceInWeeks,
  startOfMonth,
  nextSunday,
  previousSunday,
  isSunday,
  nextSaturday,
  isSaturday,
  subWeeks,
  Interval,
} from "date-fns";

export class TestActivityCalendar implements MonkeyTypes.TestActivityCalendar {
  protected data: (number | null | undefined)[];
  protected startDay: Date;
  protected endDay: Date;
  protected isFullYear: boolean;

  constructor(
    data: (number | null | undefined)[],
    lastDay: Date,
    fullYear = false
  ) {
    const local = new UTCDateMini(lastDay);
    const interval = this.getInterval(local, fullYear);

    this.startDay = interval.start as Date;
    this.endDay = interval.end as Date;
    this.data = this.buildData(data, local);
    this.isFullYear = fullYear;
  }

  protected getInterval(lastDay: Date, fullYear = false): Interval {
    const end = fullYear ? endOfYear(lastDay) : new Date();
    let start = startOfYear(lastDay);
    if (!fullYear) {
      //show the last 52 weeks. Not using one year to avoid the graph to show 54 weeks
      start = addDays(subWeeks(end, 52), 1);
      if (!isSunday(start)) start = previousSunday(start);
    }

    return { start, end };
  }

  protected buildData(
    data: (number | null | undefined)[],
    lastDay: Date
  ): (number | null | undefined)[] {
    //fill calendar with enough values
    const values: (number | null | undefined)[] = new Array(
      Math.max(0, 386 - data.length)
    ).fill(undefined);
    values.push(...data);

    //discard values outside the calendar range
    const days = differenceInDays(this.endDay, this.startDay) + 1;
    const offset =
      values.length - days + differenceInDays(this.endDay, lastDay);
    return values.slice(offset);
  }

  getMonths(): MonkeyTypes.TestActivityMonth[] {
    const months: Date[] = eachMonthOfInterval({
      start: this.startDay,
      end: this.endDay,
    });
    const results: MonkeyTypes.TestActivityMonth[] = [];

    for (let i = 0; i < months.length; i++) {
      const month: Date = months[i] as Date;
      let start = i === 0 ? this.startDay : startOfMonth(month);
      let end = i === months.length - 1 ? this.endDay : endOfMonth(start);

      if (!isSunday(start)) {
        start = (i === 0 ? previousSunday : nextSunday)(start);
      }
      if (!isSaturday(end)) {
        end = nextSaturday(end);
      }

      const weeks = differenceInWeeks(end, start, { roundingMethod: "ceil" });
      if (weeks > 2) {
        results.push({
          text: format(month, "MMM").toLowerCase(),
          weeks: weeks,
        });
      } else if (i == 0) {
        results.push({ text: "", weeks: weeks });
      }
    }
    return results;
  }

  getDays(): MonkeyTypes.TestActivityDay[] {
    const result: MonkeyTypes.TestActivityDay[] = [];
    const buckets = this.getBuckets();
    const getValue = (v: number | null | undefined): string => {
      if (v === undefined) return "0";
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

    const days = differenceInDays(this.endDay, this.startDay);

    let currentDate = this.startDay;
    for (let i = 0; i <= days; i++) {
      const count = this.data[i];
      const day = format(currentDate, "EEEE dd MMM yyyy");

      result.push({
        level: getValue(count),
        label:
          count !== undefined && count !== null
            ? `${count} ${count == 1 ? "test" : "tests"} on ${day}`
            : `no activity on ${day}`,
      });
      currentDate = addDays(currentDate, 1);
    }

    //add weekdays missing
    for (let i = this.endDay.getDay(); i < 6; i++) {
      result.push({
        level: "filler",
      });
    }

    return result;
  }

  getTotalTests(): number {
    const days = differenceInDays(this.endDay, this.startDay);
    return (
      this.data.slice(0, days + 1).reduce((a, c) => {
        return (a ?? 0) + (c ?? 0);
      }, 0) ?? 0
    );
  }

  private getBuckets(): number[] {
    const filtered = this.data.filter((it) => it !== null && it !== undefined);
    const sorted = filtered.sort((a, b) => a - b);

    const trimmed = sorted.slice(
      Math.round(sorted.length * 0.1),
      sorted.length - Math.round(sorted.length * 0.1)
    );
    const sum = trimmed.reduce((a, c) => a + c, 0);
    const mid = sum / trimmed.length;
    return [Math.floor(mid / 2), Math.round(mid), Math.round(mid * 1.5)];
  }
}

export class ModifiableTestActivityCalendar
  extends TestActivityCalendar
  implements MonkeyTypes.ModifiableTestActivityCalendar
{
  private lastDay: Date;

  constructor(data: (number | null)[], lastDay: Date) {
    super(data, lastDay);
    this.lastDay = new UTCDateMini(lastDay);
  }

  increment(utcDate: Date): void {
    const date = new UTCDateMini(utcDate);
    const lastDay = new UTCDateMini(this.lastDay);
    if (isSameDay(date, lastDay)) {
      const last = this.data.length - 1;
      this.data[last] = (this.data[last] || 0) + 1;
    } else if (isBefore(date, lastDay)) {
      throw new Error("cannot alter data in the past.");
    } else {
      const missedDays = differenceInDays(date, lastDay) - 1;
      for (let i = 0; i < missedDays; i++) {
        this.data.push(undefined);
      }
      this.data.push(1);
      //update timeframe
      const interval = this.getInterval(date);
      this.startDay = interval.start as Date;
      this.endDay = interval.end as Date;
      this.lastDay = date;
    }

    this.data = this.buildData(this.data, this.lastDay);
  }

  getFullYearCalendar(): MonkeyTypes.TestActivityCalendar {
    const today = new Date();
    if (this.lastDay.getFullYear() !== new UTCDateMini(today).getFullYear()) {
      return new TestActivityCalendar([], today, true);
    } else {
      return new TestActivityCalendar(this.data, this.lastDay, true);
    }
  }
}
