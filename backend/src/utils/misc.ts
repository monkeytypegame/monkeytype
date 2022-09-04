import _ from "lodash";
import uaparser from "ua-parser-js";

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

export function identity(value: any): string {
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

interface AgentLog {
  ip: string | string[];
  agent: string;
  device?: string;
}

export function buildAgentLog(req: MonkeyTypes.Request): AgentLog {
  const agent = uaparser(req.headers["user-agent"]);

  const agentLog: AgentLog = {
    ip:
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip ||
      "255.255.255.255",
    agent: `${agent.os.name} ${agent.os.version} ${agent.browser.name} ${agent.browser.version}`,
  };

  const {
    device: { vendor, model, type },
  } = agent;
  if (vendor) {
    agentLog.device = `${vendor} ${model} ${type}`;
  }

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

export const MILLISECONDS_IN_DAY = 86400000;

export function getStartOfDayTimestamp(timestamp: number): number {
  return timestamp - (timestamp % MILLISECONDS_IN_DAY);
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
  obj: Record<string, any>,
  prefix = ""
): Record<string, any> {
  const result: Record<string, any> = {};
  const keys = Object.keys(obj);

  keys.forEach((key) => {
    const value = obj[key];

    const newPrefix = prefix.length > 0 ? `${prefix}.${key}` : key;

    if (_.isPlainObject(value)) {
      const flattened = flattenObjectDeep(value);
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
  if (!str) {
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
    suffixes[(lastTwo - 20) % 10] || suffixes[lastTwo] || suffixes[0];
  return `${number}${suffix}`;
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
