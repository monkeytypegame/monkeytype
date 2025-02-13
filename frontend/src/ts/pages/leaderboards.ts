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
import { abbreviateNumber } from "../utils/numbers";
import {
  getCurrentWeekTimestamp,
  getLastWeekTimestamp,
  getStartOfDayTimestamp,
} from "@monkeytype/util/date-and-time";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
// import * as ServerConfiguration from "../ape/server-configuration";

type LeaderboardType = "allTime" | "weekly" | "daily";

type AllTimeState = {
  type: "allTime";
  mode: "time";
  mode2: "15" | "60";
  data: LeaderboardEntry[] | null;
  count: number;
  userData: LeaderboardEntry | null;
};

type WeeklyState = {
  type: "weekly";
  lastWeek: boolean;
  data: XpLeaderboardEntry[] | null;
  count: number;
  userData: XpLeaderboardEntry | null;
};

type DailyState = {
  type: "daily";
  mode: "time";
  mode2: "15" | "60";
  yesterday: boolean;
  minWpm: number;
  language: string;
  data: LeaderboardEntry[] | null;
  count: number;
  userData: LeaderboardEntry | null;
};

type State = {
  type: LeaderboardType;
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
  type: "allTime",
  mode2: "15",
  data: null,
  userData: null,
  page: 0,
  pageSize: 50,
  title: "All-time English Time 15 Leaderboard",
  discordAvatarUrls: new Map<string, string>(),
} as State;

function updateTitle(): void {
  const type =
    state.type === "allTime"
      ? "All-time"
      : state.type === "weekly"
      ? "Weekly XP"
      : "Daily";

  const language =
    state.type === "daily"
      ? capitalizeFirstLetter(state.language)
      : state.type === "allTime"
      ? "English"
      : "";

  const mode =
    state.type === "allTime"
      ? ` Time ${state.mode2}`
      : state.type === "daily"
      ? ` Time ${state.mode2}`
      : "";

  state.title = `${type} ${language} ${mode} Leaderboard`;
  $(".page.pageLeaderboards .bigtitle >.text").text(state.title);

  $(".page.pageLeaderboards .bigtitle .subtext").addClass("hidden");
  $(".page.pageLeaderboards .bigtitle button").addClass("hidden");
  $(".page.pageLeaderboards .bigtitle .subtext .divider").addClass("hidden");

  if (state.type === "daily") {
    $(".page.pageLeaderboards .bigtitle .subtext").removeClass("hidden");
    $(
      ".page.pageLeaderboards .bigtitle button[data-action='toggleYesterday']"
    ).removeClass("hidden");
    $(".page.pageLeaderboards .bigtitle .subtext .divider").removeClass(
      "hidden"
    );

    if (state.yesterday) {
      $(
        ".page.pageLeaderboards .bigtitle button[data-action='toggleYesterday']"
      ).html(`
        <i class="fas fa-forward"></i>
            show today
        `);
    } else {
      $(
        ".page.pageLeaderboards .bigtitle button[data-action='toggleYesterday']"
      ).html(`
        <i class="fas fa-backward"></i>
            show yesterday
        `);
    }

    let timestamp = getStartOfDayTimestamp(new Date().getTime());

    if (state.yesterday) {
      timestamp -= 24 * 60 * 60 * 100;
    }

    const dateString = format(timestamp, "EEEE, do MMMM yyyy");
    $(".page.pageLeaderboards .bigtitle .subtext > .text").text(
      `${dateString}`
    );
  } else if (state.type === "weekly") {
    $(".page.pageLeaderboards .bigtitle .subtext").removeClass("hidden");
    $(
      ".page.pageLeaderboards .bigtitle button[data-action='toggleLastWeek']"
    ).removeClass("hidden");
    $(".page.pageLeaderboards .bigtitle .subtext .divider").removeClass(
      "hidden"
    );

    if (state.lastWeek) {
      $(".page.pageLeaderboards .bigtitle button[data-action='toggleLastWeek']")
        .html(`
        <i class="fas fa-forward"></i>
            show this week
        `);
    } else {
      $(".page.pageLeaderboards .bigtitle button[data-action='toggleLastWeek']")
        .html(`
        <i class="fas fa-backward"></i>
            show last week
        `);
    }

    let fn = getCurrentWeekTimestamp();

    if (state.lastWeek) {
      fn = getLastWeekTimestamp();
    }

    const dateString = `${format(fn, "EEEE, do MMMM yyyy")} - ${format(
      fn + 6 * 24 * 60 * 60 * 1000,
      "EEEE, do MMMM yyyy"
    )}`;
    $(".page.pageLeaderboards .bigtitle .subtext > .text").text(
      `${dateString}`
    );
  }
}

