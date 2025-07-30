import { Collection, Db, MongoClient, WithId } from "mongodb";
import { afterAll, beforeAll, afterEach } from "vitest";
import * as MongoDbMock from "vitest-mongodb";
import { MongoDbMockConfig } from "../global-setup";
import { isIntegrationTest } from ".";
import { setupCommonMocks } from "../setup-common-mocks";

process.env["MODE"] = "dev";
//process.env["MONGOMS_DISTRO"] = "ubuntu-22.04";

if (!isIntegrationTest) {
  console.error("wrong environment");
  process.exit();
}

if (!process.env["REDIS_URI"]) {
  // use mock if not set
  process.env["REDIS_URI"] = "redis://mock";
}

let db: Db;
let client: MongoClient;
const collectionsForCleanUp = ["users"];

beforeAll(async () => {
  //don't add any configuration here, add to global-setup.ts instead.

  console.log("integration setup mongo");
  await MongoDbMock.setup(MongoDbMockConfig);

  client = new MongoClient(globalThis.__MONGO_URI__);
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
  if (globalThis.__MONGO_URI__) {
    await Promise.all(
      collectionsForCleanUp.map((collection) =>
        db.collection(collection).deleteMany({})
      )
    );
  }
});

afterAll(async () => {
  await client?.close();
  await MongoDbMock.teardown();
  // @ts-ignore
  db = undefined;
  //@ts-ignore
  client = undefined;
  vi.resetAllMocks();
});
