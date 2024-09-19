import fs from "fs";
import _ from "lodash";
import { join } from "path";
import IORedis from "ioredis";
import Logger from "../utils/logger";
import { isDevEnvironment } from "../utils/misc";
import { getErrorMessage } from "../utils/error";

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

export function getConnection(): IORedis.Redis | undefined {
  const status = connection?.status;
  if (connection === undefined || status !== "ready") {
    return undefined;
  }

  return connection;
}