async function requestData(update = false): Promise<void> {
  if (update) {
    state.updating = true;
    state.error = undefined;
  } else {
    state.loading = true;
    state.error = undefined;
    state.data = null;
    state.userData = null;
  }
  updateContent();

  if (state.type === "allTime" || state.type === "daily") {
    const baseQuery = {
      language: state.type === "allTime" ? "english" : state.language,
      mode: "time" as Mode,
      mode2: state.mode2,
    };

    let response;

    if (state.type === "allTime") {
      response = await Ape.leaderboards.get({
        query: { ...baseQuery, page: state.page },
      });
    } else {
      response = await Ape.leaderboards.getDaily({
        query: {
          ...baseQuery,
          page: state.page,
          daysBefore: state.yesterday ? 1 : undefined,
        },
      });
    }

    if (response.status === 200) {
      state.data = response.body.data.entries;
      state.count = response.body.data.count;
      state.pageSize = response.body.data.pageSize;

      if (state.type === "daily") {
        //@ts-ignore not sure why this is causing errors when it's clearly defined in the schema
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        state.minWpm = response.body.data.minWpm;
      }
    } else {
      state.data = null;
      state.error = "Something went wrong";
      Notifications.add(
        "Failed to get leaderboard: " + response.body.message,
        -1
      );
    }

    if (isAuthenticated() && state.userData === null) {
      let rankResponse;

      if (state.type === "allTime") {
        rankResponse = await Ape.leaderboards.getRank({
          query: { ...baseQuery },
        });
      } else {
        rankResponse = await Ape.leaderboards.getDailyRank({
          query: {
            ...baseQuery,
          },
        });
      }

      if (rankResponse.status === 200) {
        if (rankResponse.body.data !== null) {
          state.userData = rankResponse.body.data;
        }
      } else {
        state.userData = null;
        state.error = "Something went wrong";
        Notifications.add(
          "Failed to get rank: " + rankResponse.body.message,
          -1
        );
      }
    }

    if (state.data !== null) {
      const entriesMissingAvatars = state.data.filter(
        (entry) => !state.discordAvatarUrls.has(entry.uid)
      );
      void getAvatarUrls(entriesMissingAvatars).then((urlMap) => {
        state.discordAvatarUrls = new Map([
          ...state.discordAvatarUrls,
          ...urlMap,
        ]);
        fillAvatars();
      });
    }

    state.loading = false;
    state.updating = false;
    updateContent();
    if (!update && isAuthenticated()) {
      fillUser();
    }
    return;
  } else if (state.type === "weekly") {
    const data = await Ape.leaderboards.getWeeklyXp({
      query: { page: state.page, weeksBefore: state.lastWeek ? 1 : undefined },
    });

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
      const userData = await Ape.leaderboards.getWeeklyXpRank();

      if (userData.status === 200) {
        if (userData.body.data !== null) {
          state.userData = userData.body.data;
        }
      } else {
        state.userData = null;
        state.error = "Something went wrong";
        Notifications.add("Failed to get rank: " + userData.body.message, -1);
      }
    }

    if (state.data !== null) {
      const entriesMissingAvatars = state.data.filter(
        (entry) => !state.discordAvatarUrls.has(entry.uid)
      );
      void getAvatarUrls(entriesMissingAvatars).then((urlMap) => {
        state.discordAvatarUrls = new Map([
          ...state.discordAvatarUrls,
          ...urlMap,
        ]);
        fillAvatars();
      });
    }

    state.loading = false;
    state.updating = false;
    updateContent();
    if (!update && isAuthenticated()) {
      fillUser();
    }
    return;
  } else {
    // state.updating = false;
    // state.loading = false;
    // state.error = "Unsupported mode";
    // updateContent();
  }
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

  if (state.page >= totalPages - 1) {
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

function buildWeeklyTableRow(entry: XpLeaderboardEntry, me = false): string {
  let avatar = `<div class="avatarPlaceholder"><i class="fas fa-user-circle"></i></div>`;

  if (entry.discordAvatar !== undefined) {
    avatar = `<div class="avatarPlaceholder"><i class="fas fa-circle-notch fa-spin"></i></div>`;
  }

  const meClass = me ? "me" : "";

  const activeDiff = formatDistanceToNow(entry.lastActivityTimestamp, {
    addSuffix: true,
  });

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
      <td class="stat wide">${
        entry.totalXp < 1000 ? entry.totalXp : abbreviateNumber(entry.totalXp)
      }</td>
      <td class="stat wide">${DateTime.secondsToString(
        Math.round(entry.timeTypedSeconds),
        true,
        true,
        ":"
      )}</td>
      <td class="stat narrow">
      ${entry.totalXp < 1000 ? entry.totalXp : abbreviateNumber(entry.totalXp)}
      <div class="sub">${DateTime.secondsToString(
        Math.round(entry.timeTypedSeconds),
        true,
        true,
        ":"
      )}</td>
      </td>
      <td class="date" data-balloon-pos="left"  aria-label="${activeDiff}">
        ${format(entry.lastActivityTimestamp, "dd MMM yyyy")}
        <div class="sub">
          ${format(entry.lastActivityTimestamp, "HH:mm")}
        </div>
      </td>
    </tr>
  `;
}

function fillTable(): void {
  const table = $(".page.pageLeaderboards table tbody");
  table.empty();

  $(".page.pageLeaderboards table thead").addClass("hidden");
  if (state.type === "allTime" || state.type === "daily") {
    $(".page.pageLeaderboards table thead.allTimeAndDaily").removeClass(
      "hidden"
    );
  } else if (state.type === "weekly") {
    $(".page.pageLeaderboards table thead.weekly").removeClass("hidden");
  }

  if (state.data === null || state.data.length === 0) {
    table.append(`<tr><td colspan="7" class="empty">No data</td></tr>`);
    $(".page.pageLeaderboards table").removeClass("hidden");
    return;
  }

  if (state.type === "allTime" || state.type === "daily") {
    for (const entry of state.data) {
      const me = Auth?.currentUser?.uid === entry.uid;
      table.append(buildTableRow(entry, me));
    }
  } else if (state.type === "weekly") {
    for (const entry of state.data) {
      const me = Auth?.currentUser?.uid === entry.uid;
      table.append(buildWeeklyTableRow(entry, me));
    }
  }

  $(".page.pageLeaderboards table").removeClass("hidden");
}

function getLbMemoryDifference(): number | null {
  if (state.type !== "allTime") return null;
  if (state.userData === null) return null;

  const memory =
    DB.getSnapshot()?.lbMemory?.["time"]?.[state.mode2]?.["english"] ?? 0;

  const rank = state.userData.rank;
  const diff = memory - rank;

  if (diff !== 0) {
    void DB.updateLbMemory("time", state.mode2, "english", rank, true);
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

  if (isAuthenticated() && state.type === "daily" && state.userData === null) {
    $(".page.pageLeaderboards .bigUser").html(
      `<div class="warning">Not qualified (min speed required: ${state.minWpm} wpm)</div>`
    );
    return;
  }

  if (isAuthenticated() && state.userData === null) {
    $(".page.pageLeaderboards .bigUser").html(
      `<div class="warning">Not qualified</div>`
    );
    return;
  }

  if (state.data === null) {
    return;
  }

  if (
    (state.type === "weekly" && state.lastWeek) ||
    (state.type === "daily" && state.yesterday)
  ) {
    $(".page.pageLeaderboards .bigUser").addClass("hidden");
    $(".page.pageLeaderboards .tableAndUser > .divider").removeClass("hidden");
    return;
  }

  if (state.type === "allTime" || state.type === "daily") {
    if (!state.userData || !state.count) {
      $(".page.pageLeaderboards .bigUser").addClass("hidden");
      $(".page.pageLeaderboards .tableAndUser > .divider").removeClass(
        "hidden"
      );
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
  } else if (state.type === "weekly") {
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
      xp:
        userData.totalXp < 1000
          ? userData.totalXp
          : abbreviateNumber(userData.totalXp),
      time: DateTime.secondsToString(
        Math.round(userData.timeTypedSeconds),
        true,
        true,
        ":"
      ),
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
          <div class="title">xp gained</div>
          <div class="value">${formatted.xp}</div>
        </div>
        <div class="stat wide">
          <div class="title">time typed</div>
          <div class="value">${formatted.time}</div>
        </div>
        <div class="stat narrow">
          <div>${formatted.xp}</div>
          <div class="sub">${formatted.time}</div>
        </div>
        <div class="stat wide">
          <div class="title">date</div>
          <div class="value">${format(
            userData.lastActivityTimestamp,
            "dd MMM yyyy HH:mm"
          )}</div>
        </div>
        <div class="stat narrow">
          <div>${format(userData.lastActivityTimestamp, "dd MMM yyyy")}</div>
          <div class="sub">${format(
            userData.lastActivityTimestamp,
            "HH:mm"
          )}</div>
        </div>
        `;

    $(".page.pageLeaderboards .bigUser").html(html);
  }
  $(".page.pageLeaderboards .bigUser").removeClass("hidden");
  $(".page.pageLeaderboards .tableAndUser > .divider").addClass("hidden");
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

  $(".page.pageLeaderboards .titleAndButtons").removeClass("hidden");
  updateJumpButtons();
  updateTimerVisibility();
  fillTable();
}

