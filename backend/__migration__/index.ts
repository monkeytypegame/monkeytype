import "dotenv/config";
import * as DB from "../src/init/db";
import { Db } from "mongodb";
import readlineSync from "readline-sync";
import { funboxResult } from "./funboxResult";

const batchSize = 50;
let appRunning = true;
let db: Db | undefined;
const migration = new funboxResult();

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

  await migrateResults();
}

async function migrateResults(): Promise<void> {
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
  } while (remainingCount - count > 0 && appRunning);

  if (appRunning) updateProgress(100, 100, start, 0);
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
