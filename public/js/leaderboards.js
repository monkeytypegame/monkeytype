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

  showBackgroundLoader();
  firebase
    .functions()
    .httpsCallable("getLeaderboard")({
      mode: currentLeaderboard.mode,
      mode2: mode2,
      type: "global",
    })
    .then((data) => {
      console.log(data);
      hideBackgroundLoader();
      $("#leaderboardsWrapper table.global tbody").empty();
      data.data.board.forEach((entry, index) => {
        $("#leaderboardsWrapper table.global tbody").append(`
        <tr>
        <td>${index + 1}</td>
        <td>${entry.name}</td>
        <td>${entry.wpm}</td>
        <td>${entry.raw}</td>
        <td>${entry.acc}</td>
        <td>${entry.mode} ${entry.mode2}</td>
        <td>${moment(entry.timestamp).format("DD MMM YYYY<br>HH:mm")}</td>
      </tr>
      `);
      });
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
