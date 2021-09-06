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

let currentlyShown = {
  15: 0,
  60: 0,
};

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

  Loader.show();
  Promise.all([
    axiosInstance.get(`/leaderboard`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "15",
      },
    }),
    axiosInstance.get(`/leaderboard`, {
      params: {
        language: "english",
        mode: "time",
        mode2: "60",
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
      Loader.hide();
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

export function loadMore(lb) {
  let side;
  if (lb === 15) {
    side = "left";
  } else {
    side = "right";
  }
  let loggedInUserName = DB.getSnapshot()?.name;
  let loaded = 0;
  for (let i = currentlyShown[lb]; i < currentlyShown[lb] + 20; i++) {
    let entry = currentData[lb][i];
    if (!entry) {
      break;
    }
    if (entry.hidden) return;
    let meClassString = "";
    if (entry.name == loggedInUserName) {
      meClassString = ' class="me"';
    }
    $(`#leaderboardsWrapper table.${side} tbody`).append(`
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
  `);
    loaded++;
  }
  currentlyShown[lb] += loaded;
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

function reset() {
  currentData = {
    15: [],
    60: [],
  };

  currentRank = {
    15: {},
    60: {},
  };

  currentlyShown = {
    15: 0,
    60: 0,
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

$("#leaderboardsWrapper").click((e) => {
  if ($(e.target).attr("id") === "leaderboardsWrapper") {
    hide();
  }
});

// $("#leaderboardsWrapper .buttons .button").click((e) => {
//   currentLeaderboard = $(e.target).attr("board");
//   update();
// });

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").scroll((e) => {
  let elem = $(e.currentTarget);
  if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
    loadMore(15);
    console.log("scrolled to the bottom");
  }
});
