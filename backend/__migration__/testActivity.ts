import { Collection, Db } from "mongodb";
import { DBUser } from "../src/dal/user";
import { DBResult } from "../src/utils/result";

import { Migration } from "./types";

export class TestActivityMigration implements Migration {
  private userCollection!: Collection<DBUser>;
  private resultCollection!: Collection<DBResult>;
  private filter = { testActivity: { $exists: false } };
  name: string = "TestActivity";

  async setup(db: Db): Promise<void> {
    this.userCollection = db.collection("users");
    this.resultCollection = db.collection("results");

    console.log("Creating index on users collection...");
    const t1 = Date.now();
    await this.userCollection.createIndex({ uid: 1 }, { unique: true });
    console.log("Index created in", Date.now() - t1, "ms");
  }

  async getRemainingCount(): Promise<number> {
    return this.userCollection.countDocuments(this.filter);
  }

  async migrate({ batchSize }: { batchSize: number }): Promise<number> {
    console.log("Fetching users to migrate...");
    const t1 = Date.now();
    const uids = await this.getUsersToMigrate(batchSize);
    console.log("Fetched", uids.length, "users in", Date.now() - t1, "ms");
    console.log("Users to migrate:", uids.join(","));

    //migrate
    const t2 = Date.now();
    await this.migrateUsers(uids);
    console.log("Migrated", uids.length, "users in", Date.now() - t2, "ms");
    const t3 = Date.now();
    await this.handleUsersWithNoResults(uids);
    console.log("Handled users with no results in", Date.now() - t3, "ms");

    return uids.length;
  }

  async getUsersToMigrate(limit: number): Promise<string[]> {
    return (
      await this.userCollection
        .find(this.filter, { limit })
        .project({ uid: 1, _id: 0 })
        .toArray()
    ).map((it) => it["uid"]);
  }

  async migrateUsers(uids: string[]): Promise<void> {
    await this.resultCollection
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
              testActivity: {
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

  async handleUsersWithNoResults(uids: string[]): Promise<void> {
    await this.userCollection.updateMany(
      {
        $and: [{ uid: { $in: uids } }, this.filter],
      },
      { $set: { testActivity: {} } }
    );
  }
}
