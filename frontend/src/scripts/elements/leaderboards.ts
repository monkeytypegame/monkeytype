import Ape from "../ape";
import * as DB from "../db";
import Config from "../config";
import * as Misc from "../misc";
import * as Notifications from "./notifications";

const currentLeaderboard = "time_15";

type LbKey = 15 | 60;

let currentData: {
  [key in LbKey]: MonkeyTypes.LeaderboardEntry[];
} = {
  15: [],
  60: [],
};

let currentRank: {
  [key in LbKey]: MonkeyTypes.LeaderboardEntry | Record<string, never>;
} = {
  15: {},
  60: {},
};

const requesting = {
  15: false,
  60: false,
};

const leaderboardSingleLimit = 50;

let updateTimer: number | undefined;

function clearTable(lb: number): void {
  if (lb === 15) {
    $("#leaderboardsWrapper table.left tbody").empty();
    $("#leaderboardsWrapper table.left tfoot").empty();
  } else if (lb === 60) {
    $("#leaderboardsWrapper table.right tbody").empty();
    $("#leaderboardsWrapper table.right tfoot").empty();
  }
}

function reset(): void {
  currentData = {
    15: [],
    60: [],
  };

  currentRank = {
    15: {},
    60: {},
  };
}

function stopTimer(): void {
  clearInterval(updateTimer);
  updateTimer = undefined;
  $("#leaderboards .subTitle").text("Next update in: --:--");
}

function updateTimerElement(): void {
  const date = new Date();
  const minutesToNextUpdate = 4 - (date.getMinutes() % 5);
  const secondsToNextUpdate = 60 - date.getSeconds();
  const totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
  $("#leaderboards .subTitle").text(
    "Next update in: " + Misc.secondsToString(totalSeconds, true)
  );
}

function startTimer(): void {
  updateTimerElement();
  updateTimer = setInterval(() => {
    updateTimerElement();
  }, 1000) as unknown as number;
}

function showLoader(lb: number): void {
  if (lb === 15) {
    $(`#leaderboardsWrapper .leftTableLoader`).removeClass("hidden");
  } else if (lb === 60) {
    $(`#leaderboardsWrapper .rightTableLoader`).removeClass("hidden");
  }
}

function hideLoader(lb: number): void {
  if (lb === 15) {
    $(`#leaderboardsWrapper .leftTableLoader`).addClass("hidden");
  } else if (lb === 60) {
    $(`#leaderboardsWrapper .rightTableLoader`).addClass("hidden");
  }
}

function updateFooter(lb: LbKey): void {
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
      (currentRank[lb]["rank"] / (currentRank[lb].count as number)) * 100
    );
    if (num == 0) {
      num = 0.01;
    }

    toppercent = `Top ${num}%`;
  }
  if (currentRank[lb]) {
    const entry = currentRank[lb];
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

function checkLbMemory(lb: LbKey): void {
  let side;
  if (lb === 15) {
    side = "left";
  } else {
    side = "right";
  }

  const memory = DB.getSnapshot()?.lbMemory?.time?.[lb]?.["english"] ?? 0;

  if (currentRank[lb]) {
    const difference = memory - currentRank[lb].rank;
    if (difference > 0) {
      DB.updateLbMemory("time", lb, "english", currentRank[lb].rank, true);
      if (memory !== 0) {
        $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
          ` (<i class="fas fa-fw fa-angle-up"></i>${Math.abs(
            difference
          )} since you last checked)`
        );
      }
    } else if (difference < 0) {
      DB.updateLbMemory("time", lb, "english", currentRank[lb].rank, true);
      if (memory !== 0) {
        $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
          ` (<i class="fas fa-fw fa-angle-down"></i>${Math.abs(
            difference
          )} since you last checked)`
        );
      }
    } else {
      if (memory !== 0) {
        $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
          ` ( = since you last checked)`
        );
      }
    }
  }
}

