const uuid = require("uuid");

class MonkeyError {
  constructor(status, message, stack = null) {
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
    console.log(`ErrorID: ${this.errorID} logged...`);
  }
}

module.exports = MonkeyError;
