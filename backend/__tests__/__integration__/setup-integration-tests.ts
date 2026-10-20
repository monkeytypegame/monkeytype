import { afterAll, beforeAll, afterEach, vi } from "vitest";
import { Collection, Db, MongoClient, WithId } from "mongodb";
import { getConnection } from "../../src/init/redis";

process.env["MODE"] = "dev";

let db: Db | undefined;
let client: MongoClient | undefined;

vi.mock("../../src/init/db", () => ({
  __esModule: true,
  getDb: (): Db => db as Db,
  collection: <T>(name: string): Collection<WithId<T>> =>
    (db as Db).collection<WithId<T>>(name),
  close: () => {
    //
  },
}));

beforeAll(async () => {
  client = new MongoClient(process.env["TEST_DB_URL"] as string);
  await client.connect();
  db = client.db();

  //we compare the time in mongodb to calculate premium status, so we have to use real time here
  vi.useRealTimers();
});

afterEach(async () => {
  //nothing
});

afterAll(async () => {
  await client?.close();

  db = undefined;
  client = undefined;

  await getConnection()?.quit();

  vi.resetAllMocks();
});
