import "dotenv/config";
import * as DB from "../src/init/db";
import { Collection, Filter } from "mongodb";

import readlineSync from "readline-sync";
import { DBUser } from "../src/dal/user";

type MigrationDBUser = DBUser & {
  lastReultHashes?: string[];
};

const batchSize = 1000;

let appRunning = true;
let userCollection: Collection<MigrationDBUser>;

// Only documents that still carry the misspelled field need migrating.
const filter: Filter<MigrationDBUser> = { lastReultHashes: { $exists: true } };

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
      `Connecting to database ${process.env["DB_NAME"]} on ${process.env["DB_URI"]}...`,
    );

    if (!readlineSync.keyInYN("Ready to start migration?")) {
      appRunning = false;
    }

    if (appRunning) {
      await DB.connect();
      console.log("Connected to database");
      await migrate();
    }

    console.log(`\nMigration ${appRunning ? "done" : "aborted"}.`);
  } catch (e) {
    console.log("error occurred:", { e });
  } finally {
    await DB.close();
  }
}

export async function migrate(): Promise<void> {
  userCollection = DB.collection("users");

  const totalCount = await userCollection.countDocuments(filter);
  if (totalCount === 0) {
    console.log("No users to migrate — nothing to do.");
    return;
  }

  console.log(`Users to migrate: ${totalCount}`);
  console.log(
    `Migrating in batches of ${batchSize} using $rename to fix the lastReultHashes typo...`,
  );

  let migrated = 0;
  const start = Date.now();

  // Process in batches: fetch a page of matching UIDs, rename the field on
  // those documents, then repeat until none remain.
  while (appRunning) {
    const t0 = Date.now();

    const uids = await userCollection
      .find(filter, { limit: batchSize })
      .project({ uid: 1, _id: 0 })
      .toArray()
      .then((docs) => docs.map((d) => d["uid"] as string));

    if (uids.length === 0) break;

    // $rename atomically renames the field inside each matched document.
    // Documents that never had the misspelled field are unaffected.
    await userCollection.updateMany(
      { uid: { $in: uids } },
      { $rename: { lastReultHashes: "lastResultHashes" } },
    );

    migrated += uids.length;
    updateProgress(totalCount, migrated, start, Date.now() - t0);
  }

  if (appRunning) {
    updateProgress(totalCount, totalCount, start, 0);
    console.log(`\nMigration complete. ${migrated} users updated.`);
  }
}

function updateProgress(
  all: number,
  current: number,
  start: number,
  previousBatchTime: number,
): void {
  const percentage = (current / all) * 100;
  const elapsed = Date.now() - start;
  const timeLeft =
    percentage > 0
      ? Math.round(((elapsed / percentage) * (100 - percentage)) / 1000)
      : 0;

  process.stdout.clearLine?.(0);
  process.stdout.cursorTo?.(0);
  process.stdout.write(
    `Previous batch took ${Math.round(previousBatchTime)}ms | ` +
      `${Math.round(percentage)}% done | ` +
      `estimated time left: ${timeLeft}s`,
  );
}
