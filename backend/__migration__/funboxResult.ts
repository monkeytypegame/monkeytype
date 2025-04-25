import { Collection, Db } from "mongodb";
import { Migration } from "./types";
import type { DBResult } from "../src/utils/result";

export class funboxResult implements Migration {
  private resultCollection!: Collection<DBResult>;
  private filter = { funbox: { $exists: true, $not: { $type: "array" } } };
  private collectionName = "results";
  name: string = "FunboxResult";

  async setup(db: Db): Promise<void> {
    this.resultCollection = db.collection(this.collectionName);
  }
  async getRemainingCount(): Promise<number> {
    return this.resultCollection.countDocuments(this.filter);
  }

  async migrate({ batchSize }: { batchSize: number }): Promise<number> {
    await this.resultCollection
      .aggregate([
        { $match: this.filter },
        { $limit: batchSize },
        {
          $addFields: {
            funbox: {
              $cond: {
                if: { $eq: ["$funbox", "none"] },
                // eslint-disable-next-line no-thenable
                then: undefined,
                else: { $split: ["$funbox", "#"] },
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
