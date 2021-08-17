import * as Loader from "./loader";
import * as Notifications from "./notifications";
import * as DB from "./db";
import axiosInstance from "./axios-instance";

let currentLeaderboard = "time_15";

export function hide() {
  $("#leaderboardsWrapper")
    .stop(true, true)
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      100,
      () => {
        $("#leaderboardsWrapper").addClass("hidden");
      }
    );
}

function update() {
  $("#leaderboardsWrapper .buttons .button").removeClass("active");
  $(
    `#leaderboardsWrapper .buttons .button[board=${currentLeaderboard}]`
  ).addClass("active");

  let boardinfo = currentLeaderboard.split("_");

  Loader.show();
  Promise.all([
    axiosInstance.get(
      `/results/getLeaderboard/daily/${boardinfo[0]}/${boardinfo[1]}`
    ),
    axiosInstance.get(
      `/results/getLeaderboard/global/${boardinfo[0]}/${boardinfo[1]}`
    ),
  ])
    .then((lbdata) => {
      Loader.hide();
      let dailyData = lbdata[0].data;
      let globalData = lbdata[1].data;

      //daily
      let nextReset = new Date(dailyData.resetTime);
      let diffAsDate = new Date(nextReset - Date.now());

      let diffHours = diffAsDate.getUTCHours();
      let diffMinutes = diffAsDate.getUTCMinutes();
      let diffSeconds = diffAsDate.getUTCSeconds();

      let resetString = "";
      if (diffHours > 0) {
        resetString = `resets in ${diffHours} ${
          diffHours == 1 ? "hour" : "hours"
        } ${diffMinutes} ${diffMinutes == 1 ? "minute" : "minutes"}
        `;
      } else if (diffMinutes > 0) {
        resetString = `resets in ${diffMinutes} ${
          diffMinutes == 1 ? "minute" : "minutes"
        } ${diffSeconds} ${diffSeconds == 1 ? "second" : "seconds"}`;
      } else if (diffSeconds > 0) {
        resetString = `resets in ${diffSeconds} ${
          diffSeconds == 1 ? "second" : "seconds"
        }`;
      }

      $("#leaderboardsWrapper .subtitle").text(resetString);

      $("#leaderboardsWrapper table.daily tfoot").html(`
      <tr>
        <td><br><br></td>
        <td colspan="4" style="text-align:center;">Not qualified</>
        <td><br><br></td>
      </tr>
      `);
      //daily
      $("#leaderboardsWrapper table.daily tbody").empty();
      let dindex = 0;
      if (dailyData.board !== undefined) {
        dailyData.board.forEach((entry) => {
          if (entry.hidden) return;
          let meClassString = "";
          //hacky way to get username because auth().currentUser.name isn't working after mongo switch
          if (DB.getSnapshot() && entry.name == DB.getSnapshot().name) {
            meClassString = ' class="me"';
            $("#leaderboardsWrapper table.daily tfoot").html(`
            <tr>
            <td>${dindex + 1}</td>
            <td>You</td>
            <td class="alignRight">${entry.wpm.toFixed(
              2
            )}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
            <td class="alignRight">${entry.raw.toFixed(
              2
            )}<br><div class="sub">${
              entry.consistency === "-"
                ? "-"
                : entry.consistency.toFixed(2) + "%"
            }</div></td>
            <td class="alignRight">${entry.mode}<br><div class="sub">${
              entry.mode2
            }</div></td>
            <td class="alignRight">${moment(entry.timestamp).format(
              "DD MMM YYYY"
            )}<br><div class='sub'>${moment(entry.timestamp).format(
              "HH:mm"
            )}</div></td>
          </tr>
            `);
          }
          $("#leaderboardsWrapper table.daily tbody").append(`
          <tr>
          <td>${
            dindex === 0 ? '<i class="fas fa-fw fa-crown"></i>' : dindex + 1
          }</td>
          <td ${meClassString}>${entry.name}</td>
          <td class="alignRight">${entry.wpm.toFixed(
            2
          )}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
          <td class="alignRight">${entry.raw.toFixed(2)}<br><div class="sub">${
            entry.consistency === "-" ? "-" : entry.consistency.toFixed(2) + "%"
          }</div></td>
          <td class="alignRight">${entry.mode}<br><div class="sub">${
            entry.mode2
          }</div></td>
          <td class="alignRight">${moment(entry.timestamp).format(
            "DD MMM YYYY"
          )}<br><div class='sub'>${moment(entry.timestamp).format(
            "HH:mm"
          )}</div></td>
        </tr>
        `);
          dindex++;
        });
      }
      let lenDaily = 0;
      if (dailyData.board !== undefined) lenDaily = dailyData.board.length;
      if (dailyData.length === 0 || lenDaily !== dailyData.size) {
        for (let i = lenDaily; i < dailyData.size; i++) {
          $("#leaderboardsWrapper table.daily tbody").append(`
          <tr>
                <td>${i + 1}</td>
                <td>-</td>
                <td class="alignRight">-</td>
                <td class="alignRight">-</td>
                <td class="alignRight">-</td>
                <td class="alignRight">-<br>-</td>
              </tr>
        `);
        }
      }

      $("#leaderboardsWrapper table.global tfoot").html(`
      <tr>
      <td><br><br></td>
      <td colspan="4" style="text-align:center;">Not qualified</>
      <td><br><br></td>
      </tr>
      `);
      //global
      $("#leaderboardsWrapper table.global tbody").empty();
      let index = 0;
      if (globalData.board !== undefined) {
        globalData.board.forEach((entry) => {
          if (entry.hidden) return;
          let meClassString = "";
          if (DB.getSnapshot() && entry.name == DB.getSnapshot().name) {
            meClassString = ' class="me"';
            $("#leaderboardsWrapper table.global tfoot").html(`
            <tr>
            <td>${index + 1}</td>
            <td>You</td>
            <td class="alignRight">${entry.wpm.toFixed(
              2
            )}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
            <td class="alignRight">${entry.raw.toFixed(
              2
            )}<br><div class="sub">${
              entry.consistency === "-"
                ? "-"
                : entry.consistency.toFixed(2) + "%"
            }</div></td>
            <td class="alignRight">${entry.mode}<br><div class="sub">${
              entry.mode2
            }</div></td>
            <td class="alignRight">${moment(entry.timestamp).format(
              "DD MMM YYYY"
            )}<br><div class='sub'>${moment(entry.timestamp).format(
              "HH:mm"
            )}</div></td>
          </tr>
            `);
          }
          $("#leaderboardsWrapper table.global tbody").append(`
          <tr>
          <td>${
            index === 0 ? '<i class="fas fa-fw fa-crown"></i>' : index + 1
          }</td>
          <td ${meClassString}>${entry.name}</td>
          <td class="alignRight">${entry.wpm.toFixed(
            2
          )}<br><div class="sub">${entry.acc.toFixed(2)}%</td>
          <td class="alignRight">${entry.raw.toFixed(2)}<br><div class="sub">${
            entry.consistency === "-" ? "-" : entry.consistency.toFixed(2) + "%"
          }</div></td>
          <td class="alignRight">${entry.mode}<br><div class="sub">${
            entry.mode2
          }</div></td>
          <td class="alignRight">${moment(entry.timestamp).format(
            "DD MMM YYYY"
          )}<br><div class='sub'>${moment(entry.timestamp).format(
            "HH:mm"
          )}</div></td>
        </tr>
        `);
          index++;
        });
      }
      let lenGlobal = 0;
      if (globalData.board !== undefined) lenGlobal = globalData.board.length;
      if (globalData.length === 0 || lenGlobal !== globalData.size) {
        for (let i = lenGlobal; i < globalData.size; i++) {
          $("#leaderboardsWrapper table.global tbody").append(`
        <tr>
              <td>${i + 1}</td>
              <td>-</td>
              <td class="alignRight">-</td>
              <td class="alignRight">-</td>
              <td class="alignRight">-</td>
              <td class="alignRight">-<br>-</td>
            </tr>
      `);
        }
      }
    })
    .catch((e) => {
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to load leaderboards: " + msg, -1);
      return;
    });
}

export function show() {
  if ($("#leaderboardsWrapper").hasClass("hidden")) {
    $("#leaderboardsWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        125,
        () => {
          update();
        }
      );
  }
}

$("#leaderboardsWrapper").click((e) => {
  if ($(e.target).attr("id") === "leaderboardsWrapper") {
    hide();
  }
});

$("#leaderboardsWrapper .buttons .button").click((e) => {
  currentLeaderboard = $(e.target).attr("board");
  update();
});
