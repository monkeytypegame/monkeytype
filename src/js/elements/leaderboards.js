import * as Loader from "./loader";
import * as Notifications from "./notifications";
import * as DB from "./db";
import axiosInstance from "./axios-instance";
import * as Misc from "./misc";
import Config from "./config";

let currentLeaderboard = "time_15";

let currentData = {
  15: [],
  60: [],
};

let currentRank = {
  15: {},
  60: {},
};

let leaderboardSingleLimit = 50;

let updateTimer;

function clearTable(lb) {
  if (lb === 15) {
    $("#leaderboardsWrapper table.left tbody").empty();
  } else if (lb === 60) {
    $("#leaderboardsWrapper table.right tbody").empty();
  }
}

function reset() {
  currentData = {
    15: [],
    60: [],
  };

  currentRank = {
    15: {},
    60: {},
  };
}

function stopTimer() {
  clearInterval(updateTimer);
  updateTimer = undefined;
  $("#leaderboards .subTitle").text("Next update in: --:--");
}

function updateTimerElement() {
  let date = new Date();
  let minutesToNextUpdate = 4 - (date.getMinutes() % 5);
  let secondsToNextUpdate = 60 - date.getSeconds();
  let totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
  $("#leaderboards .subTitle").text(
    "Next update in: " + Misc.secondsToString(totalSeconds, true)
  );
}

function startTimer() {
  updateTimerElement();
  updateTimer = setInterval(() => {
    updateTimerElement();
  }, 1000);
}

function showLoader(lb) {
  if (lb === 15) {
    $(`#leaderboardsWrapper .leftTableLoader`).removeClass("hidden");
  } else if (lb === 60) {
    $(`#leaderboardsWrapper .rightTableLoader`).removeClass("hidden");
  }
}

function hideLoader(lb) {
  if (lb === 15) {
    $(`#leaderboardsWrapper .leftTableLoader`).addClass("hidden");
  } else if (lb === 60) {
    $(`#leaderboardsWrapper .rightTableLoader`).addClass("hidden");
  }
}

function updateFooter(lb) {
  let side;
  if (lb === 15) {
    side = "left";
  } else {
    side = "right";
  }
  $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
      <td><br><br></td>
      <td colspan="4" style="text-align:center;">Not qualified</>
      <td><br><br></td>
    </tr>
    `);
  let toppercent;
  if (currentRank[lb]) {
    let num = Misc.roundTo2(
      (currentRank[lb].rank / currentRank[lb].count) * 100
    );
    if (num == 0) {
      num = 0.01;
    }

    toppercent = `Top ${num}%`;
  }
  if (currentRank[lb]) {
    let entry = currentRank[lb];
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
    <td>${entry.rank}</td>
    <td><span class="top">You</span><br><span class="sub">${toppercent}</span></td>
    <td class="alignRight">${(Config.alwaysShowCPM
      ? entry.wpm * 5
      : entry.wpm
    ).toFixed(2)}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
    <td class="alignRight">${(Config.alwaysShowCPM
      ? entry.raw * 5
      : entry.raw
    ).toFixed(2)}<br><div class="sub">${
      !entry.consistency || entry.consistency === "-"
        ? "-"
        : entry.consistency.toFixed(2) + "%"
    }</div></td>
    <td class="alignRight">time<br><div class="sub">${lb}</div></td>
    <td class="alignRight">${moment(entry.timestamp).format(
      "DD MMM YYYY"
    )}<br><div class='sub'>${moment(entry.timestamp).format("HH:mm")}</div></td>
  </tr>
  `);
  }
}

function checkLbMemory(lb) {
  let side;
  if (lb === 15) {
    side = "left";
  } else {
    side = "right";
  }

  let memory = DB.getSnapshot()?.lbMemory?.time?.[lb]?.english;

  if (memory && currentRank[lb]) {
    let difference = memory - currentRank[lb].rank;
    if (difference > 0) {
      DB.updateLbMemory("time", lb, "english", currentRank[lb].rank, true);
      $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
        ` (<i class="fas fa-fw fa-angle-up"></i>${Math.abs(
          difference
        )} since you last checked)`
      );
    } else if (difference < 0) {
      DB.updateLbMemory("time", lb, "english", currentRank[lb].rank, true);
      $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
        ` (<i class="fas fa-fw fa-angle-down"></i>${Math.abs(
          difference
        )} since you last checked)`
      );
    } else {
      $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
        ` ( = since you last checked)`
      );
    }
  }
}

