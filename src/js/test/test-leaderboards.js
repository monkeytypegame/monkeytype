import * as CloudFunctions from "./cloud-functions";
import * as DB from "./db";
import * as Notifications from "./notifications";
import Config from "./config";
import * as Misc from "./misc";

let textTimeouts = [];

export function show(data, mode2) {
  let string = "";
  if (data.needsToVerifyEmail === true) {
    string = `please verify your email<br>to access leaderboards - <a onClick="sendVerificationEmail()">resend email</a>`;
  } else if (data.banned || data.lbBanned) {
    string = "banned";
  } else if (data.name === false) {
    string = "update your name to access leaderboards";
  } else if (data.needsToVerify === true) {
    string = "verification needed to access leaderboards";
  } else {
    const lbUpIcon = `<i class="fas fa-angle-up"></i>`;
    const lbDownIcon = `<i class="fas fa-angle-down"></i>`;
    const lbRightIcon = `<i class="fas fa-angle-right"></i>`;

    //global
    let globalLbString = "";
    const glb = data.global;
    let glbMemory;
    try {
      glbMemory = DB.getSnapshot().lbMemory[Config.mode + mode2].global;
    } catch {
      glbMemory = null;
    }
    let dontShowGlobalDiff =
      glbMemory == null || glbMemory === -1 ? true : false;
    let globalLbDiff = null;
    if (glb.status === -999) {
      globalLbString = "global: error - " + glb.message;
    } else if (glb === null) {
      globalLbString = "global: not found";
    } else if (glb.insertedAt === -1) {
      dontShowGlobalDiff = true;
      globalLbDiff = glbMemory - glb.insertedAt;
      DB.updateLbMemory(Config.mode, mode2, "global", glb.insertedAt);

      globalLbString = "global: not qualified";
    } else if (glb.insertedAt >= 0) {
      if (glb.newBest) {
        globalLbDiff = glbMemory - glb.insertedAt;
        DB.updateLbMemory(Config.mode, mode2, "global", glb.insertedAt);
        let str = Misc.getPositionString(glb.insertedAt + 1);
        globalLbString = `global: ${str}`;
      } else {
        globalLbDiff = glbMemory - glb.foundAt;
        DB.updateLbMemory(Config.mode, mode2, "global", glb.foundAt);
        let str = Misc.getPositionString(glb.foundAt + 1);
        globalLbString = `global: ${str}`;
      }
    }
    if (!dontShowGlobalDiff) {
      let sString = globalLbDiff === 1 || globalLbDiff === -1 ? "" : "s";
      if (globalLbDiff > 0) {
        globalLbString += ` <span class="lbChange" aria-label="You've gained ${globalLbDiff} position${sString}" data-balloon-pos="left">(${lbUpIcon}${globalLbDiff})</span>`;
      } else if (globalLbDiff === 0) {
        globalLbString += ` <span class="lbChange" aria-label="Your position remained the same" data-balloon-pos="left">(${lbRightIcon}${globalLbDiff})</span>`;
      } else if (globalLbDiff < 0) {
        globalLbString += ` <span class="lbChange" aria-label="You've lost ${globalLbDiff} position${sString}" data-balloon-pos="left">(${lbDownIcon}${globalLbDiff})</span>`;
      }
    }

    //daily
    let dailyLbString = "";
    const dlb = data.daily;
    let dlbMemory;
    try {
      dlbMemory = DB.getSnapshot().lbMemory[Config.mode + mode2].daily;
    } catch {
      dlbMemory = null;
    }
    let dontShowDailyDiff =
      dlbMemory == null || dlbMemory === -1 ? true : false;
    let dailyLbDiff = null;
    if (dlb.status === -999) {
      dailyLbString = "daily: error - " + dlb.message;
    } else if (dlb === null) {
      dailyLbString = "daily: not found";
    } else if (dlb.insertedAt === -1) {
      dontShowDailyDiff = true;
      dailyLbDiff = dlbMemory - dlb.insertedAt;
      DB.updateLbMemory(Config.mode, mode2, "daily", dlb.insertedAt);
      dailyLbString = "daily: not qualified";
    } else if (dlb.insertedAt >= 0) {
      if (dlb.newBest) {
        dailyLbDiff = dlbMemory - dlb.insertedAt;
        DB.updateLbMemory(Config.mode, mode2, "daily", dlb.insertedAt);
        let str = Misc.getPositionString(dlb.insertedAt + 1);
        dailyLbString = `daily: ${str}`;
      } else {
        dailyLbDiff = dlbMemory - dlb.foundAt;
        DB.updateLbMemory(Config.mode, mode2, "daily", dlb.foundAt);
        let str = Misc.getPositionString(dlb.foundAt + 1);
        dailyLbString = `daily: ${str}`;
      }
    }
    if (!dontShowDailyDiff) {
      let sString = dailyLbDiff === 1 || dailyLbDiff === -1 ? "" : "s";
      if (dailyLbDiff > 0) {
        dailyLbString += ` <span class="lbChange" aria-label="You've gained ${dailyLbDiff} position${sString}" data-balloon-pos="left">(${lbUpIcon}${dailyLbDiff})</span>`;
      } else if (dailyLbDiff === 0) {
        dailyLbString += ` <span class="lbChange" aria-label="Your position remained the same" data-balloon-pos="left">(${lbRightIcon}${dailyLbDiff})</span>`;
      } else if (dailyLbDiff < 0) {
        dailyLbString += ` <span class="lbChange" aria-label="You've lost ${dailyLbDiff} position${sString}" data-balloon-pos="left">(${lbDownIcon}${dailyLbDiff})</span>`;
      }
    }
    string = globalLbString + "<br>" + dailyLbString;

    // CloudFunctions.saveLbMemory({
    //   uid: firebase.auth().currentUser.uid,
    //   obj: DB.getSnapshot().lbMemory,
    // }).then((d) => {
    //   if (d.data.returnCode === 1) {
    //   } else {
    //     Notifications.add(
    //       `Error saving lb memory ${d.data.message}`,
    //       4000
    //     );
    //   }
    // });
  }
  $("#result .stats .leaderboards").removeClass("hidden");
  $("#result .stats .leaderboards .bottom").html(string);
}

