import _ from "lodash";
import uaparser from "ua-parser-js";

//todo split this file into smaller util files (grouped by functionality)

export function roundTo2(num: number): number {
  return _.round(num, 2);
}

export function stdDev(population: number[]): number {
  const n = population.length;
  if (n === 0) {
    return 0;
  }

  const populationMean = mean(population);
  const variance = _.sumBy(population, (x) => (x - populationMean) ** 2) / n;

  return Math.sqrt(variance);
}

export function mean(population: number[]): number {
  const n = population.length;
  return n > 0 ? _.sum(population) / n : 0;
}

export function kogasa(cov: number): number {
  return (
    100 * (1 - Math.tanh(cov + Math.pow(cov, 3) / 3 + Math.pow(cov, 5) / 5))
  );
}

export function identity(value: unknown): string {
  return Object.prototype.toString
    .call(value)
    .replace(/^\[object\s+([a-z]+)\]$/i, "$1")
    .toLowerCase();
}

export function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

export function base64UrlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString();
}

type AgentLog = {
  ip: string;
  agent: string;
  device?: string;
};

export function buildAgentLog(req: MonkeyTypes.Request): AgentLog {
  const agent = uaparser(req.headers["user-agent"]);

  const agentLog: AgentLog = {
    ip:
      (req.headers["cf-connecting-ip"] as string) ||
      (req.headers["x-forwarded-for"] as string) ||
      (req.ip as string) ||
      "255.255.255.255",
    agent: `${agent.os.name} ${agent.os.version} ${agent.browser.name} ${agent.browser.version}`,
  };

  const {
    device: { vendor, model, type },
  } = agent;

  agentLog.device = `${vendor ?? "unknown vendor"} ${
    model ?? "unknown model"
  } ${type ?? "unknown type"}`;

  return agentLog;
}

export function padNumbers(
  numbers: number[],
  maxLength: number,
  fillString: string
): string[] {
  return numbers.map((number) =>
    number.toString().padStart(maxLength, fillString)
  );
}

export const MILISECONDS_IN_HOUR = 3600000;
export const MILLISECONDS_IN_DAY = 86400000;

export function getStartOfDayTimestamp(
  timestamp: number,
  offsetMilis = 0
): number {
  return timestamp - ((timestamp - offsetMilis) % MILLISECONDS_IN_DAY);
}

export function getCurrentDayTimestamp(): number {
  const currentTime = Date.now();
  return getStartOfDayTimestamp(currentTime);
}

export function matchesAPattern(text: string, pattern: string): boolean {
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(text);
}

export function kogascore(wpm: number, acc: number, timestamp: number): number {
  const normalizedWpm = Math.floor(wpm * 100);
  const normalizedAcc = Math.floor(acc * 100);

  const padAmount = 100000;
  const firstPart = (padAmount + normalizedWpm) * padAmount;
  const secondPart = (firstPart + normalizedAcc) * padAmount;

  const currentDayTimeMilliseconds =
    timestamp - (timestamp % MILLISECONDS_IN_DAY);
  const todayMilliseconds = timestamp - currentDayTimeMilliseconds;

  return (
    secondPart + Math.floor((MILLISECONDS_IN_DAY - todayMilliseconds) / 1000)
  );
}

export function flattenObjectDeep(
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const keys = Object.keys(obj);

  keys.forEach((key) => {
    const value = obj[key];

    const newPrefix = prefix.length > 0 ? `${prefix}.${key}` : key;

    if (_.isPlainObject(value)) {
      const flattened = flattenObjectDeep(value as Record<string, unknown>);
      const flattenedKeys = Object.keys(flattened);

      if (flattenedKeys.length === 0) {
        result[newPrefix] = value;
      }

      flattenedKeys.forEach((flattenedKey) => {
        result[`${newPrefix}.${flattenedKey}`] = flattened[flattenedKey];
      });
    } else {
      result[newPrefix] = value;
    }
  });

  return result;
}

export function sanitizeString(str: string | undefined): string | undefined {
  if (str === undefined || str === "") {
    return str;
  }

  return str
    .replace(/[\u0300-\u036F]/g, "")
    .trim()
    .replace(/\s{3,}/g, "  ");
}

