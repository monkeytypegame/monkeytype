import { Collection, Db, MongoClient, WithId } from "mongodb";

process.env.MODE = "dev";

jest.mock("./src/init/db", () => ({
  __esModule: true,
  getDb: (): Db => db,
  collection: <T>(name: string): Collection<WithId<T>> =>
    db.collection<WithId<T>>(name),
}));

jest.mock("./src/utils/logger", () => ({
  __esModule: true,
  default: {
    error: console.error,
    warning: console.warn,
    info: console.info,
    success: console.info,
    logToDb: console.info,
  },
}));

jest.mock("swagger-stats", () => ({
  getMiddleware:
    () =>
    (_: unknown, __: unknown, next: () => unknown): void => {
      next();
    },
}));

if (!process.env.REDIS_URI) {
  // use mock if not set
  process.env.REDIS_URI = "redis://mock";
  jest.mock("ioredis", () => require("ioredis-mock"));
}

// TODO: better approach for this when needed
// https://firebase.google.com/docs/rules/unit-tests#run_local_unit_tests_with_the_version_9_javascript_sdk
jest.mock("firebase-admin", () => ({
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
let connection: MongoClient;
beforeAll(async () => {
  connection = await MongoClient.connect(global.__MONGO_URI__);
  db = connection.db();
});

beforeEach(async () => {
  if (global.__MONGO_URI__) {
    await Promise.all(
      collectionsForCleanUp.map((collection) =>
        db.collection(collection).deleteMany({})
      )
    );
  }
});

afterAll(async () => {
  await connection.close();
});
