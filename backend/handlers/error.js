const uuid = require("uuid");
const { mongoDB } = require("../init/mongodb");

class MonkeyError {
  constructor(status, message, stack = null, uid) {
    this.status = status ?? 500;
    this.errorID = uuid.v4();

    this.message =
      process.env.MODE === "dev"
        ? stack
          ? String(stack)
          : this.status === 500
          ? String(message)
          : message
        : "Internal Server Error " + this.errorID;

    console.log("Error", message, stack);
    if (process.env.MODE !== "dev" && this.status > 400) {
      mongoDB().collection("errors").insertOne({
        _id: this.errorID,
        timestamp: Date.now(),
        status: this.status,
        uid,
        message,
        stack,
      });
    }
  }
}

module.exports = MonkeyError;
