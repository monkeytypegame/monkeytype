import * as DB from "./db";
import * as Notifications from "./notifications";
import Config from "./config";
import * as Misc from "./misc";
import axiosInstance from "./axios-instance";

let textTimeouts = [];

export function show(data, mode2, language) {
  let string = "";
  if (data.needsToVerifyEmail === true) {
    string = `please verify your email<br>to access leaderboards - <a onClick="sendVerificationEmail()">resend email</a>`;
  } else if (data.banned || data.lbBanned) {
    string = "banned";
  } else if (data.lbdisabled) {
    string = "leaderboards disabled";
  } else if (data.rank) {
    const lbUpIcon = `<i class="fas fa-angle-up"></i>`;
    const lbDownIcon = `<i class="fas fa-angle-down"></i>`;
    const lbRightIcon = `<i class="fas fa-angle-right"></i>`;

    const rank = data.rank;
    let rankMemory = DB.getSnapshot().lbMemory?.time?.[mode2]?.[language];
    let dontShowRankDiff = !rankMemory ? true : false;
    let lbDiff;
    if (rankMemory) {
      lbDiff = rankMemory - rank;
    }
    DB.updateLbMemory("time", mode2, language, rank);
    let str = Misc.getPositionString(rank);
    string = `${language}: ${str}`;

    if (!dontShowRankDiff) {
      let sString = lbDiff === 1 || lbDiff === -1 ? "" : "s";
      if (lbDiff > 0) {
        string += ` <span class="lbChange" aria-label="You've gained ${lbDiff} position${sString}" data-balloon-pos="left">(${lbUpIcon}${lbDiff})</span>`;
      } else if (lbDiff === 0) {
        string += ` <span class="lbChange" aria-label="Your position remained the same" data-balloon-pos="left">(${lbRightIcon}${lbDiff})</span>`;
      } else if (lbDiff < 0) {
        string += ` <span class="lbChange" aria-label="You've lost ${lbDiff} position${sString}" data-balloon-pos="left">(${lbDownIcon}${lbDiff})</span>`;
      }
    }
  } else {
    Notifications.add(data + " " + mode2 + " " + language, -1);
  }
  $("#result .stats .leaderboards").removeClass("hidden");
  $("#result .stats .leaderboards .bottom").html(string);
}

export async function check(completedEvent) {
  try {
    if (
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

      let response;
      try {
        response = await axiosInstance.post("/leaderboard/update", {
          rid: completedEvent._id,
        });
      } catch (e) {
        Misc.clearTimeouts(textTimeouts);
        $("#result .stats .leaderboards").addClass("hidden");
        let msg = e?.response?.data?.message ?? e.message;
        Notifications.add("Failed to check leaderboard: " + msg, -1);
        return;
      }
      if (response.status !== 200) {
        Notifications.add(response.data.message);
        Misc.clearTimeouts(textTimeouts);
        $("#result .stats .leaderboards").addClass("hidden");
      } else {
        Misc.clearTimeouts(textTimeouts);
        show(response.data, completedEvent.mode2, completedEvent.language);
      }
    }
  } catch (e) {
    Notifications.add(`Error while checking leaderboards: ${e}`, -1);
  }
}
