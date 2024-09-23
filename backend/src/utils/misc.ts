import { MILLISECONDS_IN_DAY } from "@monkeytype/util/date-and-time";
import { roundTo2 } from "@monkeytype/util/numbers";
import _, { omit } from "lodash";
import uaparser from "ua-parser-js";
import { MonkeyRequest } from "../api/types";
import { ObjectId } from "mongodb";

//todo split this file into smaller util files (grouped by functionality)

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

export function buildAgentLog(req: MonkeyRequest): AgentLog {
  const agent = uaparser(req.raw.headers["user-agent"]);

  const agentLog: AgentLog = {
    ip:
      (req.raw.headers["cf-connecting-ip"] as string) ||
      (req.raw.headers["x-forwarded-for"] as string) ||
      (req.raw.ip as string) ||
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
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{3,}/g, "  ");
}

const suffixes = ["th", "st", "nd", "rd"];

export function getOrdinalNumberString(number: number): string {
  const lastTwo = number % 100;
  const suffix =
    suffixes[(lastTwo - 20) % 10] ?? suffixes[lastTwo] ?? suffixes[0];
  return `${number}${suffix}`;
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

export function isDevEnvironment(): boolean {
  return process.env["MODE"] === "dev";
}

/**
 * convert database object into api object
 * @param data  database object with `_id: ObjectId`
 * @returns api object with `id: string`
 */
export function replaceObjectId<T extends { _id: ObjectId }>(
  data: T
): T & { _id: string };
export function replaceObjectId<T extends { _id: ObjectId }>(
  data: T | null
): (T & { _id: string }) | null;
export function replaceObjectId<T extends { _id: ObjectId }>(
  data: T | null
): (T & { _id: string }) | null {
  if (data === null) {
    return null;
  }
  const result = {
    _id: data._id.toString(),
    ...omit(data, "_id"),
  } as T & { _id: string };
  return result;
}

/**
 * convert database objects into api objects
 * @param data  database objects with `_id: ObjectId`
 * @returns api objects with `id: string`
 */
export function replaceObjectIds<T extends { _id: ObjectId }>(
  data: T[]
): (T & { _id: string })[] {
  if (data === undefined) return data;
  return data.map((it) => replaceObjectId(it));
}
export type WithObjectId<T extends { _id: string }> = Omit<T, "_id"> & {
  _id: ObjectId;
};
