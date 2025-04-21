import { Db } from "mongodb";

export type Migration = {
  name: string;
  /**
   * setup migration
   * @param db mongo database
   * @returns
   */
  setup: (db: Db) => Promise<void>;
  /**
   *
   * @returns number of documents remaining for migration
   */
  getRemainingCount: () => Promise<number>;
  /**
   *
   * @returns number of documents migrated
   */
  migrate: (options: { batchSize: number }) => Promise<number>;
};