export function check(completedEvent) {
  try {
    if (
      completedEvent.funbox === "none" &&
      completedEvent.language === "english" &&
      completedEvent.mode === "time" &&
      ["15", "60"].includes(String(completedEvent.mode2))
    ) {
      $("#result .stats .leaderboards").removeClass("hidden");
      $("#result .stats .leaderboards .bottom").html(
        `checking <i class="fas fa-spin fa-fw fa-circle-notch"></i>`
      );
      textTimeouts.push(
        setTimeout(() => {
          $("#result .stats .leaderboards .bottom").html(
            `still checking <i class="fas fa-spin fa-fw fa-circle-notch"></i>`
          );
        }, 5000)
      );
      textTimeouts.push(
        setTimeout(() => {
          $("#result .stats .leaderboards .bottom").html(
            `leaderboard seems<br>to be very busy <i class="fas fa-spin fa-fw fa-circle-notch"></i>`
          );
        }, 10000)
      );
      let lbRes = completedEvent;
      delete lbRes.keySpacing;
      delete lbRes.keyDuration;
      delete lbRes.chartData;
      CloudFunctions.checkLeaderboards({
        uid: completedEvent.uid,
        lbMemory: DB.getSnapshot().lbMemory,
        emailVerified: DB.getSnapshot().emailVerified,
        name: DB.getSnapshot().name,
        banned: DB.getSnapshot().banned,
        verified: DB.getSnapshot().verified,
        discordId: DB.getSnapshot().discordId,
        result: lbRes,
      })
        .then((data) => {
          Misc.clearTimeouts(textTimeouts);
          show(data.data, completedEvent.mode2);
        })
        .catch((e) => {
          $("#result .stats .leaderboards").addClass("hidden");
          Notifications.add(e, -1);
        });
    }
  } catch (e) {
    Notifications.add(`Error while checking leaderboards: ${e}`, -1);
  }
}
