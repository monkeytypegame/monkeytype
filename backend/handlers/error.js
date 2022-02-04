const uuid = require("uuid");

class MonkeyError {
  constructor(status, message, stack = null, uid) {
    this.status = status ?? 500;
    this.errorID = uuid.v4();
    this.stack = stack;
    // this.message =
    // process.env.MODE === "dev"
    //   ? stack
    //     ? String(stack)
    //     : this.status === 500
    //     ? String(message)
    //     : message
    //   : "Internal Server Error " + this.errorID;

    if (process.env.MODE === "dev") {
      this.message = stack
        ? String(message) + "\nStack: " + String(stack)
        : String(message);
    } else {
      if (this.stack && this.status >= 500) {
        this.stack = this.message + "\n" + this.stack;
        this.message = "Internal Server Error " + this.errorID;
      } else {
        this.message = String(message);
      }
    }
  }
}

module.exports = MonkeyError;
