import Ape from "../ape";
import * as DB from "../db";
import Config from "../config";
import * as Misc from "../utils/misc";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";
import * as Notifications from "./notifications";
import format from "date-fns/format";
import { Auth } from "../firebase";
import differenceInSeconds from "date-fns/differenceInSeconds";
import { getHTMLById as getBadgeHTMLbyId } from "../controllers/badge-controller";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "../popups/skeleton";
import { debounce } from "throttle-debounce";

const wrapperId = "leaderboardsWrapper";

let currentTimeRange: "allTime" | "daily" = "allTime";
let currentLanguage = "english";
let showingYesterday = false;

type LbKey = "15" | "60";

let currentData: {
  [key in LbKey]: MonkeyTypes.LeaderboardEntry[];
} = {
  "15": [],
  "60": [],
};

interface GetRankResponse {
  minWpm: number;
  count: number;
  rank: number | null;
  entry: MonkeyTypes.LeaderboardEntry | null;
}

let currentRank: {
  [key in LbKey]: GetRankResponse | Record<string, never>;
} = {
  "15": {},
  "60": {},
};

let currentAvatars: {
  [key in LbKey]: (string | null)[];
} = {
  "15": [],
  "60": [],
};

const requesting = {
  "15": false,
  "60": false,
};

const leaderboardSingleLimit = 50;

let updateTimer: number | undefined;

function clearBody(lb: LbKey): void {
  if (lb === "15") {
    $("#leaderboardsWrapper table.left tbody").empty();
  } else if (lb === "60") {
    $("#leaderboardsWrapper table.right tbody").empty();
  }
}

function clearFoot(lb: LbKey): void {
  if (lb === "15") {
    $("#leaderboardsWrapper table.left tfoot").empty();
  } else if (lb === "60") {
    $("#leaderboardsWrapper table.right tfoot").empty();
  }
}

function reset(): void {
  currentData = {
    "15": [],
    "60": [],
  };

  currentRank = {
    "15": {},
    "60": {},
  };

  currentAvatars = {
    "15": [],
    "60": [],
  };
}

function stopTimer(): void {
  clearInterval(updateTimer);
  updateTimer = undefined;
  $("#leaderboards .subTitle").text("-");
}

function updateTimerElement(): void {
  if (currentTimeRange === "daily") {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    const dateNow = new Date();
    dateNow.setUTCMilliseconds(0);
    const diff = differenceInSeconds(date, dateNow);

    $("#leaderboards .subTitle").text(
      "Next reset in: " + Misc.secondsToString(diff, true)
    );
  } else {
    const date = new Date();
    const minutesToNextUpdate = 14 - (date.getMinutes() % 15);
    const secondsToNextUpdate = 60 - date.getSeconds();
    const totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
    $("#leaderboards .subTitle").text(
      "Next update in: " + Misc.secondsToString(totalSeconds, true)
    );
  }
}

function startTimer(): void {
  updateTimerElement();
  updateTimer = setInterval(() => {
    updateTimerElement();
  }, 1000) as unknown as number;
}

function showLoader(lb: LbKey): void {
  if (lb === "15") {
    $(`#leaderboardsWrapper .leftTableLoader`).removeClass("hidden");
  } else if (lb === "60") {
    $(`#leaderboardsWrapper .rightTableLoader`).removeClass("hidden");
  }
}

function hideLoader(lb: LbKey): void {
  if (lb === "15") {
    $(`#leaderboardsWrapper .leftTableLoader`).addClass("hidden");
  } else if (lb === "60") {
    $(`#leaderboardsWrapper .rightTableLoader`).addClass("hidden");
  }
}