function fillTable(lb: LbKey, prepend?: number): void {
  if (!currentData[lb]) {
    return;
  }

  let side;
  if (lb === 15) {
    side = "left";
  } else {
    side = "right";
  }
  const loggedInUserName = DB.getSnapshot()?.name;

  let a = currentData[lb].length - leaderboardSingleLimit;
  let b = currentData[lb].length;
  if (a < 0) a = 0;
  if (prepend) {
    a = 0;
    b = prepend;
  }
  let html = "";
  for (let i = a; i < b; i++) {
    const entry = currentData[lb][i] as MonkeyTypes.LeaderboardEntry;
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

export function hide(): void {
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

async function update(): Promise<void> {
  $("#leaderboardsWrapper .buttons .button").removeClass("active");
  $(
    `#leaderboardsWrapper .buttons .button[board=${currentLeaderboard}]`
  ).addClass("active");

  showLoader(15);
  showLoader(60);

  const leaderboardRequests = [
    Ape.leaderboards.get("english", "time", "15", 0),
    Ape.leaderboards.get("english", "time", "60", 0),
  ];

  if (firebase.auth().currentUser) {
    leaderboardRequests.push(
      Ape.leaderboards.getRank("english", "time", "15"),
      Ape.leaderboards.getRank("english", "time", "60")
    );
  }

  const responses = await Promise.all(leaderboardRequests);

  const failedResponse = responses.find((response) => response.status !== 200);
  if (failedResponse) {
    return Notifications.add(
      "Failed to load leaderboards: " + failedResponse.message,
      -1
    );
  }

  const [lb15Data, lb60Data, lb15Rank, lb60Rank] = responses.map(
    (response) => response.data
  );

  currentData[15] = lb15Data;
  currentData[60] = lb60Data;
  currentRank[15] = lb15Rank;
  currentRank[60] = lb60Rank;

  const leaderboardKeys: LbKey[] = [15, 60];

  leaderboardKeys.forEach((leaderboardTime: LbKey) => {
    hideLoader(leaderboardTime);
    clearTable(leaderboardTime);
    updateFooter(leaderboardTime);
    checkLbMemory(leaderboardTime);
    fillTable(leaderboardTime);
  });

  $("#leaderboardsWrapper .leftTableWrapper").removeClass("invisible");
  $("#leaderboardsWrapper .rightTableWrapper").removeClass("invisible");
}

async function requestMore(lb: LbKey, prepend = false): Promise<void> {
  if (prepend && currentData[lb][0].rank === 1) return;
  if (requesting[lb]) return;
  requesting[lb] = true;
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

  const response = await Ape.leaderboards.get(
    "english",
    "time",
    lb,
    skipVal,
    limitVal
  );
  const data: MonkeyTypes.LeaderboardEntry[] = response.data;

  if (response.status !== 200 || data.length === 0) {
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
  requesting[lb] = false;
}

async function requestNew(lb: LbKey, skip: number): Promise<void> {
  showLoader(lb);

  const response = await Ape.leaderboards.get("english", "time", lb, skip);
  const data: MonkeyTypes.LeaderboardEntry[] = response.data;

  clearTable(lb);
  currentData[lb] = [];
  if (response.status !== 200 || data.length === 0) {
    hideLoader(lb);
    return;
  }
  currentData[lb] = data;
  fillTable(lb);
  hideLoader(lb);
}

export function show(): void {
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

$("#leaderboardsWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "leaderboardsWrapper") {
    hide();
  }
});

// $("#leaderboardsWrapper .buttons .button").on("click",(e) => {
//   currentLeaderboard = $(e.target).attr("board");
//   update();
// });

let leftScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").scroll((e) => {
  if (!leftScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (Math.round(elem.scrollTop() as number) <= 50) {
    requestMore(15, true);
  }
});

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").scroll((e) => {
  if (!leftScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (
    Math.round(elem[0].scrollHeight - (elem.scrollTop() as number)) <=
    Math.round(elem.outerHeight() as number) + 50
  ) {
    requestMore(15);
  }
});

let rightScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").scroll((e) => {
  if (!rightScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (Math.round(elem.scrollTop() as number) <= 50) {
    requestMore(60, true);
  }
});

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").scroll((e) => {
  const elem = $(e.currentTarget);
  if (
    Math.round(elem[0].scrollHeight - (elem.scrollTop() as number)) <=
    Math.round((elem.outerHeight() as number) + 50)
  ) {
    requestMore(60);
  }
});

$("#leaderboardsWrapper #leaderboards .leftTableJumpToTop").on(
  "click",
  async () => {
    leftScrollEnabled = false;
    $("#leaderboardsWrapper #leaderboards .leftTableWrapper").scrollTop(0);
    await requestNew(15, 0);
    leftScrollEnabled = true;
  }
);

$("#leaderboardsWrapper #leaderboards .leftTableJumpToMe").on(
  "click",
  async () => {
    if (currentRank[15].rank === undefined) return;
    leftScrollEnabled = false;
    await requestNew(15, currentRank[15].rank - leaderboardSingleLimit / 2);
    const rowHeight = $(
      "#leaderboardsWrapper #leaderboards .leftTableWrapper table tbody td"
    ).outerHeight() as number;
    $("#leaderboardsWrapper #leaderboards .leftTableWrapper").animate(
      {
        scrollTop:
          rowHeight *
            Math.min(currentRank[15].rank, leaderboardSingleLimit / 2) -
          ($(
            "#leaderboardsWrapper #leaderboards .leftTableWrapper"
          ).outerHeight() as number) /
            2.25,
      },
      0,
      () => {
        leftScrollEnabled = true;
      }
    );
  }
);

$("#leaderboardsWrapper #leaderboards .rightTableJumpToTop").on(
  "click",
  async () => {
    rightScrollEnabled = false;
    $("#leaderboardsWrapper #leaderboards .rightTableWrapper").scrollTop(0);
    await requestNew(60, 0);
    rightScrollEnabled = true;
  }
);

$("#leaderboardsWrapper #leaderboards .rightTableJumpToMe").on(
  "click",
  async () => {
    if (currentRank[60].rank === undefined) return;
    leftScrollEnabled = false;
    await requestNew(60, currentRank[60].rank - leaderboardSingleLimit / 2);
    const rowHeight = $(
      "#leaderboardsWrapper #leaderboards .rightTableWrapper table tbody td"
    ).outerHeight() as number;
    $("#leaderboardsWrapper #leaderboards .rightTableWrapper").animate(
      {
        scrollTop:
          rowHeight *
            Math.min(currentRank[60].rank, leaderboardSingleLimit / 2) -
          ($(
            "#leaderboardsWrapper #leaderboards .rightTableWrapper"
          ).outerHeight() as number) /
            2.25,
      },
      0,
      () => {
        leftScrollEnabled = true;
      }
    );
  }
);

$(document).on("click", "#top #menu .icon-button", (e) => {
  if ($(e.currentTarget).hasClass("leaderboards")) {
    show();
  }
  return false;
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && !$("#leaderboardsWrapper").hasClass("hidden")) {
    hide();
    event.preventDefault();
  }
});
