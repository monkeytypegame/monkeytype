import { roundTo2 } from "./numbers";

/**
 * Returns the current day's timestamp adjusted by the hour offset.
 * @param hourOffset The offset in hours. Default is 0.
 * @returns The timestamp of the start of the current day adjusted by the hour offset.
 */
export function getCurrentDayTimestamp(hourOffset = 0): number {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const currentTime = Date.now();
  return getStartOfDayTimestamp(currentTime, offsetMilis);
}

const MILISECONDS_IN_HOUR = 3600000;
const MILLISECONDS_IN_DAY = 86400000;

/**
 * Returns the timestamp of the start of the day for the given timestamp adjusted by the offset.
 * @param timestamp The timestamp for which to get the start of the day.
 * @param offsetMilis The offset in milliseconds. Default is 0.
 * @returns The timestamp of the start of the day for the given timestamp adjusted by the offset.
 */
export function getStartOfDayTimestamp(
  timestamp: number,
  offsetMilis = 0
): number {
  return timestamp - ((timestamp - offsetMilis) % MILLISECONDS_IN_DAY);
}

/**
 * Checks if the given timestamp is from yesterday, adjusted by the hour offset.
 * @param timestamp The timestamp to check.
 * @param hourOffset The offset in hours. Default is 0.
 * @returns True if the timestamp is from yesterday, false otherwise.
 */
export function isYesterday(timestamp: number, hourOffset = 0): boolean {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const yesterday = getStartOfDayTimestamp(
    Date.now() - MILLISECONDS_IN_DAY,
    offsetMilis
  );
  const date = getStartOfDayTimestamp(timestamp, offsetMilis);

  return yesterday === date;
}

/**
 * Checks if the given timestamp is from today, adjusted by the hour offset.
 * @param timestamp The timestamp to check.
 * @param hourOffset The offset in hours. Default is 0.
 * @returns True if the timestamp is from today, false otherwise.
 */
export function isToday(timestamp: number, hourOffset = 0): boolean {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const today = getStartOfDayTimestamp(Date.now(), offsetMilis);
  const date = getStartOfDayTimestamp(timestamp, offsetMilis);

  return today === date;
}

/**
 * Converts seconds to a human-readable string representation of time.
 * @param sec The number of seconds to convert.
 * @param alwaysShowMinutes Whether to always show minutes, even if the value is 0. Default is false.
 * @param alwaysShowHours Whether to always show hours, even if the value is 0. Default is false.
 * @param delimiter The delimiter to use between time components. Default is ":".
 * @param showSeconds Whether to show seconds. Default is true.
 * @param showDays Whether to show days. Default is false.
 * @returns A human-readable string representation of the time.
 */
export function secondsToString(
  sec: number,
  alwaysShowMinutes = false,
  alwaysShowHours = false,
  delimiter: ":" | "text" = ":",
  showSeconds = true,
  showDays = false
): string {
  sec = Math.abs(sec);
  let days = 0;
  let hours;
  if (showDays) {
    days = Math.floor(sec / 86400);
    hours = Math.floor((sec % 86400) / 3600);
  } else {
    hours = Math.floor(sec / 3600);
  }
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = roundTo2((sec % 3600) % 60);

  let daysString;
  let hoursString;
  let minutesString;
  let secondsString;

  if (showDays) {
    days < 10 && delimiter !== "text"
      ? (daysString = "0" + days)
      : (daysString = days);
  }
  hours < 10 && delimiter !== "text"
    ? (hoursString = "0" + hours)
    : (hoursString = hours);
  minutes < 10 && delimiter !== "text"
    ? (minutesString = "0" + minutes)
    : (minutesString = minutes);
  seconds < 10 &&
  (minutes > 0 || hours > 0 || alwaysShowMinutes) &&
  delimiter !== "text"
    ? (secondsString = "0" + seconds)
    : (secondsString = seconds);

  let ret = "";
  if (days > 0 && showDays) {
    ret += daysString;
    if (delimiter === "text") {
      if (days === 1) {
        ret += " day ";
      } else {
        ret += " days ";
      }
    } else {
      ret += delimiter;
    }
  }
  if (hours > 0 || alwaysShowHours) {
    ret += hoursString;
    if (delimiter === "text") {
      if (hours === 1) {
        ret += " hour ";
      } else {
        ret += " hours ";
      }
    } else {
      ret += delimiter;
    }
  }
  if (minutes > 0 || hours > 0 || alwaysShowMinutes) {
    ret += minutesString;
    if (delimiter === "text") {
      if (minutes === 1) {
        ret += " minute ";
      } else {
        ret += " minutes ";
      }
    } else if (showSeconds) {
      ret += delimiter;
    }
  }
  if (showSeconds) {
    ret += secondsString;
    if (delimiter === "text") {
      if (seconds === 1) {
        ret += " second";
      } else {
        ret += " seconds";
      }
    }
  }
  if (hours === 0 && minutes === 0 && !showSeconds && delimiter === "text") {
    ret = "less than 1 minute";
  }
  return ret.trim();
}
