const { MongoClient } = require("mongodb");

let mongoClient;

module.exports = {
  async connectDB() {
    let options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    if (process.env.DB_USERNAME && process.env.DB_PASSWORD) {
      options.auth = {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      };
    }

    if (process.env.DB_AUTH_MECHANISM) {
      options.authMechanism = process.env.DB_AUTH_MECHANISM;
    }

    if (process.env.DB_AUTH_SOURCE) {
      options.authSource = process.env.DB_AUTH_SOURCE;
    }

    return MongoClient.connect(process.env.DB_URI, options)
      .then((client) => {
        mongoClient = client;
      })
      .catch((e) => {
        console.log(e);
        process.exit(1);
      });
  },
  mongoDB() {
    if (!mongoClient) throw new Error("Could not connect to the database");
    return mongoClient.db(process.env.DB_NAME);
  },
};
