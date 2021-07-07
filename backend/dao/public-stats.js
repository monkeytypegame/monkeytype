// const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const { roundTo2 } = require("../handlers/misc");

class PublicStatsDAO {
  //needs to be rewritten, this is public stats not user stats
  static async increment(started, completed, time) {
    time = roundTo2(time);
    await mongoDB()
      .collection("users")
      .updateOne({ name: "startedTests" }, { $inc: { value: started } });
    await mongoDB()
      .collection("users")
      .updateOne({ name: "completedTests" }, { $inc: { value: completed } });
    await mongoDB()
      .collection("users")
      .updateOne({ name: "timeTyping" }, { $inc: { value: time } });
    return true;
  }
}

module.exports = PublicStatsDAO;
