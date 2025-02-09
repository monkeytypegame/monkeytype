import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/contracts/schemas/leaderboards";
import { capitalizeFirstLetter } from "../utils/strings";
import Ape from "../ape";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import * as Notifications from "../elements/notifications";
import Format from "../utils/format";
import { Auth, isAuthenticated } from "../firebase";
import * as DB from "../db";
import { format } from "date-fns";
import { differenceInSeconds } from "date-fns/differenceInSeconds";
import * as DateTime from "../utils/date-and-time";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import { getHTMLById as getBadgeHTMLbyId } from "../controllers/badge-controller";
import { getDiscordAvatarUrl, isDevEnvironment } from "../utils/misc";
import * as ServerConfiguration from "../ape/server-configuration";

type AllTimeState = {
  mode: "allTime";
  allTimeMode: "15" | "60";
  data: LeaderboardEntry[] | null;
  count: number;
  userData: LeaderboardEntry | null;
};

type WeeklyState = {
  mode: "weekly";
  data: XpLeaderboardEntry[] | null;
  count: number;
  userData: XpLeaderboardEntry | null;
};

type DailyState = {
  mode: "daily";
  dailyMode: "15" | "60";
  dailyMinWpm: number;
  dailyLanguage: string;
  data: LeaderboardEntry[] | null;
  count: number;
  userData: LeaderboardEntry | null;
};

type State = {
  mode: "allTime" | "weekly" | "daily";
  loading: boolean;
  updating: boolean;
  page: number;
  pageSize: number;
  title: string;
  error?: string;
  discordAvatarUrls: Map<string, string>;
} & (AllTimeState | WeeklyState | DailyState);

const state = {
  loading: true,
  updating: false,
  mode: "allTime",
  allTimeMode: "15",
  data: null,
  userData: null,
  page: 0,
  pageSize: 50,
  title: "All-time English Time 15 Leaderboard",
  discordAvatarUrls: new Map<string, string>(),
} as State;

function updateTitle(): void {
  const mode =
    state.mode === "allTime"
      ? "All-time"
      : state.mode === "weekly"
      ? "Weekly XP"
      : "Daily";

  const language =
    state.mode === "daily"
      ? capitalizeFirstLetter(state.dailyLanguage)
      : state.mode === "allTime"
      ? "English"
      : "";

  const secondary =
    state.mode === "allTime" ? ` Time ${state.allTimeMode}` : "";

  state.title = `${mode} ${language} ${secondary} Leaderboard`;
  $(".page.pageLeaderboards .bigtitle").text(state.title);
}

async function requestData(update = false): Promise<void> {
  if (update) {
    state.updating = true;
    state.error = undefined;
  } else {
    state.loading = true;
    state.error = undefined;
    state.data = null;
    state.discordAvatarUrls = new Map<string, string>();
    state.userData = null;
  }
  updateContent();

  if (state.mode === "allTime" || state.mode === "daily") {
    const baseQuery = {
      language: state.mode === "allTime" ? "english" : state.dailyLanguage,
      mode: "time" as Mode,
      mode2: state.mode === "allTime" ? state.allTimeMode : state.dailyMode,
    };

    let data;

    if (state.mode === "allTime") {
      data = await Ape.leaderboards.get({
        query: { ...baseQuery, page: state.page },
      });
    } else {
      data = await Ape.leaderboards.getDaily({
        query: {
          ...baseQuery,
          page: state.page,
        },
      });
    }

    if (data.status === 200) {
      state.data = data.body.data.entries;
      state.count = data.body.data.count;
      state.pageSize = data.body.data.pageSize;
    } else {
      state.data = null;
      state.error = "Something went wrong";
      Notifications.add("Failed to get leaderboard: " + data.body.message, -1);
    }

    if (isAuthenticated() && state.userData === null) {
      let userData;

      if (state.mode === "allTime") {
        userData = await Ape.leaderboards.getRank({
          query: { ...baseQuery },
        });
      } else {
        userData = await Ape.leaderboards.getDailyRank({
          query: {
            ...baseQuery,
          },
        });
      }

      if (userData.status === 200) {
        if (userData.body.data.entry !== undefined) {
          state.userData = userData.body.data.entry;
        }

        if (state.mode === "daily") {
          // idk why ts complains but it works
          //@ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          state.dailyMinWpm = userData.body.data.minWpm;
        }
      } else {
        state.userData = null;
        state.error = "Something went wrong";
        Notifications.add("Failed to get rank: " + userData.body.message, -1);
      }
    }

    if (state.data !== null) {
      void getAvatarUrls(state.data).then((urlMap) => {
        state.discordAvatarUrls = urlMap;
        fillAvatars();
      });
    }

    state.loading = false;
    state.updating = false;
    updateContent();
    return;
  }

  state.updating = false;
  state.loading = false;
  state.error = "Unsupported mode";
  updateContent();
}