const suffixes = ["th", "st", "nd", "rd"];

export function getOrdinalNumberString(number: number): string {
  const lastTwo = number % 100;
  const suffix =
    suffixes[(lastTwo - 20) % 10] ?? suffixes[lastTwo] ?? suffixes[0];
  return `${number}${suffix}`;
}

export function isYesterday(timestamp: number, hourOffset = 0): boolean {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const yesterday = getStartOfDayTimestamp(
    Date.now() - MILLISECONDS_IN_DAY,
    offsetMilis
  );
  const date = getStartOfDayTimestamp(timestamp, offsetMilis);

  return yesterday === date;
}

export function isToday(timestamp: number, hourOffset = 0): boolean {
  const offsetMilis = hourOffset * MILISECONDS_IN_HOUR;
  const today = getStartOfDayTimestamp(Date.now(), offsetMilis);
  const date = getStartOfDayTimestamp(timestamp, offsetMilis);

  return today === date;
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp = false
): number {
  if (inMin === inMax) {
    return outMin;
  }

  const result =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  if (clamp) {
    if (outMin < outMax) {
      return Math.min(Math.max(result, outMin), outMax);
    } else {
      return Math.max(Math.min(result, outMin), outMax);
    }
  }

  return result;
}

export function getStartOfWeekTimestamp(timestamp: number): number {
  const date = new Date(getStartOfDayTimestamp(timestamp));

  const monday = date.getDate() - (date.getDay() || 7) + 1;
  date.setDate(monday);

  return getStartOfDayTimestamp(date.getTime());
}

export function getCurrentWeekTimestamp(): number {
  const currentTime = Date.now();
  return getStartOfWeekTimestamp(currentTime);
}

type TimeUnit =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

export const MINUTE_IN_SECONDS = 1 * 60;
export const HOUR_IN_SECONDS = 1 * 60 * MINUTE_IN_SECONDS;
export const DAY_IN_SECONDS = 1 * 24 * HOUR_IN_SECONDS;
export const WEEK_IN_SECONDS = 1 * 7 * DAY_IN_SECONDS;
export const MONTH_IN_SECONDS = 1 * 30.4167 * DAY_IN_SECONDS;
export const YEAR_IN_SECONDS = 1 * 12 * MONTH_IN_SECONDS;

export function formatSeconds(
  seconds: number
): `${number} ${TimeUnit}${"s" | ""}` {
  let unit: TimeUnit;
  let secondsInUnit: number;

  if (seconds < MINUTE_IN_SECONDS) {
    unit = "second";
    secondsInUnit = 1;
  } else if (seconds < HOUR_IN_SECONDS) {
    unit = "minute";
    secondsInUnit = MINUTE_IN_SECONDS;
  } else if (seconds < DAY_IN_SECONDS) {
    unit = "hour";
    secondsInUnit = HOUR_IN_SECONDS;
  } else if (seconds < WEEK_IN_SECONDS) {
    unit = "day";
    secondsInUnit = DAY_IN_SECONDS;
  } else if (seconds < YEAR_IN_SECONDS) {
    if (seconds < WEEK_IN_SECONDS * 4) {
      unit = "week";
      secondsInUnit = WEEK_IN_SECONDS;
    } else {
      unit = "month";
      secondsInUnit = MONTH_IN_SECONDS;
    }
  } else {
    unit = "year";
    secondsInUnit = YEAR_IN_SECONDS;
  }

  const normalized = roundTo2(seconds / secondsInUnit);

  return `${normalized} ${unit}${normalized > 1 ? "s" : ""}`;
}

export function intersect<T>(a: T[], b: T[], removeDuplicates = false): T[] {
  let t;
  if (b.length > a.length) (t = b), (b = a), (a = t); // indexOf to loop over shorter
  const filtered = a.filter(function (e) {
    return b.includes(e);
  });
  return removeDuplicates ? [...new Set(filtered)] : filtered;
}

export function stringToNumberOrDefault(
  string: string,
  defaultValue: number
): number {
  if (string === undefined) return defaultValue;
  const value = parseInt(string, 10);
  if (!Number.isFinite(value)) return defaultValue;
  return value;
}

export function isDevEnvironment(): boolean {
  return process.env["MODE"] === "dev";
}
