import { Db, MongoClient } from "mongodb";

jest.mock("./init/db2", () => ({
  __esModule: true,
  dbService: (): unknown => ({ getDb: () => db }),
}));

jest.mock("./utils/logger", () => ({
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
  await Promise.all(
    collectionsForCleanUp.map((collection) =>
      db.collection(collection).deleteMany({})
    )
  );
});

afterAll(async () => {
  await connection.close();
});
