let currentLeaderboard = "time_15";

function showLeaderboards() {
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
          updateLeaderboards();
        }
      );
  }
}

function hideLeaderboards() {
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
  focusWords();
}

function updateLeaderboards() {
  $("#leaderboardsWrapper .buttons .button").removeClass("active");
  $(
    `#leaderboardsWrapper .buttons .button[board=${currentLeaderboard}]`
  ).addClass("active");

  let boardinfo = currentLeaderboard.split("_");

  let uid = null;
  if (firebase.auth().currentUser !== null) {
    uid = firebase.auth().currentUser.uid;
  }

  showBackgroundLoader();
  Promise.all([
    CloudFunctions.getLeaderboard({
      mode: boardinfo[0],
      mode2: boardinfo[1],
      type: "daily",
      uid: uid,
    }),
    CloudFunctions.getLeaderboard({
      mode: boardinfo[0],
      mode2: boardinfo[1],
      type: "global",
      uid: uid,
    }),
  ])
    .then((lbdata) => {
      hideBackgroundLoader();
      let dailyData = lbdata[0].data;
      let globalData = lbdata[1].data;

      //daily
      let diffAsDate = new Date(dailyData.resetTime - Date.now());

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
        <td colspan="5" style="text-align:center;">Not qualified</>
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
          if (entry.currentUser) {
            meClassString = ' class="me"';
            $("#leaderboardsWrapper table.daily tfoot").html(`
            <tr>
            <td>${dindex + 1}</td>
            <td>You</td>
            <td>${entry.wpm.toFixed(2)}</td>
            <td>${entry.raw.toFixed(2)}</td>
            <td>${entry.acc.toFixed(2)}%</td>
            <td>${entry.mode} ${entry.mode2}</td>
            <td>${moment(entry.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
          </tr>
            `);
          }
          $("#leaderboardsWrapper table.daily tbody").append(`
          <tr>
          <td>${
            dindex === 0 ? '<i class="fas fa-fw fa-crown"></i>' : dindex + 1
          }</td>
          <td ${meClassString}>${entry.name}</td>
          <td>${entry.wpm.toFixed(2)}</td>
          <td>${entry.raw.toFixed(2)}</td>
          <td>${entry.acc.toFixed(2)}%</td>
          <td>${entry.mode} ${entry.mode2}</td>
          <td>${moment(entry.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
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
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-<br>-</td>
              </tr>
        `);
        }
      }

      $("#leaderboardsWrapper table.global tfoot").html(`
      <tr>
      <td><br><br></td>
      <td colspan="5" style="text-align:center;">Not qualified</>
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
          if (entry.currentUser) {
            meClassString = ' class="me"';
            $("#leaderboardsWrapper table.global tfoot").html(`
            <tr>
            <td>${index + 1}</td>
            <td>You</td>
            <td>${entry.wpm.toFixed(2)}</td>
            <td>${entry.raw.toFixed(2)}</td>
            <td>${entry.acc.toFixed(2)}%</td>
            <td>${entry.mode} ${entry.mode2}</td>
            <td>${moment(entry.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
          </tr>
            `);
          }
          $("#leaderboardsWrapper table.global tbody").append(`
          <tr>
          <td>${
            index === 0 ? '<i class="fas fa-fw fa-crown"></i>' : index + 1
          }</td>
          <td ${meClassString}>${entry.name}</td>
          <td>${entry.wpm.toFixed(2)}</td>
          <td>${entry.raw.toFixed(2)}</td>
          <td>${entry.acc.toFixed(2)}%</td>
          <td>${entry.mode} ${entry.mode2}</td>
          <td>${moment(entry.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
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
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-<br>-</td>
            </tr>
      `);
        }
      }
    })
    .catch((e) => {
      hideBackgroundLoader();
      Notifications.add("Something went wrong: " + e.message, -1);
    });
}

$("#leaderboardsWrapper").click((e) => {
  if ($(e.target).attr("id") === "leaderboardsWrapper") {
    hideLeaderboards();
  }
});

$("#leaderboardsWrapper .buttons .button").click((e) => {
  currentLeaderboard = $(e.target).attr("board");
  updateLeaderboards();
});
