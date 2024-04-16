import { Collection, Db, MongoClient, WithId } from "mongodb";
import { afterAll, beforeAll, beforeEach, afterEach } from "vitest";
import * as MongoDbMock from "vitest-mongodb";

process.env["MODE"] = "dev";

vi.mock("../src/init/db", () => ({
  __esModule: true,
  getDb: (): Db => db,
  collection: <T>(name: string): Collection<WithId<T>> =>
    db.collection<WithId<T>>(name),
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

if (!process.env["REDIS_URI"]) {
  // use mock if not set
  process.env["REDIS_URI"] = "redis://mock";
}

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

const collectionsForCleanUp = ["users"];

let db: Db;
let client: MongoClient;
beforeAll(async () => {
  await MongoDbMock.setup({
    serverOptions: {
      binary: {
        version: "6.0.12",
      },
    },
  });
  client = new MongoClient(globalThis.__MONGO_URI__);
  db = client.db();
});

beforeEach(async () => {
  if (globalThis.__MONGO_URI__) {
    await Promise.all(
      collectionsForCleanUp.map((collection) =>
        db.collection(collection).deleteMany({})
      )
    );
  }
});

const realDateNow = Date.now;

afterEach(() => {
  Date.now = realDateNow;
});

afterAll(async () => {
  await client?.close();
  await MongoDbMock.teardown();
});
