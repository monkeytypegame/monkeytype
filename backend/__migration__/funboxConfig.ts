import { Collection, Db } from "mongodb";
import { Migration } from "./types";
import type { DBConfig } from "../src/dal/config";

export class FunboxConfig implements Migration {
  private configCollection!: Collection<DBConfig>;
  private filter = { "config.funbox": { $exists: true, $type: "string" } };
  private collectionName = "configs2"; //TODO rename

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
        {
          $addFields: {
            "config.funbox": {
              $cond: {
                if: { $eq: ["$config.funbox", "none"] },
                // eslint-disable-next-line no-thenable
                then: undefined,
                else: { $split: ["$config.funbox", "#"] },
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
