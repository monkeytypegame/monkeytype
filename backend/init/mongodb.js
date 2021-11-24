const { MongoClient } = require("mongodb");

let mongoClient;

module.exports = {
  async connectDB() {
    return MongoClient.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
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