function fillTable(lb, prepend) {
  let side;
  if (lb === 15) {
    side = "left";
  } else {
    side = "right";
  }
  let loggedInUserName = DB.getSnapshot()?.name;

  let a = currentData[lb].length - leaderboardSingleLimit;
  let b = currentData[lb].length;
  if (a < 0) a = 0;
  if (prepend) {
    a = 0;
    b = prepend;
  }
  let html = "";
  for (let i = a; i < b; i++) {
    let entry = currentData[lb][i];
    if (!entry) {
      break;
    }
    if (entry.hidden) return;
    let meClassString = "";
    if (entry.name == loggedInUserName) {
      meClassString = ' class="me"';
    }
    html += `
    <tr ${meClassString}>
    <td>${
      entry.rank === 1 ? '<i class="fas fa-fw fa-crown"></i>' : entry.rank
    }</td>
    <td>${entry.name}</td>
    <td class="alignRight">${(Config.alwaysShowCPM
      ? entry.wpm * 5
      : entry.wpm
    ).toFixed(2)}<br><div class="sub">${entry.acc.toFixed(2)}%</div></td>
    <td class="alignRight">${(Config.alwaysShowCPM
      ? entry.raw * 5
      : entry.raw
    ).toFixed(2)}<br><div class="sub">${
      !entry.consistency || entry.consistency === "-"
        ? "-"
        : entry.consistency.toFixed(2) + "%"
    }</div></td>
    <td class="alignRight">time<br><div class="sub">${lb}</div></td>
    <td class="alignRight">${moment(entry.timestamp).format(
      "DD MMM YYYY"
    )}<br><div class='sub'>${moment(entry.timestamp).format("HH:mm")}</div></td>
  </tr>
  `;
  }
  if (!prepend) {
    $(`#leaderboardsWrapper table.${side} tbody`).append(html);
  } else {
    $(`#leaderboardsWrapper table.${side} tbody`).prepend(html);
  }
}

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
        clearTable(15);
        clearTable(60);
        reset();
        stopTimer();
        $("#leaderboardsWrapper").addClass("hidden");
      }
    );
}

function update() {
  $("#leaderboardsWrapper .buttons .button").removeClass("active");
  $(
    `#leaderboardsWrapper .buttons .button[board=${currentLeaderboard}]`
  ).addClass("active");

  // Loader.show();
  showLoader(15);
  showLoader(60);

  let requestsToAwait = [
    axiosInstance.get(`/leaderboard`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "15",
        skip: 0,
      },
    }),
    axiosInstance.get(`/leaderboard`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "60",
        skip: 0,
      },
    }),
  ];

  if (firebase.auth().currentUser) {
    requestsToAwait.push(
      axiosInstance.get(`/leaderboard/rank`, {
        params: {
          language: "english",
          mode: "time",
          mode2: "15",
        },
      })
    );
    requestsToAwait.push(
      axiosInstance.get(`/leaderboard/rank`, {
        params: {
          language: "english",
          mode: "time",
          mode2: "60",
        },
      })
    );
  }

  Promise.all(requestsToAwait)
    .then((lbdata) => {
      // Loader.hide();
      hideLoader(15);
      hideLoader(60);
      currentData[15] = lbdata[0]?.data;
      currentData[60] = lbdata[1]?.data;
      currentRank[15] = lbdata[2]?.data;
      currentRank[60] = lbdata[3]?.data;

      clearTable(15);
      clearTable(60);
      updateFooter(15);
      updateFooter(60);
      checkLbMemory(15);
      checkLbMemory(60);
      fillTable(15);
      fillTable(60);
      $("#leaderboardsWrapper .leftTableWrapper").removeClass("invisible");
      $("#leaderboardsWrapper .rightTableWrapper").removeClass("invisible");
    })
    .catch((e) => {
      console.log(e);
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to load leaderboards: " + msg, -1);
      return;
    });
}

async function requestMore(lb, prepend = false) {
  if (prepend && currentData[lb][0].rank === 1) return;
  showLoader(lb);
  let skipVal = currentData[lb][currentData[lb].length - 1].rank;
  if (prepend) {
    skipVal = currentData[lb][0].rank - leaderboardSingleLimit;
  }
  let limitVal;
  if (skipVal < 0) {
    limitVal = Math.abs(skipVal) - 1;
    skipVal = 0;
  }
  let data = await axiosInstance.get(`/leaderboard`, {
    params: {
      language: "english",
      mode: "time",
      mode2: lb,
      skip: skipVal,
      limit: limitVal,
    },
  });
  data = data.data;
  if (data.length === 0) {
    hideLoader(lb);
    return;
  }
  if (prepend) {
    currentData[lb].unshift(...data);
  } else {
    currentData[lb].push(...data);
  }
  if (prepend && !limitVal) {
    limitVal = leaderboardSingleLimit - 1;
  }
  fillTable(lb, limitVal);
  hideLoader(lb);
}

