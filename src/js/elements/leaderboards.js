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
    axiosInstance.get(`/leaderboards`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "15",
      },
    }),
    axiosInstance.get(`/leaderboards`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "60",
      },
    }),
  ])
    .then((lbdata) => {
      Loader.hide();
      let time15data = lbdata[0].data;
      let time60data = lbdata[1].data;

      $("#leaderboardsWrapper table.left tfoot").html(`
      <tr>
        <td><br><br></td>
        <td colspan="4" style="text-align:center;">Not qualified</>
        <td><br><br></td>
      </tr>
      `);
      //left
      $("#leaderboardsWrapper table.left tbody").empty();
      let dindex = 0;
      if (time15data !== undefined) {
        time15data.forEach((entry) => {
          if (entry.hidden) return;
          let meClassString = "";
          if (entry.name == DB.getSnapshot().name) {
            meClassString = ' class="me"';
            $("#leaderboardsWrapper table.left tfoot").html(`
              <tr>
              <td>${dindex + 1}</td>
              <td>You</td>
              <td class="alignRight">${entry.wpm.toFixed(
                2
              )}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
              <td class="alignRight">${entry.raw.toFixed(
                2
              )}<br><div class="sub">${
              !entry.consistency || entry.consistency === "-"
                ? "-"
                : entry.consistency.toFixed(2) + "%"
            }</div></td>
              <td class="alignRight">time<br><div class="sub">15</div></td>
              <td class="alignRight">${moment(entry.timestamp).format(
                "DD MMM YYYY"
              )}<br><div class='sub'>${moment(entry.timestamp).format(
              "HH:mm"
            )}</div></td>
            </tr>
            `);
          }
          $("#leaderboardsWrapper table.left tbody").append(`
          <tr>
          <td>${
            dindex === 0 ? '<i class="fas fa-fw fa-crown"></i>' : dindex + 1
          }</td>
          <td ${meClassString}>${entry.name}</td>
          <td class="alignRight">${entry.wpm.toFixed(
            2
          )}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
          <td class="alignRight">${entry.raw.toFixed(2)}<br><div class="sub">${
            !entry.consistency || entry.consistency === "-"
              ? "-"
              : entry.consistency.toFixed(2) + "%"
          }</div></td>
          <td class="alignRight">time<br><div class="sub">15</div></td>
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

      $("#leaderboardsWrapper table.right tfoot").html(`
      <tr>
      <td><br><br></td>
      <td colspan="4" style="text-align:center;">Not qualified</>
      <td><br><br></td>
      </tr>
      `);
      //global
      $("#leaderboardsWrapper table.right tbody").empty();
      let index = 0;
      if (time60data !== undefined) {
        time60data.forEach((entry) => {
          if (entry.hidden) return;
          let meClassString = "";
          if (entry.name == DB.getSnapshot().name) {
            meClassString = ' class="me"';
            $("#leaderboardsWrapper table.right tfoot").html(`
            <tr>
            <td>${index + 1}</td>
            <td>You</td>
            <td class="alignRight">${entry.wpm.toFixed(
              2
            )}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
            <td class="alignRight">${entry.raw.toFixed(
              2
            )}<br><div class="sub">${
              !entry.consistency || entry.consistency === "-"
                ? "-"
                : entry.consistency.toFixed(2) + "%"
            }</div></td>
            <td class="alignRight">time<br><div class="sub">60</div></td>
            <td class="alignRight">${moment(entry.timestamp).format(
              "DD MMM YYYY"
            )}<br><div class='sub'>${moment(entry.timestamp).format(
              "HH:mm"
            )}</div></td>
          </tr>
            `);
          }
          $("#leaderboardsWrapper table.right tbody").append(`
          <tr>
          <td>${
            index === 0 ? '<i class="fas fa-fw fa-crown"></i>' : index + 1
          }</td>
          <td ${meClassString}>${entry.name}</td>
          <td class="alignRight">${entry.wpm.toFixed(
            2
          )}<br><div class="sub">${entry.acc.toFixed(2)}%</td>
          <td class="alignRight">${entry.raw.toFixed(2)}<br><div class="sub">${
            !entry.consistency || entry.consistency === "-"
              ? "-"
              : entry.consistency.toFixed(2) + "%"
          }</div></td>
          <td class="alignRight">time<br><div class="sub">60</div></td>
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
    })
    .catch((e) => {
      console.log(e);
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
