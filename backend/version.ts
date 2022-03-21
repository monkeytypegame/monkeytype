import { padNumbers } from "./utils/misc";

function getDateVersion(): string {
  const date = new Date();

  const versionPrefix = padNumbers(
    [date.getFullYear(), date.getMonth() + 1, date.getDate()],
    2,
    "0"
  ).join(".");
  const versionSuffix = padNumbers(
    [date.getHours(), date.getMinutes()],
    2,
    "0"
  ).join(".");

  return [versionPrefix, versionSuffix].join("_");
}

function getVersion(): string {
  if (process.env.MODE !== "dev") {
    return getDateVersion();
  }

  return "DEVELOPMENT-VERSION";
}

export const version = getVersion();
