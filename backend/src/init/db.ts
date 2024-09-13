import {
  AuthMechanism,
  Collection,
  Db,
  MongoClient,
  type MongoClientOptions,
  type WithId,
} from "mongodb";
import MonkeyError from "../utils/error";
import Logger from "../utils/logger";

let db: Db;
let mongoClient: MongoClient;

export async function connect(): Promise<void> {
  const {
    DB_USERNAME,
    DB_PASSWORD,
    DB_AUTH_MECHANISM,
    DB_AUTH_SOURCE,
    DB_URI,
    DB_NAME,
  } = process.env;

  const authProvided =
    DB_USERNAME !== undefined &&
    DB_USERNAME !== "" &&
    DB_PASSWORD !== undefined &&
    DB_PASSWORD !== "";
  const uriProvided = DB_URI !== undefined && DB_URI !== "";
  const nameProvided = DB_NAME !== undefined && DB_NAME !== "";

  if (!nameProvided || !uriProvided) {
    throw new Error("No database configuration provided");
  }

  const auth = authProvided
    ? {
        username: DB_USERNAME,
        password: DB_PASSWORD,
      }
    : undefined;

  const connectionOptions: MongoClientOptions = {
    connectTimeoutMS: 2000,
    serverSelectionTimeoutMS: 2000,
    auth: auth,
    authMechanism: DB_AUTH_MECHANISM as AuthMechanism | undefined,
    authSource: DB_AUTH_SOURCE,
  };

  mongoClient = new MongoClient(
    DB_URI ?? global.__MONGO_URI__, // Set in tests only
    connectionOptions
  );

  try {
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
  } catch (error) {
    Logger.error(error.message as string);
    Logger.error(
      "Failed to connect to database. Exiting with exit status code 1."
    );
    process.exit(1);
  }
}

export const getDb = (): Db | undefined => db;

export function collection<T>(collectionName: string): Collection<WithId<T>> {
  if (db === undefined) {
    throw new MonkeyError(500, "Database is not initialized.");
  }

  return db.collection<WithId<T>>(collectionName);
}
export async function close(): Promise<void> {
  await mongoClient?.close();
}
