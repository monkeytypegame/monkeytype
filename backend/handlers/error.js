const uuid = require("uuid");

class MonkeyError {
  constructor(status, message = "Internal Server Error", stack = null) {
    this.status = status ?? 500;
    this.errorID = uuid.v4();
    this.message =
      process.env.MODE === "dev" ? (stack ? String(stack) : message) : message;
    console.log(`ErrorID: ${this.errorID} logged...`);
  }
}

module.exports = MonkeyError;