function updateFooter(lb: LbKey): void {
  let side;
  if (lb === "15") {
    side = "left";
  } else {
    side = "right";
  }

  if (!Auth?.currentUser) {
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
      <td colspan="6" style="text-align:center;"></>
    </tr>
    `);
    return;
  }

  if (
    !Misc.isDevEnvironment() &&
    (DB.getSnapshot()?.typingStats?.timeTyping ?? 0) < 7200
  ) {
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
      <td colspan="6" style="text-align:center;">Your account must have 2 hours typed to be placed on the leaderboard.</>
    </tr>
    `);
    return;
  }

  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  if (DB.getSnapshot()?.lbOptOut === true) {
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
      <td colspan="6" style="text-align:center;">You have opted out of the leaderboards</>
    </tr>
    `);
    return;
  }

  const lbRank = currentRank[lb];

  if (
    currentTimeRange === "daily" &&
    lbRank !== null &&
    lbRank.minWpm === undefined
  ) {
    //old response format
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
      <td colspan="6" style="text-align:center;">Looks like the server returned data in a new format, please refresh</>
    </tr>
    `);
    return;
  }

  let toppercent;
  if (currentTimeRange === "allTime" && lbRank && lbRank?.rank) {
    const num = Misc.roundTo2(
      (lbRank.rank / (currentRank[lb].count as number)) * 100
    );
    if (currentRank[lb]["rank"] === 1) {
      toppercent = "GOAT";
    } else {
      toppercent = `Top ${num}%`;
    }
    toppercent = `<br><span class="sub">${toppercent}</span>`;
  }

  const entry = lbRank?.entry;
  if (entry) {
    const date = new Date(entry.timestamp);
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
    <td>${lbRank.rank}</td>
    <td><span class="top">You</span>${toppercent ? toppercent : ""}</td>
    <td class="alignRight">${typingSpeedUnit.fromWpm(entry.wpm).toFixed(2)}<br>
    <div class="sub">${entry.acc.toFixed(2)}%</div></td>
    <td class="alignRight">${typingSpeedUnit.fromWpm(entry.raw).toFixed(2)}<br>
    <div class="sub">${
      !entry.consistency || entry.consistency === "-"
        ? "-"
        : entry.consistency.toFixed(2) + "%"
    }</div></td>
    <td class="alignRight">${format(date, "dd MMM yyyy")}<br>
    <div class='sub'>${format(date, "HH:mm")}</div></td>
  </tr>
  `);
  } else if (currentTimeRange === "daily") {
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
      <td colspan="6" style="text-align:center;">Not qualified ${`(min speed required: ${currentRank[lb]?.minWpm} wpm)`}</>
    </tr>
    `);
  } else {
    $(`#leaderboardsWrapper table.${side} tfoot`).html(`
    <tr>
      <td colspan="6" style="text-align:center;">Not qualified</>
    </tr>
    `);
  }
}

function checkLbMemory(lb: LbKey): void {
  if (currentTimeRange === "daily") return;

  let side;
  if (lb === "15") {
    side = "left";
  } else {
    side = "right";
  }

  const memory = DB.getSnapshot()?.lbMemory?.time?.[lb]?.["english"] ?? 0;

  const rank = currentRank[lb]?.rank;
  if (rank) {
    const difference = memory - rank;
    if (difference > 0) {
      DB.updateLbMemory("time", lb, "english", rank, true);
      if (memory !== 0) {
        $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
          ` (<i class="fas fa-fw fa-angle-up"></i>${Math.abs(
            difference
          )} since you last checked)`
        );
      }
    } else if (difference < 0) {
      DB.updateLbMemory("time", lb, "english", rank, true);
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

async function fillTable(lb: LbKey): Promise<void> {
  if (!currentData[lb]) {
    return;
  }

  let side: string;
  if (lb === "15") {
    side = "left";
  } else {
    side = "right";
  }

  if (currentData[lb].length === 0) {
    $(`#leaderboardsWrapper table.${side} tbody`).html(
      "<tr><td colspan='7'>No results found</td></tr>"
    );
  }

  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  const loggedInUserName = DB.getSnapshot()?.name;

  let html = "";
  for (let i = 0; i < currentData[lb].length; i++) {
    const entry = currentData[lb][i] as MonkeyTypes.LeaderboardEntry;
    if (!entry) {
      break;
    }
    if (entry.hidden) return;
    let meClassString = "";
    if (entry.name === loggedInUserName) {
      meClassString = ' class="me"';
    }
    const date = new Date(entry.timestamp);

    if (currentTimeRange === "daily" && !entry.rank) {
      entry.rank = i + 1;
    }

    let avatar = `<div class="avatarPlaceholder"><i class="fas fa-user-circle"></i></div>`;

    if (entry.discordAvatar) {
      avatar = `<div class="avatarPlaceholder"><i class="fas fa-circle-notch fa-spin"></i></div>`;
    }

    html += `
    <tr ${meClassString}>
    <td>${
      entry.rank === 1 ? '<i class="fas fa-fw fa-crown"></i>' : entry.rank
    }</td>
    <td>
    <div class="avatarNameBadge">
      <div class="lbav">${avatar}</div>
      <a href="${location.origin}/profile/${
      entry.uid
    }?isUid" class="entryName" uid=${entry.uid} router-link>${entry.name}</a>
      ${entry.badgeId ? getBadgeHTMLbyId(entry.badgeId) : ""}
    </div>
    </td>
    <td class="alignRight">${typingSpeedUnit.fromWpm(entry.wpm).toFixed(2)}<br>
    <div class="sub">${entry.acc.toFixed(2)}%</div></td>
    <td class="alignRight">${typingSpeedUnit.fromWpm(entry.raw).toFixed(2)}<br>
    <div class="sub">${
      !entry.consistency || entry.consistency === "-"
        ? "-"
        : entry.consistency.toFixed(2) + "%"
    }</div></td>
    <td class="alignRight">${format(date, "dd MMM yyyy")}<br>
    <div class='sub'>${format(date, "HH:mm")}</div></td>
  </tr>
  `;
  }
  $(`#leaderboardsWrapper table.${side} tbody`).html(html);
}

const showYesterdayButton = $("#leaderboardsWrapper .showYesterdayButton");
const showYesterdayButtonText = $(
  "#leaderboardsWrapper .showYesterdayButton .text"
);

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
        clearBody("15");
        clearBody("60");
        clearFoot("15");
        clearFoot("60");
        reset();
        stopTimer();
        showingYesterday = false;
        updateYesterdayButton();
        $("#leaderboardsWrapper").addClass("hidden");
        Skeleton.remove(wrapperId);
      }
    );
}

