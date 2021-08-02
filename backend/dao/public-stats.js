// const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const { roundTo2 } = require("../handlers/misc");

class PublicStatsDAO {
  //needs to be rewritten, this is public stats not user stats
  static async updateStats(restartCount, time) {
    time = roundTo2(time);
    await mongoDB()
      .collection("public")
      .updateOne(
        { type: "stats" },
        {
          $inc: {
            testsCompleted: 1,
            testsStarted: restartCount + 1,
            timeTyping: time,
          },
        },
        { upsert: true }
      );
    return true;
  }
}

module.exports = PublicStatsDAO;
