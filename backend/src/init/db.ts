import {
  AuthMechanism,
  Collection,
  Db,
  MongoClient,
  MongoClientOptions,
  WithId,
} from "mongodb";
import MonkeyError from "../utils/error";
import Logger from "../utils/logger";

let db: Db;

export async function connect(): Promise<void> {
  const {
    DB_USERNAME,
    DB_PASSWORD,
    DB_AUTH_MECHANISM,
    DB_AUTH_SOURCE,
    DB_URI,
    DB_NAME,
  } = process.env;

  if (!DB_URI || !DB_NAME) {
    throw new Error("No database configuration provided");
  }

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
    authSource: DB_AUTH_SOURCE,
  };

  const mongoClient = new MongoClient(
    (DB_URI as string) ?? global.__MONGO_URI__, // Set in tests only
    connectionOptions
  );

  try {
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
  } catch (error) {
    Logger.error(error.message);
    Logger.error(
      "Failed to connect to database. Exiting with exit status code 1."
    );
    process.exit(1);
  }
}

export const getDb = (): Db | undefined => db;

export function collection<T>(collectionName: string): Collection<WithId<T>> {
  if (!db) {
    throw new MonkeyError(500, "Database is not initialized.");
  }

  return db.collection<WithId<T>>(collectionName);
}
