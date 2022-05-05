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

export function identity(value: string): string {
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
