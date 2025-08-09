import { Collection, Db, MongoClient, WithId } from "mongodb";
import { afterAll, beforeAll, afterEach } from "vitest";
import { setupCommonMocks } from "../setup-common-mocks";
import { getConnection } from "../../src/init/redis";

process.env["MODE"] = "dev";

let db: Db;
let client: MongoClient;

beforeAll(async () => {
  client = new MongoClient(process.env["TEST_DB_URL"] as string);
  await client.connect();
  db = client.db();

  vi.mock("../../src/init/db", () => ({
    __esModule: true,
    getDb: (): Db => db,
    collection: <T>(name: string): Collection<WithId<T>> =>
      db.collection<WithId<T>>(name),
    close: () => {
      //
    },
  }));

  setupCommonMocks();
});

afterEach(async () => {
  //nothing
});

afterAll(async () => {
  await client?.close();
  // @ts-ignore
  db = undefined;
  //@ts-ignore
  client = undefined;

  await getConnection()?.quit();

  vi.resetAllMocks();
});