function updateTypeButtons(): void {
  const el = $(".page.pageLeaderboards .buttonGroup.typeButtons");
  el.find("button").removeClass("active");
  el.find(`button[data-type=${state.type}]`).addClass("active");
}

function updateSecondaryButtons(): void {
  $(".page.pageLeaderboards .buttonGroup.secondary").addClass("hidden");
  $(".page.pageLeaderboards .buttons .divider").addClass("hidden");
  $(".page.pageLeaderboards .buttons .divider2").addClass("hidden");

  if (state.type === "allTime") {
    $(".page.pageLeaderboards .buttonGroup.modeButtons").removeClass("hidden");
    $(".page.pageLeaderboards .buttons .divider").removeClass("hidden");
    $(".page.pageLeaderboards .buttons .divider2").addClass("hidden");

    updateModeButtons();
  }
  if (state.type === "daily") {
    $(".page.pageLeaderboards .buttonGroup.modeButtons").removeClass("hidden");
    $(".page.pageLeaderboards .buttonGroup.languageButtons").removeClass(
      "hidden"
    );
    $(".page.pageLeaderboards .buttons .divider").removeClass("hidden");
    $(".page.pageLeaderboards .buttons .divider2").removeClass("hidden");

    updateModeButtons();
    updateLanguageButtons();
  }
}

