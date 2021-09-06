import * as Loader from "./loader";
import * as Notifications from "./notifications";
import * as DB from "./db";
import axiosInstance from "./axios-instance";

let currentLeaderboard = "time_15";

let currentData = {
  15: [],
  60: [],
};

let currentRank = {
  15: {},
  60: {},
};

let leaderboardSingleLimit = 30;

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
  Promise.all([
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
    axiosInstance.get(`/leaderboard/rank`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "15",
      },
    }),
    axiosInstance.get(`/leaderboard/rank`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "60",
      },
    }),
  ])
    .then((lbdata) => {
      // Loader.hide();
      hideLoader(15);
      hideLoader(60);
      currentData[15] = lbdata[0].data;
      currentData[60] = lbdata[1].data;
      currentRank[15] = lbdata[2].data;
      currentRank[60] = lbdata[3].data;

      clearTable(15);
      clearTable(60);
      updateFooter(15);
      updateFooter(60);
      loadMore(15);
      loadMore(60);
    })
    .catch((e) => {
      console.log(e);
      Loader.hide();
      let msg = e?.response?.data?.message ?? e.message;
      Notifications.add("Failed to load leaderboards: " + msg, -1);
      return;
    });
}

export function clearTable(lb) {
  if (lb === 15) {
    $("#leaderboardsWrapper table.left tbody").empty();
  } else if (lb === 60) {
    $("#leaderboardsWrapper table.right tbody").empty();
  }
}

export function loadMore(lb, prepend) {
  let side;
  if (lb === 15) {
    side = "left";
  } else {
    side = "right";
  }
  let loggedInUserName = DB.getSnapshot()?.name;
  let loaded = 0;

  let a = currentData[lb].length - leaderboardSingleLimit;
  let b = currentData[lb].length;
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
    <tr>
    <td>${
      entry.rank === 1 ? '<i class="fas fa-fw fa-crown"></i>' : entry.rank
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

export function updateFooter(lb) {
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
  if (currentRank[lb]) {
    let entry = currentRank[lb];
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
    <td>${entry.rank}</td>
    <td>You</td>
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
    )}<br><div class='sub'>${moment(entry.timestamp).format("HH:mm")}</div></td>
  </tr>
  `);
  }
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
      mode2: "15",
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
  loadMore(lb, limitVal);
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
  loadMore(lb);
  hideLoader(lb);
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
  if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
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
  if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
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
  $("#leaderboardsWrapper #leaderboards .leftTableWrapper").animate(
    {
      scrollTop:
        $("#leaderboardsWrapper #leaderboards .leftTableWrapper")[0]
          .scrollHeight /
          2 -
        $(
          "#leaderboardsWrapper #leaderboards .leftTableWrapper"
        ).outerHeight() /
          2,
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
  rightScrollEnabled = false;
  await requestNew(60, currentRank[60].rank - leaderboardSingleLimit / 2);
  $("#leaderboardsWrapper #leaderboards .rightTableWrapper").animate(
    {
      scrollTop:
        $("#leaderboardsWrapper #leaderboards .rightTableWrapper")[0]
          .scrollHeight /
          2 -
        $(
          "#leaderboardsWrapper #leaderboards .rightTableWrapper"
        ).outerHeight() /
          2,
    },
    0,
    () => {
      rightScrollEnabled = true;
    }
  );
});
