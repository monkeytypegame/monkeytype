import type { Interval } from "date-fns/types";
import { UTCDateMini } from "@date-fns/utc/date/mini";
import {
  format,
  endOfMonth,
  subYears,
  addDays,
  differenceInDays,
  eachMonthOfInterval,
  isSameDay,
  isBefore,
} from "date-fns";

export class TestActivityCalendar implements MonkeyTypes.TestActivityCalendar {
  protected data: (number | null | undefined)[];
  protected startDay: Date;
  protected endDay: Date;

  constructor(data: (number | null)[], lastDay: Date) {
    const local = new UTCDateMini(lastDay);
    const interval = this.getInterval(local);
    this.startDay = interval.start as Date;
    this.endDay = interval.end as Date;
    this.data = this.buildData(data, local);
  }

  protected getInterval(lastDay: Date): Interval {
    const end = endOfMonth(lastDay);
    const start = addDays(subYears(end, 1), 1);
    /*
    console.log({
      offset: new Date().getTimezoneOffset() / 60,
      lastDay: format(lastDay, "EEEE dd MMM yyyy"),
      lastDayValue: lastDay.valueOf(),
      end: format(end, "EEEE dd MMM yyyy"),
      start: format(start, "EEEE dd MMM yyyy"),
    });
    */
    return { start, end };
  }

  protected buildData(
    data: (number | null | undefined)[],
    lastDay: Date
  ): (number | null | undefined)[] {
    //fill calendar with enough values
    const values = new Array(Math.max(0, 386 - data.length)).fill(undefined);
    values.push(...data);

    //discard values outside the calendar range
    const days = differenceInDays(this.endDay, this.startDay) + 1;
    const offset =
      values.length - days + differenceInDays(this.endDay, lastDay);
    return values.slice(offset);
  }

  getMonths(): string[] {
    return eachMonthOfInterval({
      start: this.startDay,
      end: this.endDay,
    }).map((month) => format(month, "MMM`yy"));
  }

  getDays(): MonkeyTypes.TestActivityDay[] {
    const result: MonkeyTypes.TestActivityDay[] = [];

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

    const days = differenceInDays(this.endDay, this.startDay) + 1;

    let currentDate = this.startDay;
    for (let i = 0; i < days; i++) {
      const count = this.data[i];
      /*
      console.log({
        i,
        count,
        date: format(currentDate, "EEEE dd MMM yyyy"),
      });
      */
      result.push({
        level: getValue(count),
        label:
          this.data[i] !== undefined && this.data[i] !== null
            ? `${count} ${count == 1 ? "test" : "tests"} on ${format(
                currentDate,
                "EEEE dd MMM yyyy"
              )}`
            : undefined,
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

  private getBuckets(): number[] {
    const filtered = this.data.filter(
      (it) => it !== null && it !== undefined
    ) as number[];
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
    if (isSameDay(date, this.lastDay)) {
      const last = this.data.length - 1;
      this.data[last] = (this.data[last] || 0) + 1;
    } else if (isBefore(date, this.lastDay)) {
      throw new Error("cannot alter data in the past.");
    } else {
      const missedDays = differenceInDays(date, this.lastDay) - 1;
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
}
