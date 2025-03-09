import { Collection, Db, MongoClient, WithId } from "mongodb";
import { afterAll, beforeAll, afterEach } from "vitest";
import * as MongoDbMock from "vitest-mongodb";
import { MongoDbMockConfig } from "./global-setup";
import { enableRateLimitExpects } from "./__testData__/rate-limit";

process.env["MODE"] = "dev";
//process.env["MONGOMS_DISTRO"] = "ubuntu-22.04";

if (!process.env["REDIS_URI"]) {
  // use mock if not set
  process.env["REDIS_URI"] = "redis://mock";
}

let db: Db;
let client: MongoClient;
const collectionsForCleanUp = ["users"];

beforeAll(async () => {
  //don't add any configuration here, add to global-setup.ts instead.
  await MongoDbMock.setup(MongoDbMockConfig);

  client = new MongoClient(globalThis.__MONGO_URI__);
  await client.connect();
  db = client.db();

  vi.mock("../src/init/db", () => ({
    __esModule: true,
    getDb: (): Db => db,
    collection: <T>(name: string): Collection<WithId<T>> =>
      db.collection<WithId<T>>(name),
    close: () => {},
  }));

  vi.mock("../src/utils/logger", () => ({
    __esModule: true,
    default: {
      error: console.error,
      warning: console.warn,
      info: console.info,
      success: console.info,
      logToDb: console.info,
    },
  }));

  vi.mock("swagger-stats", () => ({
    getMiddleware:
      () =>
      (_: unknown, __: unknown, next: () => unknown): void => {
        next();
      },
  }));

  // TODO: better approach for this when needed
  // https://firebase.google.com/docs/rules/unit-tests#run_local_unit_tests_with_the_version_9_javascript_sdk
  vi.mock("firebase-admin", () => ({
    __esModule: true,
    default: {
      auth: (): unknown => ({
        verifyIdToken: (
          _token: string,
          _checkRevoked: boolean
        ): unknown /* Promise<DecodedIdToken> */ =>
          Promise.resolve({
            aud: "mockFirebaseProjectId",
            auth_time: 123,
            exp: 1000,
            uid: "mockUid",
          }),
      }),
    },
  }));
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
