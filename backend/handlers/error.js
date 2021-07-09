const uuid = require("uuid");
const { mongoDB } = require("../init/mongodb");

class MonkeyError {
  constructor(status, message, stack = null, uid) {
    this.status = status ?? 500;
    this.errorID = uuid.v4();
    if (this.status === 500) {
      this.message =
        process.env.MODE === "dev"
          ? stack
            ? String(stack)
            : String(message)
          : "Internal Server Error " + this.errorID;
    } else {
      this.message =
        process.env.MODE === "dev"
          ? stack
            ? String(stack)
            : message
          : message;
    }
    console.log("Error", message, stack);
    if (process.env.MODE !== "dev" && this.status === 500) {
      mongoDB()
        .collection("errors")
        .insertOne({
          _id: this.errorID,
          timestamp: Date.now(),
          uid,
          message,
          stack,
        });
    }
  }
}

module.exports = MonkeyError;
