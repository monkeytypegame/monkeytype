const { config } = require("dotenv");
const path = require("path");
config({ path: path.join(__dirname, ".env") });

const admin = require("firebase-admin");
const serviceAccount = require("./credentials/serviceAccountKey.json");

const { MongoClient } = require("mongodb");

class DatabaseClient {
  static mongoClient = null;
  static db = null;
  static collections = {};
  static connected = false;
  static async connect() {
    const {
      DB_USERNAME,
      DB_PASSWORD,
      DB_AUTH_MECHANISM,
      DB_AUTH_SOURCE,
      DB_URI,
      DB_NAME,
    } = process.env;
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
      connectionOptions.authMechanism = DB_AUTH_MECHANISM;
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
  static async close() {
    if (this.connected) {
      await this.mongoClient.close();
    }
  }
  static collection(collectionName) {
    if (!this.connected) {
      return null;
    }
    if (!(collectionName in this.collections)) {
      this.collections[collectionName] = this.db.collection(collectionName);
    }
    return this.collections[collectionName];
  }
}

async function main() {
  await DatabaseClient.connect();
  await admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Database Connected!!");
  run();
}

main();

function run() {
  //
  console.log("test");
}
