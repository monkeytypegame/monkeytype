import { Db, MongoClient } from "mongodb";

jest.mock("./init/db2", () => ({
  __esModule: true,
  dbService: (): unknown => ({ getDb: () => db }),
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
