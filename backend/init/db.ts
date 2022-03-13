import {
  AuthMechanism,
  Collection,
  Db,
  MongoClient,
  MongoClientOptions,
} from "mongodb";

class DatabaseClient {
  static mongoClient: MongoClient;
  static db: Db;
  static collections: Record<string, Collection<any>> = {};
  static connected = false;

  static async connect(): Promise<void> {
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
    };

    if (DB_USERNAME && DB_PASSWORD) {
      connectionOptions.auth = {
        username: DB_USERNAME,
        password: DB_PASSWORD,
      };
    }

    if (DB_AUTH_MECHANISM) {
      connectionOptions.authMechanism = DB_AUTH_MECHANISM as AuthMechanism;
    }

    if (DB_AUTH_SOURCE) {
      connectionOptions.authSource = DB_AUTH_SOURCE;
    }

    this.mongoClient = new MongoClient(DB_URI, connectionOptions);

    try {
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(DB_NAME);
      this.connected = true;
    } catch (error) {
      console.error(error.message);
      console.error(
        "Failed to connect to database. Exiting with exit status code 1."
      );
      process.exit(1);
    }
  }

  static async close(): Promise<void> {
    if (this.connected) {
      await this.mongoClient.close();
    }
  }

  static collection<T>(collectionName: string): Collection<T> {
    if (!(collectionName in this.collections)) {
      this.collections[collectionName] = this.db.collection<T>(collectionName);
    }

    return this.collections[collectionName];
  }
}

export default DatabaseClient;
