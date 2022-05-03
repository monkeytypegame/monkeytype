import { AuthMechanism, Db, MongoClient, MongoClientOptions } from "mongodb";

interface DbService {
  connect: () => Promise<void>;
  getDb: () => Db;
}

const {
  DB_USERNAME,
  DB_PASSWORD,
  DB_AUTH_MECHANISM,
  DB_AUTH_SOURCE,
  DB_URI,
  MONGO_URL, // Set in tests
  DB_NAME,
} = process.env;

const connectionOptions: MongoClientOptions = {
  connectTimeoutMS: 2000,
  serverSelectionTimeoutMS: 2000,
  auth: !(DB_USERNAME && DB_PASSWORD)
    ? undefined
    : {
        username: DB_USERNAME,
        password: DB_PASSWORD,
      },
  authMechanism: DB_AUTH_MECHANISM as AuthMechanism | undefined,
  authSource: DB_AUTH_SOURCE ?? "",
};

const mongoClient = new MongoClient(
  (DB_URI as string) ?? MONGO_URL,
  connectionOptions
);
let db: Db | null = null;

export const dbService = (): DbService => ({
  connect: async (): Promise<void> => {
    if (!DB_URI || !DB_NAME) {
      throw new Error("No database configuration provided");
    }
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
  },
  getDb: (): Db => {
    if (!db) {
      throw new Error("Database has not been initialized");
    }
    return db;
  },
});