let updateTimer: number | undefined;

function updateTimerElement(): void {
  if (state.type === "daily") {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);
    const dateNow = new Date();
    dateNow.setUTCMilliseconds(0);
    const diff = differenceInSeconds(date, dateNow);

    $(".page.pageLeaderboards .titleAndButtons .timer").text(
      "Next reset in: " + DateTime.secondsToString(diff, true)
    );
  } else if (state.type === "allTime") {
    const date = new Date();
    const minutesToNextUpdate = 14 - (date.getMinutes() % 15);
    const secondsToNextUpdate = 60 - date.getSeconds();
    const totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
    $(".page.pageLeaderboards .titleAndButtons .timer").text(
      "Next update in: " + DateTime.secondsToString(totalSeconds, true)
    );
  } else if (state.type === "weekly") {
    const nextWeekTimestamp =
      getCurrentWeekTimestamp() + 7 * 24 * 60 * 60 * 1000;
    const currentTime = new Date().getTime();
    const totalSeconds = Math.floor((nextWeekTimestamp - currentTime) / 1000);
    $(".page.pageLeaderboards .titleAndButtons .timer").text(
      "Next reset in: " +
        DateTime.secondsToString(totalSeconds, true, true, ":", true, true)
    );
  }
}

function updateTimerVisibility(): void {
  let visible = true;

  if (
    (state.type === "daily" && state.yesterday) ||
    (state.type === "weekly" && state.lastWeek)
  ) {
    visible = false;
  }

  if (visible) {
    $(".page.pageLeaderboards .titleAndButtons .timer").removeClass(
      "invisible"
    );
  } else {
    $(".page.pageLeaderboards .titleAndButtons .timer").addClass("invisible");
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

// async function appendLanguageButtons(): Promise<void> {
//   const languages =
//     (await ServerConfiguration.get()?.dailyLeaderboards.validModeRules.map(
//       (r) => r.language
//     )) ?? [];

//   const el = $(".page.pageLeaderboards .buttonGroup.languageButtons");
//   el.empty();

//   for (const language of languages) {
//     el.append(`
//       <button data-language="${language}">
//         <i class="fas fa-globe"></i>
//         ${language}
//       </button>
//     `);
//   }
// }

function updateModeButtons(): void {
  if (state.type !== "allTime" && state.type !== "daily") return;
  const el = $(".page.pageLeaderboards .buttonGroup.modeButtons");
  el.find("button").removeClass("active");
  el.find(`button[data-mode=${state.mode2}]`).addClass("active");
}

function updateLanguageButtons(): void {
  if (state.type !== "daily") return;
  const el = $(".page.pageLeaderboards .buttonGroup.languageButtons");
  el.find("button").removeClass("active");
  el.find(`button[data-language=${state.language}]`).addClass("active");
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
    const totalPages = Math.ceil(state.count / state.pageSize);
    if (state.page > totalPages) {
      state.page = totalPages - 1;
    } else {
      state.page -= 1;
    }
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
  updateGetParameters();
  void requestData(true);
  updateContent();
}

function handleYesterdayLastWeekButton(action: string): void {
  if (state.type === "daily" && action === "toggleYesterday") {
    state.yesterday = !state.yesterday;
  } else if (state.type === "weekly" && action === "toggleLastWeek") {
    state.lastWeek = !state.lastWeek;
  }

  updateGetParameters();
  void requestData();
  updateContent();
  updateTitle();
}

function updateGetParameters(): void {
  const params = new URLSearchParams();

  params.set("type", state.type);
  if (state.type === "allTime") {
    params.set("mode2", state.mode2);
  } else if (state.type === "daily") {
    params.set("language", state.language);
    params.set("mode2", state.mode2);
    if (state.yesterday) {
      params.set("yesterday", "true");
    } else {
      params.delete("yesterday");
    }
  } else if (state.type === "weekly") {
    if (state.lastWeek) {
      params.set("lastWeek", "true");
    } else {
      params.delete("lastWeek");
    }
  }

  params.set("page", (state.page + 1).toString());

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

function readGetParameters(): void {
  const params = new URLSearchParams(window.location.search);

  const type = params.get("type") as "allTime" | "weekly" | "daily";
  if (type) {
    state.type = type;
  }

  if (state.type === "allTime") {
    const mode = params.get("mode2") as "15" | "60";
    if (mode) {
      state.mode2 = mode;
    }
  } else if (state.type === "daily") {
    const language = params.get("language");
    const dailyMode = params.get("mode2") as "15" | "60";
    const yesterday = params.get("yesterday") as string;
    if (language !== null) {
      state.language = language;
    }
    if (dailyMode) {
      state.mode2 = dailyMode;
    }
    if (yesterday !== null && yesterday === "true") {
      state.yesterday = true;
    }
  } else if (state.type === "weekly") {
    const lastWeek = params.get("lastWeek") as string;
    if (lastWeek !== null && lastWeek === "true") {
      state.lastWeek = true;
    }
  }

  const page = params.get("page");
  if (page !== null) {
    state.page = parseInt(page, 10) - 1;

    if (state.page < 0) {
      state.page = 0;
    }
  }
}

$(".page.pageLeaderboards .jumpButtons button").on("click", function () {
  const action = $(this).data("action") as string;
  if (action !== "goToPage") {
    handleJumpButton(action);
  }
});

$(".page.pageLeaderboards .bigtitle button").on("click", function () {
  const action = $(this).data("action") as string;
  handleYesterdayLastWeekButton(action);
});

$(".page.pageLeaderboards .buttonGroup.typeButtons").on(
  "click",
  "button",
  function () {
    const type = $(this).data("type") as "allTime" | "weekly" | "daily";
    if (state.type === type) return;
    state.type = type;
    if (state.type === "daily") {
      state.language = "english";
      state.yesterday = false;
    }
    if (state.type === "weekly") {
      state.lastWeek = false;
    }
    state.data = null;
    state.page = 0;
    void requestData();
    updateTypeButtons();
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
    const mode = $(this).data("mode") as "15" | "60";
    const language = $(this).data("language") as string;
    if (
      mode !== undefined &&
      (state.type === "allTime" || state.type === "daily")
    ) {
      if (state.mode2 === mode) return;
      state.mode2 = mode;
    } else if (language !== undefined && state.type === "daily") {
      if (state.language === language) return;
      state.language = language;
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
    // await appendLanguageButtons(); //todo figure out this race condition
    readGetParameters();
    startTimer();
    updateTypeButtons();
    updateTitle();
    updateSecondaryButtons();
    updateContent();
    updateGetParameters();
    void requestData();
  },
  afterShow: async (): Promise<void> => {
    updateSecondaryButtons();
    state.discordAvatarUrls = new Map<string, string>();
  },
});

$(async () => {
  Skeleton.save("pageLeaderboards");
});
