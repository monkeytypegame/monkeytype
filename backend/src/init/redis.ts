import fs from "fs";
import _ from "lodash";
import { join } from "path";
import IORedis, { Redis } from "ioredis";
import Logger from "../utils/logger";
import { isDevEnvironment } from "../utils/misc";
import { getErrorMessage } from "../utils/error";

// Define Redis connection with custom methods for type safety
export type RedisConnectionWithCustomMethods = Redis & {
  addResult: (
    keyCount: number,
    scoresKey: string,
    resultsKey: string,
    maxResults: number,
    expirationTime: number,
    uid: string,
    score: number,
    data: string
  ) => Promise<number>;
  addResultIncrement: (
    keyCount: number,
    scoresKey: string,
    resultsKey: string,
    expirationTime: number,
    uid: string,
    score: number,
    data: string
  ) => Promise<number>;
  getResults: (
    keyCount: number,
    scoresKey: string,
    resultsKey: string,
    minRank: number,
    maxRank: number,
    withScores: string
  ) => Promise<[string[], string[]]>;
  purgeResults: (
    keyCount: number,
    uid: string,
    namespace: string
  ) => Promise<void>;
};

let connection: IORedis.Redis;
let connected = false;

const REDIS_SCRIPTS_DIRECTORY_PATH = join(__dirname, "../../redis-scripts");

function loadScripts(client: IORedis.Redis): void {
  const scriptFiles = fs.readdirSync(REDIS_SCRIPTS_DIRECTORY_PATH);

  scriptFiles.forEach((scriptFile) => {
    const scriptPath = join(REDIS_SCRIPTS_DIRECTORY_PATH, scriptFile);
    const scriptSource = fs.readFileSync(scriptPath, "utf-8");
    const scriptName = _.camelCase(scriptFile.split(".")[0]);

    client.defineCommand(scriptName, {
      lua: scriptSource,
    });
  });
}

export async function connect(): Promise<void> {
  if (connected) {
    return;
  }

  const { REDIS_URI } = process.env;

  if (!(REDIS_URI ?? "")) {
    if (isDevEnvironment()) {
      Logger.warning("No redis configuration provided. Running without redis.");
      return;
    }
    throw new Error("No redis configuration provided");
  }

  connection = new IORedis(REDIS_URI, {
    maxRetriesPerRequest: null, // These options are required for BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  try {
    await connection.connect();

    Logger.info("Loading custom redis scripts...");
    loadScripts(connection);

    connected = true;
  } catch (error) {
    Logger.error(getErrorMessage(error) ?? "Unknown error");
    if (isDevEnvironment()) {
      await connection.quit();
      Logger.warning(
        `Failed to connect to redis. Continuing in dev mode, running without redis.`
      );
    } else {
      Logger.error(
        "Failed to connect to redis. Exiting with exit status code 1."
      );
      process.exit(1);
    }
  }
}

export function isConnected(): boolean {
  return connected;
}

export function getConnection(): RedisConnectionWithCustomMethods | null {
  const status = connection?.status;
  if (connection === undefined || status !== "ready") {
    return null;
  }

  return connection as RedisConnectionWithCustomMethods;
}