function updateTitle(): void {
  const el = $("#leaderboardsWrapper .mainTitle");

  const timeRangeString = currentTimeRange === "daily" ? "Daily" : "All-Time";
  const capitalizedLanguage =
    currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);

  let text = `${timeRangeString} ${capitalizedLanguage} Leaderboards`;

  if (showingYesterday && currentTimeRange !== "allTime") {
    text += " (Yesterday)";
  }

  el.text(text);
}

function updateYesterdayButton(): void {
  showYesterdayButton.addClass("hidden");
  if (currentTimeRange === "daily") {
    showYesterdayButton.removeClass("hidden");
  }
  if (showingYesterday) {
    showYesterdayButtonText.text("Show today");
  } else {
    showYesterdayButtonText.text("Show yesterday");
  }
}

function getDailyLeaderboardQuery(): { isDaily: boolean; daysBefore: number } {
  const isDaily = currentTimeRange === "daily";
  const isViewingDailyAndButtonIsActive = isDaily && showingYesterday;
  const daysBefore = isViewingDailyAndButtonIsActive ? 1 : 0;

  return {
    isDaily,
    daysBefore,
  };
}

async function update(): Promise<void> {
  leftScrollEnabled = false;
  rightScrollEnabled = false;

  showLoader("15");
  showLoader("60");

  const timeModes = ["15", "60"];

  const leaderboardRequests = timeModes.map(async (mode2) => {
    return Ape.leaderboards.get({
      language: currentLanguage,
      mode: "time",
      mode2,
      ...getDailyLeaderboardQuery(),
    });
  });

  if (Auth?.currentUser) {
    leaderboardRequests.push(
      ...timeModes.map(async (mode2) => {
        return Ape.leaderboards.getRank({
          language: currentLanguage,
          mode: "time",
          mode2,
          ...getDailyLeaderboardQuery(),
        });
      })
    );
  }

  const responses = await Promise.all(leaderboardRequests);

  const failedResponse = responses.find((response) => response.status !== 200);
  if (failedResponse) {
    hideLoader("15");
    hideLoader("60");
    return Notifications.add(
      "Failed to load leaderboards: " + failedResponse.message,
      -1
    );
  }

  const [lb15Data, lb60Data, lb15Rank, lb60Rank] = responses.map(
    (response) => response.data
  );

  currentData["15"] = lb15Data;
  currentData["60"] = lb60Data;
  currentRank["15"] = lb15Rank;
  currentRank["60"] = lb60Rank;

  const leaderboardKeys: LbKey[] = ["15", "60"];

  leaderboardKeys.forEach((lbKey) => {
    hideLoader(lbKey);
    clearBody(lbKey);
    updateFooter(lbKey);
    checkLbMemory(lbKey);
    fillTable(lbKey);

    getAvatarUrls(currentData[lbKey]).then((urls) => {
      currentAvatars[lbKey] = urls;
      fillAvatars(lbKey);
    });
  });

  $("#leaderboardsWrapper .leftTableWrapper").removeClass("invisible");
  $("#leaderboardsWrapper .rightTableWrapper").removeClass("invisible");

  updateTitle();
  updateYesterdayButton();
  $("#leaderboardsWrapper .buttons .button").removeClass("active");
  $(
    `#leaderboardsWrapper .buttonGroup.timeRange .button.` + currentTimeRange
  ).addClass("active");
  $("#leaderboardsWrapper #leaderboards .leftTableWrapper").scrollTop(0);
  $("#leaderboardsWrapper #leaderboards .rightTableWrapper").scrollTop(0);

  leftScrollEnabled = true;
  rightScrollEnabled = true;
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

  const response = await Ape.leaderboards.get({
    language: currentLanguage,
    mode: "time",
    mode2: lb,
    skip: skipVal,
    limit: limitVal,
    ...getDailyLeaderboardQuery(),
  });
  const data: MonkeyTypes.LeaderboardEntry[] = response.data;

  if (response.status !== 200 || data.length === 0) {
    hideLoader(lb);
    requesting[lb] = false;
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
  await fillTable(lb);

  getAvatarUrls(data).then((urls) => {
    if (prepend) {
      currentAvatars[lb].unshift(...urls);
    } else {
      currentAvatars[lb].push(...urls);
    }
    fillAvatars(lb);
  });

  hideLoader(lb);
  requesting[lb] = false;
}

async function requestNew(lb: LbKey, skip: number): Promise<void> {
  showLoader(lb);

  const response = await Ape.leaderboards.get({
    language: currentLanguage,
    mode: "time",
    mode2: lb,
    skip,
    ...getDailyLeaderboardQuery(),
  });
  const data: MonkeyTypes.LeaderboardEntry[] = response.data;

  if (response.status === 503) {
    Notifications.add(
      "Leaderboards are currently updating - please try again later",
      -1
    );
    return;
  }

  clearBody(lb);
  currentData[lb] = [];
  currentAvatars[lb] = [];
  if (response.status !== 200 || data.length === 0) {
    hideLoader(lb);
    return;
  }
  currentData[lb] = data;
  await fillTable(lb);

  getAvatarUrls(data).then((urls) => {
    currentAvatars[lb] = urls;
    fillAvatars(lb);
  });

  hideLoader(lb);
}

async function getAvatarUrls(
  data: MonkeyTypes.LeaderboardEntry[]
): Promise<(string | null)[]> {
  return Promise.allSettled(
    data.map(async (entry) =>
      Misc.getDiscordAvatarUrl(entry.discordId, entry.discordAvatar)
    )
  ).then((promises) => {
    return promises.map((promise) => {
      if (promise.status === "fulfilled") {
        return promise.value;
      }
      return null;
    });
  });
}

function fillAvatars(lb: LbKey): void {
  const side = lb === "15" ? "left" : "right";
  const elements = $(`#leaderboardsWrapper table.${side} tbody .lbav`);
  currentAvatars[lb].forEach((url, index) => {
    if (url !== null) {
      $(elements[index]).html(
        `<div class="avatar" style="background-image:url(${url})"></div>`
      );
    } else {
      $(elements[index]).html(
        `<div class="avatarPlaceholder"><i class="fas fa-user-circle"></i></div>`
      );
    }
  });
}

export function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You can't view leaderboards while offline", 0);
    return;
  }
  Skeleton.append(wrapperId);
  if (!Misc.isPopupVisible("leaderboardsWrapper")) {
    if (Auth?.currentUser) {
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
    $("#leaderboards table thead tr td:nth-child(3)").html(
      Config.typingSpeedUnit + '<br><div class="sub">accuracy</div>'
    );
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

const languageSelector = $(
  "#leaderboardsWrapper #leaderboards .leaderboardsTop .buttonGroup.timeRange .languageSelect"
).select2({
  placeholder: "select a language",
  width: "100%",
  data: [
    {
      id: "english",
      text: "english",
      selected: true,
    },
    {
      id: "spanish",
      text: "spanish",
    },
    {
      id: "german",
      text: "german",
    },
    {
      id: "french",
      text: "french",
    },
    {
      id: "portuguese",
      text: "portuguese",
    },
    {
      id: "indonesian",
      text: "indonesian",
    },
    {
      id: "italian",
      text: "italian",
    },
    {
      id: "russian",
      text: "russian",
    },
  ],
});

languageSelector.on("select2:select", (e) => {
  currentLanguage = e.params.data.id;
  updateTitle();
  update();
});

let leftScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").on("scroll", (e) => {
  if (!leftScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (Math.round(elem.scrollTop() as number) <= 50) {
    debouncedRequestMore("15", true);
  }
});

const debouncedRequestMore = debounce(500, requestMore);

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").on("scroll", (e) => {
  if (!leftScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (
    Math.round(elem[0].scrollHeight - (elem.scrollTop() as number)) <=
    Math.round(elem.outerHeight() as number) + 50
  ) {
    debouncedRequestMore("15");
  }
});

let rightScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").on("scroll", (e) => {
  if (!rightScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (Math.round(elem.scrollTop() as number) <= 50) {
    debouncedRequestMore("60", true);
  }
});

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").on("scroll", (e) => {
  const elem = $(e.currentTarget);
  if (
    Math.round(elem[0].scrollHeight - (elem.scrollTop() as number)) <=
    Math.round((elem.outerHeight() as number) + 50)
  ) {
    debouncedRequestMore("60");
  }
});

$("#leaderboardsWrapper #leaderboards .leftTableJumpToTop").on(
  "click",
  async () => {
    leftScrollEnabled = false;
    $("#leaderboardsWrapper #leaderboards .leftTableWrapper").scrollTop(0);
    await requestNew("15", 0);
    leftScrollEnabled = true;
  }
);

$("#leaderboardsWrapper #leaderboards .leftTableJumpToMe").on(
  "click",
  async () => {
    if (!currentRank["15"]?.rank) return;
    leftScrollEnabled = false;
    await requestNew("15", currentRank["15"].rank - leaderboardSingleLimit / 2);
    const rowHeight = $(
      "#leaderboardsWrapper #leaderboards .leftTableWrapper table tbody td"
    ).outerHeight() as number;
    $("#leaderboardsWrapper #leaderboards .leftTableWrapper").animate(
      {
        scrollTop:
          rowHeight *
            Math.min(currentRank["15"].rank, leaderboardSingleLimit / 2) -
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
    await requestNew("60", 0);
    rightScrollEnabled = true;
  }
);

$("#leaderboardsWrapper #leaderboards .rightTableJumpToMe").on(
  "click",
  async () => {
    if (!currentRank["60"]?.rank) return;
    leftScrollEnabled = false;
    await requestNew("60", currentRank["60"].rank - leaderboardSingleLimit / 2);
    const rowHeight = $(
      "#leaderboardsWrapper #leaderboards .rightTableWrapper table tbody td"
    ).outerHeight() as number;
    $("#leaderboardsWrapper #leaderboards .rightTableWrapper").animate(
      {
        scrollTop:
          rowHeight *
            Math.min(currentRank["60"].rank, leaderboardSingleLimit / 2) -
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

$(
  "#leaderboardsWrapper #leaderboards .leaderboardsTop .buttonGroup.timeRange .allTime"
).on("click", () => {
  currentTimeRange = "allTime";
  currentLanguage = "english";
  languageSelector.prop("disabled", true);
  languageSelector.val("english");
  languageSelector.trigger("change");
  update();
});

$(
  "#leaderboardsWrapper #leaderboards .leaderboardsTop .buttonGroup.timeRange .daily"
).on("click", () => {
  currentTimeRange = "daily";
  updateYesterdayButton();
  languageSelector.prop("disabled", false);
  update();
});

$("#leaderboardsWrapper .showYesterdayButton").on("click", () => {
  showingYesterday = !showingYesterday;
  update();
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && Misc.isPopupVisible("leaderboardsWrapper")) {
    hide();
    event.preventDefault();
  }
});

$("header nav").on("click", ".textButton", (e) => {
  if ($(e.currentTarget).hasClass("leaderboards")) {
    show();
  }
});

Skeleton.save(wrapperId);
