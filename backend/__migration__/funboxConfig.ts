import { Collection, Db } from "mongodb";
import { Migration } from "./types";
import type { DBConfig } from "../src/dal/config";

export class FunboxConfig implements Migration {
  private configCollection!: Collection<DBConfig>;
  private filter = {
    $or: [
      { "config.funbox": { $type: 2, $not: { $type: 4 } } },
      { "config.customLayoutfluid": { $type: 2, $not: { $type: 4 } } },
    ],
  };
  private collectionName = "configs";

  name: string = "FunboxConfig";

  async setup(db: Db): Promise<void> {
    this.configCollection = db.collection(this.collectionName);
  }
  async getRemainingCount(): Promise<number> {
    return this.configCollection.countDocuments(this.filter);
  }

  async migrate({ batchSize }: { batchSize: number }): Promise<number> {
    await this.configCollection
      .aggregate([
        { $match: this.filter },
        { $limit: batchSize },
        //don't use projection
        {
          $addFields: {
            "config.funbox": {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$config.funbox", null] },
                    { $ne: [{ $type: "$config.funbox" }, "array"] },
                  ],
                },
                // eslint-disable-next-line no-thenable
                then: {
                  $cond: {
                    if: { $eq: ["$config.funbox", "none"] },
                    // eslint-disable-next-line no-thenable
                    then: [],
                    else: { $split: ["$config.funbox", "#"] },
                  },
                },
                else: "$config.funbox",
              },
            },
            "config.customLayoutfluid": {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$config.customLayoutfluid", null] },
                    { $ne: [{ $type: "$config.customLayoutfluid" }, "array"] },
                  ],
                },
                // eslint-disable-next-line no-thenable
                then: { $split: ["$config.customLayoutfluid", "#"] },
                else: "$config.customLayoutfluid",
              },
            },
          },
        },
        {
          $merge: {
            into: this.collectionName,
            on: "_id",
            whenMatched: "merge",
          },
        },
      ])
      .toArray();
    return batchSize; //TODO hmmm....
  }
}
