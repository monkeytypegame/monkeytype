import "dotenv/config";
import * as DB from "../src/init/db";

let db;
let userCollection, resultCollection;

const filter = { testsByYearAndDay: { $exists: false } };

async function main(): Promise<void> {
  try {
    console.log(
      `Connecting to database ${process.env["DB_NAME"]} on ${process.env["DB_URI"]}...`
    );
    await DB.connect();
    console.log("Connected to database");
    db = DB.getDb();
    if (db === undefined) {
      throw Error("db connection failed");
    }

    userCollection = db.collection("users");
    resultCollection = db.collection("results");

    await migrateResults();

    console.log("done.");
  } finally {
    await db.close();
  }
}
main();

async function migrateResults(batchSize = 50): Promise<void> {
  const allUsersCount = await userCollection.countDocuments(filter);
  if (allUsersCount === 0) {
    console.log("No users to migrate.");
    return;
  }

  console.log(`Migrating ${allUsersCount} using batchSize=${batchSize}`);

  let count = 0;
  let uids: string[] = [];
  do {
    uids = await getUsersToMigrate(batchSize);

    //migrate
    await migrateUsers(uids);
    await handleUsersWithNoResults(uids);

    //progress tracker
    count += uids.length;
    if (count % 100 == 0 || uids.length == 0) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(Math.round((count / allUsersCount) * 100) + "%");
    }
  } while (uids.length > 0);
}

async function getUsersToMigrate(limit: number): Promise<string[]> {
  return (
    await userCollection
      .find(filter, { limit })
      .project({ uid: 1, _id: 0 })
      .toArray()
  ).map((it) => it.uid);
}

async function migrateUsers(uids: string[]): Promise<void> {
  return await resultCollection
    .aggregate(
      [
        {
          $match: {
            uid: { $in: uids },
          },
        },
        {
          $project: {
            _id: 0,
            timestamp: -1,
            uid: 1,
          },
        },
        {
          $addFields: {
            date: {
              $toDate: "$timestamp",
            },
          },
        },
        {
          $replaceWith: {
            uid: "$uid",
            year: {
              $year: "$date",
            },
            day: {
              $dayOfYear: "$date",
            },
          },
        },
        {
          $group: {
            _id: {
              uid: "$uid",
              year: "$year",
              day: "$day",
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $group: {
            _id: {
              uid: "$_id.uid",
              year: "$_id.year",
            },
            days: {
              $addToSet: {
                day: "$_id.day",
                tests: "$count",
              },
            },
          },
        },
        {
          $replaceWith: {
            uid: "$_id.uid",
            days: {
              $function: {
                lang: "js",
                args: ["$days", "$_id.year"],
                body: `function (days, year) {
                                var max = Math.max(
                                    ...days.map((it) => it.day)
                                )-1;
                                var arr = new Array(max).fill(null);
                                for (day of days) {
                                    arr[day.day-1] = day.tests;
                                }
                                let result = {};
                                result[year] = arr;
                                return result;
                            }`,
              },
            },
          },
        },
        {
          $group: {
            _id: "$uid",
            testsByYearAndDay: {
              $mergeObjects: "$days",
            },
          },
        },
        {
          $addFields: {
            uid: "$_id",
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
        {
          $merge: {
            into: "users",
            on: "uid",
            whenMatched: "merge",
            whenNotMatched: "discard",
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray();
}

async function handleUsersWithNoResults(uids: string[]): Promise<void> {
  return userCollection.updateMany(
    {
      $and: [{ uid: { $in: uids } }, filter],
    },
    { $set: { testsByYearAndDay: {} } }
  );
}