function updateJumpButtons(): void {
  const el = $(".page.pageLeaderboards .titleAndButtons .jumpButtons");
  el.find("button").removeClass("active");

  const totalPages = Math.ceil(state.count / state.pageSize);

  if (totalPages <= 1) {
    el.find("button").addClass("disabled");
    return;
  } else {
    el.find("button").removeClass("disabled");
  }

  if (state.page === 0) {
    el.find("button[data-action='previousPage']").addClass("disabled");
    el.find("button[data-action='firstPage']").addClass("disabled");
  } else {
    el.find("button[data-action='previousPage']").removeClass("disabled");
    el.find("button[data-action='firstPage']").removeClass("disabled");
  }

  if (isAuthenticated() && state.userData) {
    const userPage = Math.floor(state.userData.rank / state.pageSize);
    if (state.page === userPage) {
      el.find("button[data-action='userPage']").addClass("disabled");
    } else {
      el.find("button[data-action='userPage']").removeClass("disabled");
    }
  }

  if (state.page === totalPages - 1) {
    el.find("button[data-action='nextPage']").addClass("disabled");
  } else {
    el.find("button[data-action='nextPage']").removeClass("disabled");
  }
}

async function getAvatarUrls(
  data: LeaderboardEntry[] | XpLeaderboardEntry[]
): Promise<Map<string, string>> {
  const results = await Promise.allSettled(
    data.map(async (entry) => ({
      uid: entry.uid,
      url: await getDiscordAvatarUrl(entry.discordId, entry.discordAvatar),
    }))
  );

  const avatarMap = new Map<string, string>();
  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.url !== null) {
      avatarMap.set(result.value.uid, result.value.url);
    }
  });

  return avatarMap;
}
function fillAvatars(): void {
  const elements = $(".page.pageLeaderboards table .lbav");

  for (const element of elements) {
    const uid = $(element).siblings(".entryName").attr("uid") as string;
    const url = state.discordAvatarUrls.get(uid);

    if (url !== undefined) {
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

function buildTableRow(entry: LeaderboardEntry, me = false): string {
  let avatar = `<div class="avatarPlaceholder"><i class="fas fa-user-circle"></i></div>`;

  if (entry.discordAvatar !== undefined) {
    avatar = `<div class="avatarPlaceholder"><i class="fas fa-circle-notch fa-spin"></i></div>`;
  }

  const meClass = me ? "me" : "";

  const formatted = {
    wpm: Format.typingSpeed(entry.wpm, { showDecimalPlaces: true }),
    acc: Format.percentage(entry.acc, { showDecimalPlaces: true }),
    raw: Format.typingSpeed(entry.raw, { showDecimalPlaces: true }),
    con: Format.percentage(entry.consistency, { showDecimalPlaces: true }),
  };

  return `
    <tr class="${meClass}" data-uid="${entry.uid}">
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
      <td class="stat narrow">
      ${formatted.wpm}
        <div class="sub">${formatted.acc}</div>
      </td>
      </td>
      <td class="stat narrow">
      ${formatted.raw}
        <div class="sub">${formatted.con}</div>
      </td>
      <td class="stat wide">${formatted.wpm}</td>
      <td class="stat wide">${formatted.acc}</td>
      <td class="stat wide">${formatted.raw}</td>
      <td class="stat wide">${formatted.con}</td>
      <td class="date">${format(
        entry.timestamp,
        "dd MMM yyyy"
      )}<div class="sub">${format(entry.timestamp, "HH:mm")}</div></td>
    </tr>
  `;
}

function fillTable(): void {
  if (
    state.data === null ||
    (state.mode !== "allTime" && state.mode !== "daily")
  ) {
    return;
  }

  const table = $(".page.pageLeaderboards table tbody");
  table.empty();

  if (state.data.length === 0) {
    table.append(`<tr><td colspan="7" class="empty">No data</td></tr>`);
  } else {
    for (const entry of state.data) {
      const me = Auth?.currentUser?.uid === entry.uid;
      table.append(buildTableRow(entry, me));
    }
  }

  $(".page.pageLeaderboards table").removeClass("hidden");
  $(".page.pageLeaderboards .titleAndButtons").removeClass("hidden");
}

function getLbMemoryDifference(): number | null {
  if (state.mode !== "allTime") return null;
  if (state.userData === null) return null;

  const memory =
    DB.getSnapshot()?.lbMemory?.["time"]?.[state.allTimeMode]?.["english"] ?? 0;

  const rank = state.userData.rank;
  const diff = memory - rank;

  if (diff !== 0) {
    void DB.updateLbMemory("time", state.allTimeMode, "english", rank, true);
  }

  return diff;
}

function fillUser(): void {
  if (isAuthenticated() && DB.getSnapshot()?.lbOptOut === true) {
    $(".page.pageLeaderboards .bigUser").html(
      '<div class="warning">You have opted out of the leaderboards.</div>'
    );
    return;
  }

  if (isAuthenticated() && DB.getSnapshot()?.banned === true) {
    $(".page.pageLeaderboards .bigUser").html(
      '<div class="warning">Your account is banned</div>'
    );
    return;
  }

  if (
    isAuthenticated() &&
    !isDevEnvironment() &&
    (DB.getSnapshot()?.typingStats?.timeTyping ?? 0) < 72000
  ) {
    $(".page.pageLeaderboards .bigUser").html(
      '<div class="warning">Your account must have 2 hours typed to be placed on the leaderboard.</div>'
    );
    return;
  }

  if (isAuthenticated() && state.mode === "daily" && state.userData === null) {
    $(".page.pageLeaderboards .bigUser").html(
      `<div class="warning">Not qualified (min speed required: ${state.dailyMinWpm} wpm)</div>`
    );
    return;
  }

  if (isAuthenticated() && state.userData === null) {
    $(".page.pageLeaderboards .bigUser").html(
      `<div class="warning">Not qualified</div>`
    );
    return;
  }

  if (
    state.data === null ||
    (state.mode !== "allTime" && state.mode !== "daily")
  ) {
    return;
  }

  if (!state.userData || !state.count) {
    $(".page.pageLeaderboards .bigUser").addClass("hidden");
    return;
  }

  const userData = state.userData;
  const percentile = (userData.rank / state.count) * 100;
  let percentileString = `Top ${percentile.toFixed(2)}%`;
  if (userData.rank === 1) {
    percentileString = "GOAT";
  }

  const diff = getLbMemoryDifference();
  let diffText;

  if (diff === null) {
    diffText = "";
  } else if (diff === 0) {
    diffText = ` ( = since you last checked)`;
  } else if (diff > 0) {
    diffText = ` (<i class="fas fa-fw fa-angle-up"></i>${Math.abs(
      diff
    )} since you last checked
      )`;
  } else {
    diffText = ` (<i class="fas fa-fw fa-angle-down"></i>${Math.abs(
      diff
    )} since you last checked
        )`;
  }

  const formatted = {
    wpm: Format.typingSpeed(userData.wpm, { showDecimalPlaces: true }),
    acc: Format.percentage(userData.acc, { showDecimalPlaces: true }),
    raw: Format.typingSpeed(userData.raw, { showDecimalPlaces: true }),
    con: Format.percentage(userData.consistency, { showDecimalPlaces: true }),
  };

  const html = `
          <div class="rank">${
            userData.rank === 1
              ? '<i class="fas fa-fw fa-crown"></i>'
              : userData.rank
          }</div>
        <div class="userInfo">
          <div class="top">You (${percentileString})</div>
          <div class="bottom">${diffText}</div>
        </div>
        <div class="stat wide">
          <div class="title">wpm</div>
          <div class="value">${formatted.wpm}</div>
        </div>
        <div class="stat wide">
          <div class="title">accuracy</div>
          <div class="value">${formatted.acc}</div>
        </div>
        <div class="stat wide">
          <div class="title">raw</div>
          <div class="value">${formatted.raw}</div>
        </div>
        <div class="stat wide">
          <div class="title">consistency</div>
          <div class="value">${formatted.con}</div>
        </div>
        <div class="stat wide">
          <div class="title">date</div>
          <div class="value">${format(
            userData.timestamp,
            "dd MMM yyyy HH:mm"
          )}</div>
        </div>


        <div class="stat narrow">
          <div>${formatted.wpm}</div>
          <div class="sub">${formatted.acc}</div>
        </div>
              <div class="stat narrow">
          <div>${formatted.raw}</div>
          <div class="sub">${formatted.con}</div>
        </div>
        <div class="stat narrow">
          <div>${format(userData.timestamp, "dd MMM yyyy")}</div>
          <div class="sub">${format(userData.timestamp, "HH:mm")}</div>
        </div>
        `;

  $(".page.pageLeaderboards .bigUser").html(html);
  $(".page.pageLeaderboards .bigUser").removeClass("hidden");
}

function updateContent(): void {
  $(".page.pageLeaderboards .loading").addClass("hidden");
  $(".page.pageLeaderboards .updating").addClass("hidden");
  $(".page.pageLeaderboards .error").addClass("hidden");

  if (state.error !== undefined) {
    $(".page.pageLeaderboards .error").removeClass("hidden");
    $(".page.pageLeaderboards .error p").text(state.error);
    enableButtons();
    return;
  }

  if (state.updating) {
    disableButtons();
    $(".page.pageLeaderboards .updating").removeClass("hidden");
    return;
  } else if (state.loading) {
    disableButtons();
    $(".page.pageLeaderboards .bigUser").addClass("hidden");
    $(".page.pageLeaderboards .titleAndButtons").addClass("hidden");
    $(".page.pageLeaderboards .loading").removeClass("hidden");
    $(".page.pageLeaderboards table").addClass("hidden");
    return;
  } else {
    enableButtons();
  }

  if (isAuthenticated()) {
    $(".page.pageLeaderboards .needAuth").removeClass("hidden");
  } else {
    $(".page.pageLeaderboards .needAuth").addClass("hidden");
  }

  if (state.data === null) {
    Notifications.add("Data is null");
    return;
  }

  updateJumpButtons();
  fillTable();
  if (isAuthenticated()) {
    //todo dont run this every time, only when new user data is fetched
    fillUser();
  }
}

function updateModeButtons(): void {
  const el = $(".page.pageLeaderboards .buttonGroup.modeButtons");
  el.find("button").removeClass("active");
  el.find(`button[data-mode=${state.mode}]`).addClass("active");
}

function updateSecondaryButtons(): void {
  $(".page.pageLeaderboards .buttonGroup.secondary").addClass("hidden");
  $(".page.pageLeaderboards .buttons .divider").addClass("hidden");

  if (state.mode === "allTime") {
    $(".page.pageLeaderboards .buttonGroup.allTimeModeButtons").removeClass(
      "hidden"
    );
    $(".page.pageLeaderboards .buttons .divider").removeClass("hidden");

    updateAllTimeModeButtons();
  }
  if (state.mode === "daily") {
    $(".page.pageLeaderboards .buttonGroup.dailyLanguageButtons").removeClass(
      "hidden"
    );
    $(".page.pageLeaderboards .buttons .divider").removeClass("hidden");

    updateDailyLanguageButtons();
  }
}

let updateTimer: number | undefined;

function updateTimerElement(): void {
  if (state.mode === "daily") {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    const dateNow = new Date();
    dateNow.setUTCMilliseconds(0);
    const diff = differenceInSeconds(date, dateNow);

    $(".page.pageLeaderboards .titleAndButtons .timer").text(
      "Next reset in: " + DateTime.secondsToString(diff, true)
    );
  } else {
    const date = new Date();
    const minutesToNextUpdate = 14 - (date.getMinutes() % 15);
    const secondsToNextUpdate = 60 - date.getSeconds();
    const totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
    $(".page.pageLeaderboards .titleAndButtons .timer").text(
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

function stopTimer(): void {
  clearInterval(updateTimer);
  updateTimer = undefined;
  $(".page.pageLeaderboards .titleAndButtons .timer").text("-");
}

async function appendDailyLanguageButtons(): Promise<void> {
  const languages =
    (await ServerConfiguration.get()?.dailyLeaderboards.validModeRules.map(
      (r) => r.language
    )) ?? [];

  const el = $(".page.pageLeaderboards .buttonGroup.dailyLanguageButtons");
  el.empty();

  for (const language of languages) {
    el.append(`
      <button data-dailyLanguage="${language}">
        <i class="fas fa-globe"></i>
        ${language}
      </button>
    `);
  }
}

function updateAllTimeModeButtons(): void {
  if (state.mode !== "allTime") return;
  const el = $(".page.pageLeaderboards .buttonGroup.allTimeModeButtons");
  el.find("button").removeClass("active");
  el.find(`button[data-allTimeMode=${state.allTimeMode}]`).addClass("active");
}

function updateDailyLanguageButtons(): void {
  if (state.mode !== "daily") return;
  const el = $(".page.pageLeaderboards .buttonGroup.dailyLanguageButtons");
  el.find("button").removeClass("active");
  el.find(`button[data-dailyLanguage=${state.dailyLanguage}]`).addClass(
    "active"
  );
}

function disableButtons(): void {
  $(".page.pageLeaderboards button").prop("disabled", true);
}

function enableButtons(): void {
  $(".page.pageLeaderboards button").prop("disabled", false);
}

export function goToPage(pageId: number): void {
  if (pageId < 0 || pageId === state.page) return;
  handleJumpButton("goToPage", pageId);
}

function handleJumpButton(action: string, page?: number): void {
  if (action === "firstPage") {
    state.page = 0;
  } else if (action === "previousPage" && state.page > 0) {
    state.page -= 1;
  } else if (action === "nextPage") {
    state.page += 1;
  } else if (action === "goToPage" && page !== undefined) {
    state.page = page;
  } else if (action === "userPage") {
    if (isAuthenticated()) {
      const user = Auth?.currentUser;
      if (user) {
        const rank = state.userData?.rank;
        if (rank) {
          const page = Math.floor(rank / state.pageSize);

          if (state.page === page) {
            return;
          }

          state.page = page;
        }
      }
    }
  } else {
    return;
  }
  void requestData(true);
  updateContent();
}

function updateGetParameters(): void {
  const params = new URLSearchParams(window.location.search);

  params.set("mode", state.mode);
  if (state.mode === "allTime") {
    params.set("mode2", state.allTimeMode);
  } else if (state.mode === "daily") {
    params.set("language", state.dailyLanguage);
    params.set("mode2", state.dailyMode);
  }

  params.set("page", state.page.toString());

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

function readGetParameters(): void {
  const params = new URLSearchParams(window.location.search);

  const mode = params.get("mode") as "allTime" | "weekly" | "daily";
  if (mode) {
    state.mode = mode;
  }

  if (state.mode === "allTime") {
    const allTimeMode = params.get("mode2") as "15" | "60";
    if (allTimeMode) {
      state.allTimeMode = allTimeMode;
    }
  } else if (state.mode === "daily") {
    const dailyLanguage = params.get("language");
    const dailyMode = params.get("mode2") as "15" | "60";
    if (dailyLanguage !== null) {
      state.dailyLanguage = dailyLanguage;
    }
    if (dailyMode) {
      state.dailyMode = dailyMode;
    }
  }

  const page = params.get("page");
  if (page !== null) {
    state.page = parseInt(page, 10);
  }
}

$(".page.pageLeaderboards .jumpButtons button").on("click", function () {
  const action = $(this).data("action") as string;
  if (action !== "goToPage") {
    handleJumpButton(action);
  }
});

$(".page.pageLeaderboards .buttonGroup.modeButtons").on(
  "click",
  "button",
  function () {
    const mode = $(this).data("mode") as "allTime" | "weekly" | "daily";
    if (state.mode === mode) return;
    state.mode = mode;
    if (state.mode === "daily") {
      state.dailyLanguage = "english";
      state.dailyMode = "15";
    }
    state.data = null;
    void requestData();
    updateModeButtons();
    updateTitle();
    updateSecondaryButtons();
    updateContent();
    updateGetParameters();
  }
);

$(".page.pageLeaderboards .buttonGroup.secondary").on(
  "click",
  "button",
  function () {
    const allTimeMode = $(this).data("alltimemode") as "15" | "60";
    const language = $(this).data("dailylanguage") as string;
    if (allTimeMode !== undefined && state.mode === "allTime") {
      if (state?.allTimeMode === allTimeMode) return;
      state.allTimeMode = allTimeMode;
    } else if (language !== undefined && state.mode === "daily") {
      if (state.dailyLanguage === language) return;
      state.dailyLanguage = language;
    } else {
      return;
    }
    state.data = null;
    void requestData();
    updateSecondaryButtons();
    updateTitle();
    updateContent();
    updateGetParameters();
  }
);

export const page = new Page({
  name: "leaderboards",
  element: $(".page.pageLeaderboards"),
  path: "/leaderboards",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLeaderboards");
    stopTimer();
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLeaderboards", "main");
    readGetParameters();
    await appendDailyLanguageButtons();
    startTimer();
    updateModeButtons();
    updateTitle();
    updateSecondaryButtons();
    updateContent();
    updateGetParameters();
    void requestData();
  },
});

$(async () => {
  Skeleton.save("pageLeaderboards");
});
