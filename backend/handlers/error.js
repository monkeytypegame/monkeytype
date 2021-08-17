const uuid = require("uuid");

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
  }
}

module.exports = MonkeyError;
