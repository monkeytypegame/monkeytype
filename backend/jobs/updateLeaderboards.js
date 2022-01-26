const { CronJob } = require("cron");
const { mongoDB } = require("../init/mongodb");
const BotDAO = require("../dao/bot");
const LeaderboardsDAO = require("../dao/leaderboards");

const CRON_SCHEDULE = "30 4/5 * * * *";

async function updateLeaderboards() {
  let before15 = await mongoDB()
    .collection("leaderboards.english.time.15")
    .find()
    .limit(10)
    .toArray();
  LeaderboardsDAO.update("time", "15", "english").then(async () => {
    let after15 = await mongoDB()
      .collection("leaderboards.english.time.15")
      .find()
      .limit(10)
      .toArray();

    let changed;
    let recent = false;
    for (let index in before15) {
      if (before15[index].uid !== after15[index].uid) {
        //something changed at this index
        if (after15[index].timestamp > Date.now() - 1000 * 60 * 10) {
          //checking if test is within 10 minutes
          recent = true;
        }
        changed = after15[index];
        break;
      }
    }
    if (changed && recent) {
      let name = changed.discordId ?? changed.name;
      BotDAO.announceLbUpdate(
        name,
        changed.rank,
        "time 15 english",
        changed.wpm,
        changed.raw,
        changed.acc,
        changed.consistency
      );
    }
  });

  let before60 = await mongoDB()
    .collection("leaderboards.english.time.60")
    .find()
    .limit(10)
    .toArray();
  LeaderboardsDAO.update("time", "60", "english").then(async () => {
    let after60 = await mongoDB()
      .collection("leaderboards.english.time.60")
      .find()
      .limit(10)
      .toArray();
    let changed;
    let recent = false;
    for (let index in before60) {
      if (before60[index].uid !== after60[index].uid) {
        //something changed at this index
        if (after60[index].timestamp > Date.now() - 1000 * 60 * 10) {
          //checking if test is within 10 minutes
          recent = true;
        }
        changed = after60[index];
        break;
      }
    }
    if (changed && recent) {
      let name = changed.discordId ?? changed.name;
      BotDAO.announceLbUpdate(
        name,
        changed.rank,
        "time 60 english",
        changed.wpm,
        changed.raw,
        changed.acc,
        changed.consistency
      );
    }
  });
}

module.exports = new CronJob(CRON_SCHEDULE, updateLeaderboards);
