export const MILISECONDS_IN_HOUR = 3600000;
export const MILLISECONDS_IN_DAY = 86400000;

/**
 * Returns the timestamp of the start of the day for the given timestamp adjusted by the offset.
 * @param timestamp The timestamp for which to get the start of the day.
 * @param offsetMilis The offset in milliseconds. Default is 0.
 * @returns The timestamp of the start of the day for the given timestamp adjusted by the offset.
 */
export function getStartOfDayTimestamp(
  timestamp: number,
  offsetMilis = 0,
): number {
  return timestamp - ((timestamp - offsetMilis) % MILLISECONDS_IN_DAY);
}

/**
 * Returns the current day's start timestamp adjusted by the hour offset.
 * @param hourOffset The offset in hours. Default is 0.
 * @returns The timestamp of the start of the current day adjusted by the hour offset.
 */
export function getCurrentDayTimestamp(hourOffset = 0): number {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const currentTime = Date.now();
  return getStartOfDayTimestamp(currentTime, offsetMilis);
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
    offsetMilis,
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
 * Gets the timestamp of the start of the week for the given timestamp.
 * @param timestamp The timestamp for which to get the start of the week.
 * @returns The timestamp of the start of the week for the given timestamp.
 */
export function getStartOfWeekTimestamp(timestamp: number): number {
  const date = new Date(getStartOfDayTimestamp(timestamp));

  const monday = date.getDate() - (date.getDay() || 7) + 1;
  date.setDate(monday);

  return getStartOfDayTimestamp(date.getTime());
}

/**
 * Gets the current week's start timestamp.
 * @returns The timestamp of the start of the current week.
 */
export function getCurrentWeekTimestamp(): number {
  const currentTime = Date.now();
  return getStartOfWeekTimestamp(currentTime);
}

/**
 * Gets the timestamp of the start of the last week.
 * @returns The timestamp of the start of the last week.
 */
export function getLastWeekTimestamp(): number {
  const currentTime = Date.now();
  const lastWeekTime = currentTime - 7 * MILLISECONDS_IN_DAY;
  return getStartOfWeekTimestamp(lastWeekTime);
}
