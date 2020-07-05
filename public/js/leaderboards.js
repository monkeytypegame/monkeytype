let currentLeaderboard = {
  mode: "words",
  words: "10",
  time: "15",
};

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
  $("#leaderboardsWrapper .leaderboardMode .button").removeClass("active");
  $(
    `#leaderboardsWrapper .leaderboardMode .button[mode=${currentLeaderboard.mode}]`
  ).addClass("active");

  $("#leaderboardsWrapper .leaderboardWords .button").removeClass("active");
  $(
    `#leaderboardsWrapper .leaderboardWords .button[words=${currentLeaderboard.words}]`
  ).addClass("active");

  $("#leaderboardsWrapper .leaderboardTime .button").removeClass("active");
  $(
    `#leaderboardsWrapper .leaderboardTime .button[time=${currentLeaderboard.time}]`
  ).addClass("active");

  if (currentLeaderboard.mode === "time") {
    $("#leaderboardsWrapper .leaderboardWords").addClass("hidden");
    $("#leaderboardsWrapper .leaderboardTime").removeClass("hidden");
  } else if (currentLeaderboard.mode === "words") {
    $("#leaderboardsWrapper .leaderboardWords").removeClass("hidden");
    $("#leaderboardsWrapper .leaderboardTime").addClass("hidden");
  }

  let mode2;
  if (currentLeaderboard.mode === "words") {
    mode2 = currentLeaderboard.words;
  } else if (currentLeaderboard.mode === "time") {
    mode2 = currentLeaderboard.time;
  }

  let uid = null;
  if (firebase.auth().currentUser !== null) {
    uid = firebase.auth().currentUser.uid;
  }

  showBackgroundLoader();
  Promise.all([
    firebase.functions().httpsCallable("getLeaderboard")({
      mode: currentLeaderboard.mode,
      mode2: mode2,
      type: "daily",
      uid: uid,
    }),
    firebase.functions().httpsCallable("getLeaderboard")({
      mode: currentLeaderboard.mode,
      mode2: mode2,
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

      $("#leaderboardsWrapper table.daily tbody").empty();
      if (dailyData.board !== undefined) {
        dailyData.board.forEach((entry, index) => {
          let meClassString = "";
          if (entry.currentUser) meClassString = ' class="me"';
          $("#leaderboardsWrapper table.daily tbody").append(`
          <tr>
          <td>${index + 1}</td>
          <td ${meClassString}>${entry.name}</td>
          <td>${entry.wpm}</td>
          <td>${entry.raw}</td>
          <td>${entry.acc}%</td>
          <td>${entry.mode} ${entry.mode2}</td>
          <td>${moment(entry.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
        </tr>
        `);
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

      //global
      $("#leaderboardsWrapper table.global tbody").empty();
      if (globalData.board !== undefined) {
        globalData.board.forEach((entry, index) => {
          let meClassString = "";
          if (entry.currentUser) meClassString = ' class="me"';
          $("#leaderboardsWrapper table.global tbody").append(`
          <tr>
          <td>${index + 1}</td>
          <td ${meClassString}>${entry.name}</td>
          <td>${entry.wpm}</td>
          <td>${entry.raw}</td>
          <td>${entry.acc}%</td>
          <td>${entry.mode} ${entry.mode2}</td>
          <td>${moment(entry.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
        </tr>
        `);
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
      showNotification("Something went wrong", 3000);
    });
}

$("#leaderboardsWrapper").click((e) => {
  if ($(e.target).attr("id") === "leaderboardsWrapper") {
    hideLeaderboards();
  }
});

$("#leaderboardsWrapper .leaderboardMode .button").click((e) => {
  currentLeaderboard.mode = $(e.target).attr("mode");
  updateLeaderboards();
});

$("#leaderboardsWrapper .leaderboardWords .button").click((e) => {
  currentLeaderboard.words = $(e.target).attr("words");
  updateLeaderboards();
});

$("#leaderboardsWrapper .leaderboardTime .button").click((e) => {
  currentLeaderboard.time = $(e.target).attr("time");
  updateLeaderboards();
});
