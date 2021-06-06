const uuid = require("uuid");

class MonkeyError {
  status = 500;
  message = "Internal Server Error";
  errorID = "";

  constructor(status, message, stack = null) {
    this.status = status;
    this.message =
      process.env.MODE === "DEVELOPMENT"
        ? stack
          ? String(stack)
          : message
        : message;
    this.errorID = uuid.v4();
    console.log(`ErrorID: ${this.errorID} logged...`);
  }
}

module.exports = MonkeyError;