async function requestNew(lb, skip) {
  showLoader(lb);
  let data = await axiosInstance.get(`/leaderboard`, {
    params: {
      language: "english",
      mode: "time",
      mode2: lb,
      skip: skip,
    },
  });
  clearTable(lb);
  if (lb === 15) {
    currentData = {
      15: [],
    };
  } else if (lb === 60) {
    currentData = {
      60: [],
    };
  }
  data = data.data;
  if (data.length === 0) {
    hideLoader(lb);
    return;
  }
  currentData[lb] = data;
  fillTable(lb);
  hideLoader(lb);
}

export function show() {
  if ($("#leaderboardsWrapper").hasClass("hidden")) {
    if (firebase.auth().currentUser) {
      $("#leaderboardsWrapper #leaderboards .rightTableJumpToMe").removeClass(
        "disabled"
      );
      $("#leaderboardsWrapper #leaderboards .leftTableJumpToMe").removeClass(
        "disabled"
      );
    } else {
      $("#leaderboardsWrapper #leaderboards .rightTableJumpToMe").addClass(
        "disabled"
      );
      $("#leaderboardsWrapper #leaderboards .leftTableJumpToMe").addClass(
        "disabled"
      );
    }
    if (Config.alwaysShowCPM) {
      $("#leaderboards table thead tr td:nth-child(3)").html(
        'cpm<br><div class="sub">accuracy</div>'
      );
    } else {
      $("#leaderboards table thead tr td:nth-child(3)").html(
        'wpm<br><div class="sub">accuracy</div>'
      );
    }
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
          startTimer();
        }
      );
  }
}

$("#leaderboardsWrapper").click((e) => {
  if ($(e.target).attr("id") === "leaderboardsWrapper") {
    hide();
  }
});

// $("#leaderboardsWrapper .buttons .button").click((e) => {
//   currentLeaderboard = $(e.target).attr("board");
//   update();
// });

let leftScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").scroll((e) => {
  if (!leftScrollEnabled) return;
  let elem = $(e.currentTarget);
  if (elem.scrollTop() == 0) {
    requestMore(15, true);
  }
});

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").scroll((e) => {
  if (!leftScrollEnabled) return;
  let elem = $(e.currentTarget);
  if (elem[0].scrollHeight - elem.scrollTop() <= elem.outerHeight()) {
    requestMore(15);
  }
});

let rightScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").scroll((e) => {
  if (!rightScrollEnabled) return;
  let elem = $(e.currentTarget);
  if (elem.scrollTop() == 0) {
    requestMore(60, true);
  }
});

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").scroll((e) => {
  let elem = $(e.currentTarget);
  if (elem[0].scrollHeight - elem.scrollTop() <= elem.outerHeight()) {
    requestMore(60);
  }
});

$("#leaderboardsWrapper #leaderboards .leftTableJumpToTop").click(async (e) => {
  leftScrollEnabled = false;
  $("#leaderboardsWrapper #leaderboards .leftTableWrapper").scrollTop(0);
  await requestNew(15, 0);
  leftScrollEnabled = true;
});

$("#leaderboardsWrapper #leaderboards .leftTableJumpToMe").click(async (e) => {
  if (currentRank[15].rank === undefined) return;
  leftScrollEnabled = false;
  await requestNew(15, currentRank[15].rank - leaderboardSingleLimit / 2);
  let rowHeight = $(
    "#leaderboardsWrapper #leaderboards .leftTableWrapper table tbody td"
  ).outerHeight();
  $("#leaderboardsWrapper #leaderboards .leftTableWrapper").animate(
    {
      scrollTop:
        rowHeight * Math.min(currentRank[15].rank, leaderboardSingleLimit / 2) -
        $(
          "#leaderboardsWrapper #leaderboards .leftTableWrapper"
        ).outerHeight() /
          2.25,
    },
    0,
    () => {
      leftScrollEnabled = true;
    }
  );
});

$("#leaderboardsWrapper #leaderboards .rightTableJumpToTop").click(
  async (e) => {
    rightScrollEnabled = false;
    $("#leaderboardsWrapper #leaderboards .rightTableWrapper").scrollTop(0);
    await requestNew(60, 0);
    rightScrollEnabled = true;
  }
);

$("#leaderboardsWrapper #leaderboards .rightTableJumpToMe").click(async (e) => {
  if (currentRank[60].rank === undefined) return;
  leftScrollEnabled = false;
  await requestNew(60, currentRank[60].rank - leaderboardSingleLimit / 2);
  let rowHeight = $(
    "#leaderboardsWrapper #leaderboards .rightTableWrapper table tbody td"
  ).outerHeight();
  $("#leaderboardsWrapper #leaderboards .rightTableWrapper").animate(
    {
      scrollTop:
        rowHeight * Math.min(currentRank[60].rank, leaderboardSingleLimit / 2) -
        $(
          "#leaderboardsWrapper #leaderboards .rightTableWrapper"
        ).outerHeight() /
          2.25,
    },
    0,
    () => {
      leftScrollEnabled = true;
    }
  );
});
