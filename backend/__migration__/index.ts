import "dotenv/config";
import * as DB from "../src/init/db";
import { Db } from "mongodb";
import readlineSync from "readline-sync";
import { FunboxResult } from "./funboxResult";

const batchSize = 100_000;
let appRunning = true;
let db: Db | undefined;
const migration = new FunboxResult();
const delay = 1_000;

const sleep = (durationMs): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
};

process.on("SIGINT", () => {
  console.log("\nshutting down...");
  appRunning = false;
});

if (require.main === module) {
  void main();
}

async function main(): Promise<void> {
  try {
    console.log(
      `Connecting to database ${process.env["DB_NAME"]} on ${process.env["DB_URI"]}...`
    );

    if (
      !readlineSync.keyInYN(`Ready to start migration  ${migration.name} ?`)
    ) {
      appRunning = false;
    }

    if (appRunning) {
      await DB.connect();
      console.log("Connected to database");
      db = DB.getDb();
      if (db === undefined) {
        throw Error("db connection failed");
      }

      console.log(`Running migration ${migration.name}`);

      await migrate();
    }

    console.log(`\nMigration ${appRunning ? "done" : "aborted"}.`);
  } catch (e) {
    console.log("error occured:", { e });
  } finally {
    await DB.close();
  }
}

export async function migrate(): Promise<void> {
  await migration.setup(db as Db);

  const remainingCount = await migration.getRemainingCount();
  if (remainingCount === 0) {
    console.log("No documents to migrate.");
    return;
  } else {
    console.log("Documents to migrate:", remainingCount);
  }

  console.log(
    `Migrating ~${remainingCount} documents using batchSize=${batchSize}`
  );

  let count = 0;
  const start = new Date().valueOf();

  do {
    const t0 = Date.now();

    const migratedCount = await migration.migrate({ batchSize });

    //progress tracker
    count += migratedCount;
    updateProgress(remainingCount, count, start, Date.now() - t0);
    if (delay) {
      await sleep(delay);
    }
  } while (remainingCount - count > 0 && appRunning);

  if (appRunning) {
    updateProgress(100, 100, start, 0);
    const left = await migration.getRemainingCount();
    if (left !== 0) {
      console.log(
        `After migration there are ${left} unmigrated documents left. You might want to run the migration again.`
      );
    }
  }
}
function updateProgress(
  all: number,
  current: number,
  start: number,
  previousBatchSizeTime: number
): void {
  const percentage = (current / all) * 100;
  const timeLeft = Math.round(
    (((new Date().valueOf() - start) / percentage) * (100 - percentage)) / 1000
  );

  process.stdout.clearLine?.(0);
  process.stdout.cursorTo?.(0);
  process.stdout.write(
    `Previous batch took ${Math.round(previousBatchSizeTime)}ms (~${
      previousBatchSizeTime / batchSize
    }ms per document) ${Math.round(
      percentage
    )}% done, estimated time left ${timeLeft} seconds.`
  );
}
