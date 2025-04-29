import { Collection, Db } from "mongodb";
import { Migration } from "./types";
import type { DBResult } from "../src/utils/result";

export default class FunboxResult implements Migration {
  private resultCollection!: Collection<DBResult>;
  private filter = { funbox: { $type: 2, $not: { $type: 4 } } }; //string, not array of strings
  private collectionName = "results";
  name: string = "FunboxResult";

  async setup(db: Db): Promise<void> {
    this.resultCollection = db.collection(this.collectionName);
  }
  async getRemainingCount(): Promise<number> {
    return this.resultCollection.countDocuments(this.filter);
  }

  async migrate({ batchSize }: { batchSize: number }): Promise<number> {
    const pipeline = this.resultCollection.aggregate([
      { $match: this.filter },
      { $sort: { timestamp: 1 } },
      { $limit: batchSize },
      { $project: { _id: 1, timestamp: 1, funbox: 1 } },

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
    ]);
    await pipeline.toArray();

    return batchSize; //TODO hmmm....
  }
}
