import Ape from "../ape";
import * as DB from "../db";
import Config from "../config";
import * as DateTime from "../utils/date-and-time";
import * as Misc from "../utils/misc";
import * as Arrays from "../utils/arrays";
import * as Numbers from "@monkeytype/util/numbers";
import * as Notifications from "./notifications";
import { format } from "date-fns/format";
import { isAuthenticated } from "../firebase";
import { differenceInSeconds } from "date-fns/differenceInSeconds";
import { getHTMLById as getBadgeHTMLbyId } from "../controllers/badge-controller";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "../utils/skeleton";
import { debounce } from "throttle-debounce";
import Format from "../utils/format";
import SlimSelect from "slim-select";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import {
  LeaderboardEntry,
  LeaderboardRank,
} from "@monkeytype/contracts/schemas/leaderboards";
import { Mode } from "@monkeytype/contracts/schemas/shared";

const wrapperId = "leaderboardsWrapper";

let currentTimeRange: "allTime" | "daily" = "allTime";
let currentLanguage = "english";
let showingYesterday = false;

type LbKey = "15" | "60";

let currentData: {
  [_key in LbKey]: LeaderboardEntry[];
} = {
  "15": [],
  "60": [],
};

let currentRank: {
  [_key in LbKey]:
    | (LeaderboardRank & { minWpm?: number }) //Daily LB rank has minWpm
    | Record<string, never>;
} = {
  "15": {},
  "60": {},
};

