import { join } from "path";
import { padNumbers } from "./utils/misc";
import { readFileSync, writeFileSync, existsSync } from "fs";

const SERVER_VERSION_FILE_PATH = join(__dirname, "./server.version");

function getDateVersion(): string {
  const date = new Date();

  const versionPrefix = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ];
  const versionSuffix = [date.getHours(), date.getMinutes()];

  return [versionPrefix, versionSuffix]
    .map((versionPart) => padNumbers(versionPart, 2, "0").join("."))
    .join("_");
}

function getVersion(): string {
  if (process.env.MODE === "dev") {
    return "DEVELOPMENT-VERSION";
  }

  if (existsSync(SERVER_VERSION_FILE_PATH)) {
    return readFileSync(SERVER_VERSION_FILE_PATH, "utf-8");
  }

  const serverVersion = getDateVersion();
  writeFileSync(SERVER_VERSION_FILE_PATH, serverVersion);

  return serverVersion;
}

export const version = getVersion();
