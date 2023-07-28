import {
  parse,
  parseISO,
  toDate,
  isValid,
  format,
  startOfSecond,
  startOfMinute,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  addMilliseconds,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  differenceInMilliseconds,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInQuarters,
  differenceInYears,
  endOfSecond,
  endOfMinute,
  endOfHour,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,
} from "date-fns";

const FORMATS = {
  datetime: "MMM d, yyyy, h:mm:ss aaaa",
  millisecond: "h:mm:ss.SSS aaaa",
  second: "h:mm:ss aaaa",
  minute: "h:mm aaaa",
  hour: "ha",
  day: "MMM d",
  week: "PP",
  month: "MMM yyyy",
  quarter: "qqq - yyyy",
  year: "yyyy",
};

export const dateFnsAdapter = {
  _id: "date-fns", // DEBUG

  formats: function () {
    return FORMATS;
  },

  parse: function (value, fmt) {
    if (value === null || typeof value === "undefined") {
      return null;
    }
    const type = typeof value;
    if (type === "number" || value instanceof Date) {
      value = toDate(value);
    } else if (type === "string") {
      if (typeof fmt === "string") {
        value = parse(value, fmt, new Date(), this.options);
      } else {
        value = parseISO(value, this.options);
      }
    }
    return isValid(value) ? value.getTime() : null;
  },

  format: function (time, fmt) {
    return format(time, fmt, this.options);
  },

  add: function (time, amount, unit) {
    switch (unit) {
      case "millisecond":
        return addMilliseconds(time, amount);
      case "second":
        return addSeconds(time, amount);
      case "minute":
        return addMinutes(time, amount);
      case "hour":
        return addHours(time, amount);
      case "day":
        return addDays(time, amount);
      case "week":
        return addWeeks(time, amount);
      case "month":
        return addMonths(time, amount);
      case "quarter":
        return addQuarters(time, amount);
      case "year":
        return addYears(time, amount);
      default:
        return time;
    }
  },

  diff: function (max, min, unit) {
    switch (unit) {
      case "millisecond":
        return differenceInMilliseconds(max, min);
      case "second":
        return differenceInSeconds(max, min);
      case "minute":
        return differenceInMinutes(max, min);
      case "hour":
        return differenceInHours(max, min);
      case "day":
        return differenceInDays(max, min);
      case "week":
        return differenceInWeeks(max, min);
      case "month":
        return differenceInMonths(max, min);
      case "quarter":
        return differenceInQuarters(max, min);
      case "year":
        return differenceInYears(max, min);
      default:
        return 0;
    }
  },

  startOf: function (time, unit, weekday) {
    switch (unit) {
      case "second":
        return startOfSecond(time);
      case "minute":
        return startOfMinute(time);
      case "hour":
        return startOfHour(time);
      case "day":
        return startOfDay(time);
      case "week":
        return startOfWeek(time);
      case "isoWeek":
        return startOfWeek(time, { weekStartsOn: +weekday });
      case "month":
        return startOfMonth(time);
      case "quarter":
        return startOfQuarter(time);
      case "year":
        return startOfYear(time);
      default:
        return time;
    }
  },

  endOf: function (time, unit) {
    switch (unit) {
      case "second":
        return endOfSecond(time);
      case "minute":
        return endOfMinute(time);
      case "hour":
        return endOfHour(time);
      case "day":
        return endOfDay(time);
      case "week":
        return endOfWeek(time);
      case "month":
        return endOfMonth(time);
      case "quarter":
        return endOfQuarter(time);
      case "year":
        return endOfYear(time);
      default:
        return time;
    }
  },
};