let currentAvatars: {
  [_key in LbKey]: (string | null)[];
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
      "Next reset in: " + DateTime.secondsToString(diff, true)
    );
  } else {
    const date = new Date();
    const minutesToNextUpdate = 14 - (date.getMinutes() % 15);
    const secondsToNextUpdate = 60 - date.getSeconds();
    const totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
    $("#leaderboards .subTitle").text(
      "Next update in: " + DateTime.secondsToString(totalSeconds, true)
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

  if (!isAuthenticated()) {
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

  let toppercent = "";
  if (currentTimeRange === "allTime" && lbRank !== undefined && lbRank?.rank) {
    const num = Numbers.roundTo2((lbRank.rank / currentRank[lb].count) * 100);
    if (currentRank[lb].rank === 1) {
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
    <td class="alignRight">${Format.typingSpeed(entry.wpm, {
      showDecimalPlaces: true,
    })}<br>
    <div class="sub">${Format.percentage(entry.acc, {
      showDecimalPlaces: true,
    })}</div></td>
    <td class="alignRight">${Format.typingSpeed(entry.raw, {
      showDecimalPlaces: true,
    })}<br>
    <div class="sub">${Format.percentage(entry.consistency, {
      showDecimalPlaces: true,
    })}</div></td>
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

  const memory = DB.getSnapshot()?.lbMemory?.["time"]?.[lb]?.["english"] ?? 0;

  const rank = currentRank[lb]?.rank;
  if (rank) {
    const difference = memory - rank;
    if (difference > 0) {
      void DB.updateLbMemory("time", lb, "english", rank, true);
      if (memory !== 0) {
        $(`#leaderboardsWrapper table.${side} tfoot tr td .top`).append(
          ` (<i class="fas fa-fw fa-angle-up"></i>${Math.abs(
            difference
          )} since you last checked)`
        );
      }
    } else if (difference < 0) {
      void DB.updateLbMemory("time", lb, "english", rank, true);
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
  if (currentData[lb] === undefined) {
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
  const loggedInUserName = DB.getSnapshot()?.name;

  let html = "";
  for (let i = 0; i < currentData[lb].length; i++) {
    const entry = currentData[lb][i];
    if (entry === undefined) {
      break;
    }
    let meClassString = "";
    if (entry.name === loggedInUserName) {
      meClassString = ' class="me"';
    }
    const date = new Date(entry.timestamp);

    if (currentTimeRange === "daily" && !entry.rank) {
      entry.rank = i + 1;
    }

    let avatar = `<div class="avatarPlaceholder"><i class="fas fa-user-circle"></i></div>`;

    if (entry.discordAvatar !== undefined) {
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
      <div class="flagsAndBadge">
        ${getHtmlByUserFlags(entry)}
        ${entry.badgeId ? getBadgeHTMLbyId(entry.badgeId) : ""}
      </div>
    </div>
    </td>
    <td class="alignRight">${Format.typingSpeed(entry.wpm, {
      showDecimalPlaces: true,
    })}<br>
    <div class="sub">${Format.percentage(entry.acc, {
      showDecimalPlaces: true,
    })}</div></td>
    <td class="alignRight">${Format.typingSpeed(entry.raw, {
      showDecimalPlaces: true,
    })}<br>
    <div class="sub">${Format.percentage(entry.consistency, {
      showDecimalPlaces: true,
    })}</div></td>
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
      Misc.applyReducedMotion(100),
      () => {
        languageSelector?.destroy();
        languageSelector = undefined;
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

function getDailyLeaderboardQuery(): { isDaily: boolean; daysBefore?: 1 } {
  const isDaily = currentTimeRange === "daily";
  const isViewingDailyAndButtonIsActive = isDaily && showingYesterday;
  const daysBefore = isViewingDailyAndButtonIsActive ? 1 : undefined;

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

  const { isDaily, daysBefore } = getDailyLeaderboardQuery();
  const requestData = isDaily
    ? Ape.leaderboards.getDaily
    : Ape.leaderboards.get;
  const requestRank = isDaily
    ? Ape.leaderboards.getDailyRank
    : Ape.leaderboards.getRank;

  const baseQuery = {
    language: currentLanguage,
    mode: "time" as Mode,
    daysBefore,
  };

  const fallbackResponse = { status: 200, body: { message: "", data: null } };

  const lbRank15Request = isAuthenticated()
    ? requestRank({ query: { ...baseQuery, mode2: "15" } })
    : fallbackResponse;

  const lbRank60Request = isAuthenticated()
    ? requestRank({ query: { ...baseQuery, mode2: "60" } })
    : fallbackResponse;
  const [lb15Data, lb60Data, lb15Rank, lb60Rank] = await Promise.all([
    requestData({ query: { ...baseQuery, mode2: "15" } }),
    requestData({ query: { ...baseQuery, mode2: "60" } }),
    lbRank15Request,
    lbRank60Request,
  ]);

  if (
    lb15Data.status !== 200 ||
    lb60Data.status !== 200 ||
    lb15Rank.status !== 200 ||
    lb60Rank.status !== 200
  ) {
    const failedResponses = [lb15Data, lb60Data, lb15Rank, lb60Rank].filter(
      (it) => it.status !== 200
    );

    hideLoader("15");
    hideLoader("60");
    Notifications.add(
      "Failed to load leaderboards: " + failedResponses[0]?.body.message,
      -1
    );
    return;
  }

  if (lb15Data.body.data !== null) currentData["15"] = lb15Data.body.data;
  if (lb60Data.body.data !== null) currentData["60"] = lb60Data.body.data;
  if (lb15Rank.body.data !== null) currentRank["15"] = lb15Rank.body.data;
  if (lb60Rank.body.data !== null) currentRank["60"] = lb60Rank.body.data;

  const leaderboardKeys: LbKey[] = ["15", "60"];

  leaderboardKeys.forEach(async (lbKey) => {
    hideLoader(lbKey);
    clearBody(lbKey);
    updateFooter(lbKey);
    checkLbMemory(lbKey);
    await fillTable(lbKey);

    void getAvatarUrls(currentData[lbKey]).then((urls) => {
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
  if (prepend && currentData[lb][0]?.rank === 1) return;
  if (requesting[lb]) return;
  requesting[lb] = true;
  showLoader(lb);
  let skipVal = Arrays.lastElementFromArray(currentData[lb])?.rank as number;
  if (prepend) {
    skipVal = (currentData[lb][0]?.rank ?? 0) - leaderboardSingleLimit;
  }
  let limitVal;
  if (skipVal < 0) {
    limitVal = Math.abs(skipVal) - 1;
    skipVal = 0;
  }

  const { isDaily, daysBefore } = getDailyLeaderboardQuery();

  const requestData = isDaily
    ? Ape.leaderboards.getDaily
    : Ape.leaderboards.get;

  const response = await requestData({
    query: {
      language: currentLanguage,
      mode: "time",
      mode2: lb,
      skip: skipVal,
      limit: limitVal,
      daysBefore,
    },
  });

  if (
    response.status !== 200 ||
    response.body.data === null ||
    response.body.data.length === 0
  ) {
    hideLoader(lb);
    requesting[lb] = false;
    return;
  }
  const data = response.body.data;

  if (prepend) {
    currentData[lb].unshift(...data);
  } else {
    currentData[lb].push(...data);
  }
  if (prepend && !limitVal) {
    limitVal = leaderboardSingleLimit - 1;
  }
  await fillTable(lb);

  void getAvatarUrls(data).then((urls) => {
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

  const { isDaily, daysBefore } = getDailyLeaderboardQuery();

  const requestData = isDaily
    ? Ape.leaderboards.getDaily
    : Ape.leaderboards.get;

  const response = await requestData({
    query: {
      language: currentLanguage,
      mode: "time",
      mode2: lb,
      skip,
      daysBefore,
    },
  });

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
  if (
    response.status !== 200 ||
    response.body.data === null ||
    response.body.data.length === 0
  ) {
    hideLoader(lb);
    return;
  }

  const data = response.body.data;
  currentData[lb] = data;
  await fillTable(lb);

  void getAvatarUrls(data).then((urls) => {
    currentAvatars[lb] = urls;
    fillAvatars(lb);
  });

  hideLoader(lb);
}

async function getAvatarUrls(
  data: LeaderboardEntry[]
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

  for (const [index, url] of currentAvatars[lb].entries()) {
    const element = elements[index] as HTMLElement;
    if (url !== null) {
      $(element).html(
        `<div class="avatar" style="background-image:url(${url})"></div>`
      );
    } else {
      $(element).html(
        `<div class="avatarPlaceholder"><i class="fas fa-user-circle"></i></div>`
      );
    }
  }
}

export function show(): void {
  if (!ConnectionState.get()) {
    Notifications.add("You can't view leaderboards while offline", 0);
    return;
  }
  Skeleton.append(wrapperId, "popups");
  if (!Misc.isPopupVisible("leaderboardsWrapper")) {
    if (isAuthenticated()) {
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

    languageSelector = new SlimSelect({
      select:
        "#leaderboardsWrapper #leaderboards .leaderboardsTop .buttonGroup.timeRange .languageSelect",
      settings: {
        showSearch: false,
        // contentLocation: document.querySelector(
        //   "#leaderboardsWrapper"
        // ) as HTMLElement,
        // contentPosition: "relative",
      },
      data: [
        "english",
        "spanish",
        "german",
        "french",
        "portuguese",
        "indonesian",
        "italian",
      ].map((lang) => ({
        value: lang,
        text: lang,
        selected: lang === currentLanguage,
      })),
      events: {
        afterChange: (newVal): void => {
          currentLanguage = newVal[0]?.value as string;
          updateTitle();
          void update();
        },
      },
    });
    $("#leaderboardsWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        Misc.applyReducedMotion(125),
        () => {
          void update();
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

let languageSelector: SlimSelect | undefined = undefined;

// const languageSelector = new SlimSelect({
//   select:
//     "#leaderboardsWrapper #leaderboards .leaderboardsTop .buttonGroup.timeRange .languageSelect",
//   settings: {
//     showSearch: false,
//     // contentLocation: document.querySelector(
//     //   "#leaderboardsWrapper"
//     // ) as HTMLElement,
//     // contentPosition: "relative",
//   },
//   data: [
//     {
//       value: "english",
//       text: "english",
//       selected: true,
//     },
//     {
//       value: "spanish",
//       text: "spanish",
//     },
//     {
//       value: "german",
//       text: "german",
//     },
//     {
//       value: "french",
//       text: "french",
//     },
//     {
//       value: "portuguese",
//       text: "portuguese",
//     },
//     {
//       value: "indonesian",
//       text: "indonesian",
//     },
//     {
//       value: "italian",
//       text: "italian",
//     },
//   ],
//   events: {
//     afterChange: (newVal): void => {
//       currentLanguage = newVal[0]?.value as string;
//       updateTitle();
//       void update();
//     },
//   },
// });

let leftScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").on("scroll", (e) => {
  if (!leftScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (Math.round(elem.scrollTop() as number) <= 50) {
    void debouncedRequestMore("15", true);
  }
});

const debouncedRequestMore = debounce(500, requestMore);

$("#leaderboardsWrapper #leaderboards .leftTableWrapper").on("scroll", (e) => {
  if (!leftScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (elem === undefined || elem[0] === undefined) return;
  if (
    Math.round(elem[0].scrollHeight - (elem.scrollTop() as number)) <=
    Math.round(elem.outerHeight() as number) + 50
  ) {
    void debouncedRequestMore("15");
  }
});

let rightScrollEnabled = true;

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").on("scroll", (e) => {
  if (!rightScrollEnabled) return;
  const elem = $(e.currentTarget);
  if (Math.round(elem.scrollTop() as number) <= 50) {
    void debouncedRequestMore("60", true);
  }
});

$("#leaderboardsWrapper #leaderboards .rightTableWrapper").on("scroll", (e) => {
  const elem = $(e.currentTarget);
  if (elem === undefined || elem[0] === undefined) return;
  if (
    Math.round(elem[0].scrollHeight - (elem.scrollTop() as number)) <=
    Math.round((elem.outerHeight() as number) + 50)
  ) {
    void debouncedRequestMore("60");
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
  languageSelector?.disable();
  languageSelector?.setSelected("english");
  void update();
});

$(
  "#leaderboardsWrapper #leaderboards .leaderboardsTop .buttonGroup.timeRange .daily"
).on("click", () => {
  currentTimeRange = "daily";
  updateYesterdayButton();
  languageSelector?.enable();
  void update();
});

$("#leaderboardsWrapper .showYesterdayButton").on("click", () => {
  showingYesterday = !showingYesterday;
  void update();
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
