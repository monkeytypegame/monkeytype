import { PageWithUrlParams } from "./page";
import * as Skeleton from "../utils/skeleton";
import Config from "../config";
import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { capitalizeFirstLetter } from "../utils/strings";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import Format from "../utils/format";
import { getAuthenticatedUser, isAuthenticated } from "../firebase";
import * as DB from "../db";
import {
  endOfDay,
  endOfWeek,
  format,
  formatDuration,
  intervalToDuration,
  startOfDay,
  startOfWeek,
  subDays,
  subHours,
  subMinutes,
} from "date-fns";
import { differenceInSeconds } from "date-fns/differenceInSeconds";
import * as DateTime from "../utils/date-and-time";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import { getHTMLById as getBadgeHTMLbyId } from "../controllers/badge-controller";
import { isDevEnvironment } from "../utils/misc";
import { abbreviateNumber } from "../utils/numbers";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { UTCDateMini } from "@date-fns/utc";
import * as ConfigEvent from "../observables/config-event";
import { getActivePage } from "../signals/core";
import {
  PaginationQuery,
  FriendsOnlyQuery,
} from "@monkeytype/contracts/leaderboards";
import { Language, LanguageSchema } from "@monkeytype/schemas/languages";
import { isSafeNumber } from "@monkeytype/util/numbers";
import { Mode, Mode2, ModeSchema } from "@monkeytype/schemas/shared";
import * as ServerConfiguration from "../ape/server-configuration";
import { getAvatarElement } from "../utils/discord-avatar";
import { qs, qsa, qsr, onDOMReady } from "../utils/dom";

const LeaderboardTypeSchema = z.enum(["allTime", "weekly", "daily"]);
type LeaderboardType = z.infer<typeof LeaderboardTypeSchema>;
const utcDateFormat = "EEEE, do MMMM yyyy";
const localDateFormat = "EEEE, do MMMM yyyy HH:mm";

type AllTimeState = {
  type: "allTime";
  mode: "time";
  mode2: "15" | "60";
  language: "english";
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
  mode: Mode;
  mode2: Mode2<DailyState["mode"]>;
  yesterday: boolean;
  minWpm: number;
  language: Language;
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
  friendsOnly: boolean;
  title: string;
  error?: string;
  scrollToUserAfterFill: boolean;
  goToUserPage: boolean;
} & (AllTimeState | WeeklyState | DailyState);

const state = {
  loading: true,
  updating: false,
  type: "allTime",
  mode: "time",
  mode2: "15",
  data: null,
  userData: null,
  page: 0,
  pageSize: 50,
  friendsOnly: false,
  title: "All-time English Time 15 Leaderboard",
  scrollToUserAfterFill: false,
  goToUserPage: false,
} as State;

const SelectorSchema = z.object({
  type: LeaderboardTypeSchema,
  mode: ModeSchema.optional(),
  mode2: z.string().optional(),
  language: LanguageSchema.optional(),
  yesterday: z.boolean().optional(),
  lastWeek: z.boolean().optional(),
  friendsOnly: z.boolean().optional(),
});
const UrlParameterSchema = SelectorSchema.extend({
  page: z.number(),
  goToUserPage: z.boolean(),
}).partial();
type UrlParameter = z.infer<typeof UrlParameterSchema>;

const selectorLS = new LocalStorageWithSchema({
  key: "leaderboardSelector",
  schema: SelectorSchema,
  fallback: { type: "allTime", mode2: "15" },
});

type LanguagesByModeByMode2 = Partial<
  Record<Mode, Record<string /*mode2*/, Language[]>>
>;

type ValidLeaderboards = {
  allTime: LanguagesByModeByMode2;
  daily: LanguagesByModeByMode2;
};

const validLeaderboards: ValidLeaderboards = {
  allTime: {
    time: {
      "15": ["english"],
      "60": ["english"],
    },
  },
  daily: {},
};

function updateTitle(): void {
  const type =
    state.type === "allTime"
      ? "All-time"
      : state.type === "weekly"
        ? "Weekly XP"
        : "Daily";

  const friend = state.friendsOnly ? "Friends " : "";

  const language =
    state.type !== "weekly" ? capitalizeFirstLetter(state.language) : "";

  const mode =
    state.type !== "weekly"
      ? ` ${capitalizeFirstLetter(state.mode)} ${state.mode2}`
      : "";

  state.title = `${type} ${language} ${mode} ${friend}Leaderboard`;
  qs(".page.pageLeaderboards .bigtitle >.text")?.setText(state.title);

  qs(".page.pageLeaderboards .bigtitle .subtext")?.hide();
  qsa(".page.pageLeaderboards .bigtitle button")?.hide();
  qs(".page.pageLeaderboards .bigtitle .subtext .divider")?.hide();

  if (state.type === "daily") {
    qs(".page.pageLeaderboards .bigtitle .subtext")?.show();
    qs(
      ".page.pageLeaderboards .bigtitle button[data-action='toggleYesterday']",
    )?.show();
    qs(".page.pageLeaderboards .bigtitle .subtext .divider")?.show();

    if (state.yesterday) {
      qs(
        ".page.pageLeaderboards .bigtitle button[data-action='toggleYesterday']",
      )?.setHtml(`
        <i class="fas fa-forward"></i>
            show today
        `);
    } else {
      qs(
        ".page.pageLeaderboards .bigtitle button[data-action='toggleYesterday']",
      )?.setHtml(`
        <i class="fas fa-backward"></i>
            show yesterday
        `);
    }

    let timestamp = startOfDay(new UTCDateMini());
    if (state.yesterday) {
      timestamp = subHours(timestamp, 24);
    }

    updateTimeText(
      format(timestamp, utcDateFormat) + " UTC",
      utcToLocalDate(timestamp),
      utcToLocalDate(endOfDay(timestamp)),
    );
  } else if (state.type === "weekly") {
    qs(".page.pageLeaderboards .bigtitle .subtext")?.show();
    qs(
      ".page.pageLeaderboards .bigtitle button[data-action='toggleLastWeek']",
    )?.show();
    qs(".page.pageLeaderboards .bigtitle .subtext .divider")?.show();

    if (state.lastWeek) {
      qs(
        ".page.pageLeaderboards .bigtitle button[data-action='toggleLastWeek']",
      )?.setHtml(`
        <i class="fas fa-forward"></i>
            show this week
        `);
    } else {
      qs(
        ".page.pageLeaderboards .bigtitle button[data-action='toggleLastWeek']",
      )?.setHtml(`
        <i class="fas fa-backward"></i>
            show last week
        `);
    }

    let timestamp = startOfWeek(new UTCDateMini(), { weekStartsOn: 1 });
    if (state.lastWeek) {
      timestamp = subDays(timestamp, 7);
    }
    const endingTimestamp = endOfWeek(timestamp, { weekStartsOn: 1 });

    const dateString = `${format(timestamp, utcDateFormat)} - ${format(
      endingTimestamp,
      utcDateFormat,
    )} UTC`;
    updateTimeText(
      dateString,
      utcToLocalDate(timestamp),
      utcToLocalDate(endingTimestamp),
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

  const defineRequests = <TQuery, TRank, TData>(
    data: (args: {
      query: TQuery & PaginationQuery & FriendsOnlyQuery;
    }) => Promise<TData>,
    rank: (args: { query: TQuery }) => Promise<TRank>,
    baseQuery: TQuery,
  ): {
    rank: undefined | (() => Promise<TRank>);
    data: () => Promise<TData>;
  } => ({
    rank: async () =>
      rank({
        query: {
          ...baseQuery,
          friendsOnly: state.friendsOnly || undefined,
        },
      }),
    data: async () =>
      data({
        query: {
          ...baseQuery,
          page: state.page,
          pageSize: state.pageSize,
          friendsOnly: state.friendsOnly || undefined,
        },
      }),
  });

  let requests;
  if (state.type === "allTime") {
    requests = defineRequests(Ape.leaderboards.get, Ape.leaderboards.getRank, {
      language: "english",
      mode: "time",
      mode2: state.mode2,
    });
  } else if (state.type === "daily") {
    requests = defineRequests(
      Ape.leaderboards.getDaily,
      Ape.leaderboards.getDailyRank,
      {
        language: state.language,
        mode: state.mode,
        mode2: state.mode2,
        daysBefore: state.yesterday ? 1 : undefined,
      },
    );
  } else if (state.type === "weekly") {
    requests = defineRequests(
      Ape.leaderboards.getWeeklyXp,
      Ape.leaderboards.getWeeklyXpRank,
      {
        weeksBefore: state.lastWeek ? 1 : undefined,
      },
    );
  } else {
    throw new Error("unknown state type");
  }

  if (!isAuthenticated() || state.userData !== null) {
    requests.rank = undefined;
  }

  if (state.goToUserPage && requests.rank !== undefined) {
    state.goToUserPage = false;
    const rankResponse = await requests.rank();
    if (
      rankResponse !== undefined &&
      rankResponse.status === 200 &&
      rankResponse.body.data !== null
    ) {
      state.userData = rankResponse.body.data;
      state.page = Math.floor((state.userData.rank - 1) / state.pageSize);
      updateGetParameters();
    }
    requests.rank = undefined;
  }

  const [dataResponse, rankResponse] = await Promise.all([
    requests.data(),
    requests.rank?.(),
  ]);

  if (dataResponse.status === 200) {
    state.data = dataResponse.body.data.entries;
    state.count = dataResponse.body.data.count;
    state.pageSize = dataResponse.body.data.pageSize;

    if (state.type === "daily") {
      //@ts-expect-error not sure why this is causing errors when it's clearly defined in the schema
      // oxlint-disable-next-line no-unsafe-assignment
      state.minWpm = dataResponse.body.data.minWpm;
    }
  } else {
    state.data = null;

    if (dataResponse.status === 404) {
      state.error = "No leaderboard found";
    } else {
      state.error = "Something went wrong";
      Notifications.add(
        "Failed to get leaderboard: " + dataResponse.body.message,
        -1,
      );
    }
  }

  if (state.userData === null && rankResponse !== undefined) {
    if (rankResponse.status === 200) {
      if (rankResponse.body.data !== null) {
        state.userData = rankResponse.body.data;
      }
    } else {
      state.userData = null;
      state.error = "Something went wrong";
      Notifications.add("Failed to get rank: " + rankResponse.body.message, -1);
    }
  }

  state.loading = false;
  state.updating = false;
  updateContent();
  if (!update && isAuthenticated()) {
    fillUser();
  }
  return;
}

function updateJumpButtons(): void {
  const el = qsa(".page.pageLeaderboards .titleAndButtons .jumpButtons");
  el?.qsa("button")?.removeClass("active");

  const totalPages = Math.ceil(state.count / state.pageSize);

  if (totalPages <= 1) {
    el?.qsa("button")?.disable();
  } else {
    el?.qsa("button")?.enable();
  }

  if (state.page === 0) {
    el?.qs("button[data-action='previousPage']")?.disable();
    el?.qs("button[data-action='firstPage']")?.disable();
  } else {
    el?.qs("button[data-action='previousPage']")?.enable();
    el?.qs("button[data-action='firstPage']")?.enable();
  }

  if (isAuthenticated()) {
    const userButton = el?.qs("button[data-action='userPage']");
    if (!state.userData) {
      userButton?.disable();
    } else {
      const userPage = Math.floor((state.userData.rank - 1) / state.pageSize);
      if (state.page === userPage) {
        userButton?.disable();
      } else {
        userButton?.enable();
      }
    }
  }

  if (state.page >= totalPages - 1) {
    el?.qs("button[data-action='nextPage']")?.disable();
  } else {
    el?.qs("button[data-action='nextPage']")?.enable();
  }
}

function buildTableRow(entry: LeaderboardEntry, me = false): HTMLElement {
  const formatted = {
    wpm: Format.typingSpeed(entry.wpm, { showDecimalPlaces: true }),
    acc: Format.percentage(entry.acc, { showDecimalPlaces: true }),
    raw: Format.typingSpeed(entry.raw, { showDecimalPlaces: true }),
    con: Format.percentage(entry.consistency, { showDecimalPlaces: true }),
  };

  const element = document.createElement("tr");
  if (me) {
    element.classList.add("me");
  }
  element.dataset["uid"] = entry.uid;
  element.innerHTML = `
      <td>${formatRank(entry.friendsRank)}</td>
      <td>${formatRank(entry.rank)}</td>
      <td>
        <div class="avatarNameBadge">
          <div class="avatarPlaceholder"></div>
          <a href="${location.origin}/profile/${
            entry.name
          }" class="entryName" uid=${entry.uid} router-link>${entry.name}</a>
          <div class="flagsAndBadge">
            ${getHtmlByUserFlags({
              ...entry,
              isFriend: DB.isFriend(entry.uid),
            })}
            ${
              isSafeNumber(entry.badgeId) ? getBadgeHTMLbyId(entry.badgeId) : ""
            }
          </div>
        </div>
      </td>
      <td class="stat narrow">
      ${formatted.wpm}
        <div class="sub">${formatted.acc}</div>
      </td>
      </td>
      <td class="stat narrow rawAndConsistency">
      ${formatted.raw}
        <div class="sub">${formatted.con}</div>
      </td>
      <td class="stat wide">${formatted.wpm}</td>
      <td class="stat wide">${formatted.acc}</td>
      <td class="stat wide">${formatted.raw}</td>
      <td class="stat wide">${formatted.con}</td>
      <td class="date">${format(
        entry.timestamp,
        "dd MMM yyyy",
      )}<div class="sub">${format(entry.timestamp, "HH:mm")}</div></td>
    
  `;
  element
    .querySelector(".avatarPlaceholder")
    ?.replaceWith(getAvatarElement(entry));
  return element;
}

function buildWeeklyTableRow(
  entry: XpLeaderboardEntry,
  me = false,
): HTMLElement {
  const activeDiff = formatDistanceToNow(entry.lastActivityTimestamp, {
    addSuffix: true,
  });
  const element = document.createElement("tr");
  if (me) {
    element.classList.add("me");
  }
  element.dataset["uid"] = entry.uid;
  element.innerHTML = `
      <td>${formatRank(entry.friendsRank)}</td>
      <td>${formatRank(entry.rank)}</td>
      <td>
        <div class="avatarNameBadge">
          <div class="avatarPlaceholder"></div>
          <a href="${location.origin}/profile/${
            entry.uid
          }?isUid" class="entryName" uid=${entry.uid} router-link>${entry.name}</a>
          <div class="flagsAndBadge">
            ${getHtmlByUserFlags({
              ...entry,
              isFriend: DB.isFriend(entry.uid),
            })}
            ${
              isSafeNumber(entry.badgeId) ? getBadgeHTMLbyId(entry.badgeId) : ""
            }
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
        ":",
      )}</td>
      <td class="stat narrow">
      ${entry.totalXp < 1000 ? entry.totalXp : abbreviateNumber(entry.totalXp)}
      <div class="sub">${DateTime.secondsToString(
        Math.round(entry.timeTypedSeconds),
        true,
        true,
        ":",
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
  element
    .querySelector(".avatarPlaceholder")
    ?.replaceWith(getAvatarElement(entry));
  return element;
}

function fillTable(): void {
  const table = qs(".page.pageLeaderboards table tbody");
  table?.empty();

  if (state.friendsOnly) {
    table?.getParent()?.addClass("friendsOnly");
  } else {
    table?.getParent()?.removeClass("friendsOnly");
  }

  qsa(".page.pageLeaderboards table thead")?.hide();
  if (state.type === "allTime" || state.type === "daily") {
    qs(".page.pageLeaderboards table thead.allTimeAndDaily")?.show();
  } else if (state.type === "weekly") {
    qs(".page.pageLeaderboards table thead.weekly")?.show();
  }

  if (state.data === null || state.data.length === 0) {
    table?.appendHtml(`<tr><td colspan="7" class="empty">No data</td></tr>`);
    qs(".page.pageLeaderboards table")?.show();
    return;
  }

  if (state.type === "allTime" || state.type === "daily") {
    for (const entry of state.data) {
      const me = getAuthenticatedUser()?.uid === entry.uid;
      table?.append(buildTableRow(entry, me));
    }
  } else if (state.type === "weekly") {
    for (const entry of state.data) {
      const me = getAuthenticatedUser()?.uid === entry.uid;
      table?.append(buildWeeklyTableRow(entry, me));
    }
  }

  qs(".page.pageLeaderboards table")?.show();
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
    qs(".page.pageLeaderboards .bigUser")?.setHtml(
      '<div class="warning">You have opted out of the leaderboards.</div>',
    );
    return;
  }

  if (isAuthenticated() && DB.getSnapshot()?.banned === true) {
    qs(".page.pageLeaderboards .bigUser")?.setHtml(
      '<div class="warning">Your account is banned</div>',
    );
    return;
  }

  const minTimeTyping =
    ServerConfiguration.get()?.leaderboards.minTimeTyping ?? 7200;

  if (
    isAuthenticated() &&
    !isDevEnvironment() &&
    (DB.getSnapshot()?.typingStats?.timeTyping ?? 0) < minTimeTyping
  ) {
    qs(".page.pageLeaderboards .bigUser")?.setHtml(
      `<div class="warning">Your account must have ${formatDuration(
        intervalToDuration({ start: 0, end: minTimeTyping * 1000 }),
      )} typed to be placed on the leaderboard.</div>`,
    );
    return;
  }

  if (isAuthenticated() && state.type === "daily" && state.userData === null) {
    let str = `Not qualified`;

    if (!state.yesterday) {
      str += ` (min speed required: ${Format.typingSpeed(state.minWpm, {
        showDecimalPlaces: true,
        suffix: ` ${Config.typingSpeedUnit}`,
      })})`;
    }

    qs(".page.pageLeaderboards .bigUser")?.setHtml(
      `<div class="warning">${str}</div>`,
    );
    return;
  }

  if (isAuthenticated() && state.userData === null) {
    qs(".page.pageLeaderboards .bigUser")?.setHtml(
      `<div class="warning">Not qualified</div>`,
    );
    return;
  }

  if (state.data === null) {
    return;
  }

  if (state.type === "allTime" || state.type === "daily") {
    if (!state.userData || !state.count) {
      qs(".page.pageLeaderboards .bigUser")?.hide();
      qs(".page.pageLeaderboards .tableAndUser > .divider")?.show();
      return;
    }

    const userData = state.userData;
    const rank = state.friendsOnly
      ? (userData.friendsRank as number)
      : userData.rank;
    const percentile = (rank / state.count) * 100;

    let percentileString = `Top ${percentile.toFixed(2)}%`;
    if (rank === 1) {
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
        diff,
      )} since you last checked
      )`;
    } else {
      diffText = ` (<i class="fas fa-fw fa-angle-down"></i>${Math.abs(
        diff,
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
          <div class="rank">${formatRank(rank)}</div>
        <div class="userInfo">
          <div class="top">You (${percentileString})</div>
          <div class="bottom">${diffText}</div>
        </div>
        <div class="stat wide">
          <div class="title">${Config.typingSpeedUnit}</div>
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
            "dd MMM yyyy HH:mm",
          )}</div>
        </div>


        <div class="stat narrow">
          <div>${formatted.wpm}</div>
          <div class="sub">${formatted.acc}</div>
        </div>
        <div class="stat narrow rawAndConsistency">
          <div>${formatted.raw}</div>
          <div class="sub">${formatted.con}</div>
        </div>
        <div class="stat narrow">
          <div>${format(userData.timestamp, "dd MMM yyyy")}</div>
          <div class="sub">${format(userData.timestamp, "HH:mm")}</div>
        </div>
        `;

    qs(".page.pageLeaderboards .bigUser")?.setHtml(html);
  } else if (state.type === "weekly") {
    if (!state.userData || !state.count) {
      qs(".page.pageLeaderboards .bigUser")?.hide();
      return;
    }

    const userData = state.userData;
    const rank = state.friendsOnly
      ? (userData.friendsRank as number)
      : userData.rank;
    const percentile = (rank / state.count) * 100;

    let percentileString = `Top ${percentile.toFixed(2)}%`;
    if (rank === 1) {
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
        diff,
      )} since you last checked
      )`;
    } else {
      diffText = ` (<i class="fas fa-fw fa-angle-down"></i>${Math.abs(
        diff,
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
        ":",
      ),
    };

    const html = `
          <div class="rank">${formatRank(rank)}</div>
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
          <div class="title">last activity</div>
          <div class="value">${format(
            userData.lastActivityTimestamp,
            "dd MMM yyyy HH:mm",
          )}</div>
        </div>
        <div class="stat narrow">
          <div>${format(userData.lastActivityTimestamp, "dd MMM yyyy")}</div>
          <div class="sub">${format(
            userData.lastActivityTimestamp,
            "HH:mm",
          )}</div>
        </div>
        `;

    qs(".page.pageLeaderboards .bigUser")?.setHtml(html);
  }
  qs(".page.pageLeaderboards .bigUser")?.show();
  qs(".page.pageLeaderboards .tableAndUser > .divider")?.hide();
}

function updateContent(): void {
  qsa(".page.pageLeaderboards .loading").hide();
  qsa(".page.pageLeaderboards .updating").addClass("invisible");
  qs(".page.pageLeaderboards .error")?.hide();

  if (state.error !== undefined) {
    qs(".page.pageLeaderboards .error")?.show();
    qs(".page.pageLeaderboards .error p")?.setText(state.error);
    enableButtons();
    return;
  }

  if (state.updating) {
    disableButtons();
    qsa(".page.pageLeaderboards .updating").removeClass("invisible");
    return;
  } else if (state.loading) {
    disableButtons();
    qs(".page.pageLeaderboards .bigUser")?.hide();
    qsa(".page.pageLeaderboards .titleAndButtons")?.hide();
    qsa(".page.pageLeaderboards .loading").show();
    qs(".page.pageLeaderboards table")?.hide();
    return;
  } else {
    enableButtons();
  }

  if (isAuthenticated()) {
    qsa(".page.pageLeaderboards .needAuth")?.show();
  } else {
    qsa(".page.pageLeaderboards .needAuth")?.hide();
  }

  if (state.data === null) {
    Notifications.add("Data is null");
    return;
  }

  qsa(".page.pageLeaderboards .titleAndButtons")?.show();
  updateJumpButtons();
  updateTimerVisibility();
  fillTable();

  for (const element of document.querySelectorAll(
    ".page.pageLeaderboards .wide.speedUnit, .page.pageLeaderboards .narrow.speedUnit span",
  )) {
    element.innerHTML = Config.typingSpeedUnit;
  }

  if (state.scrollToUserAfterFill) {
    document.querySelector(".tableAndUser .me")?.scrollIntoView({
      block: "center",
    });
    state.scrollToUserAfterFill = false;
  }
}

function updateSideButtons(): void {
  updateTypeButtons();
  updateFriendsButtons();
  updateModeButtons();
  updateLanguageButtons();
}

function updateTypeButtons(): void {
  const el = qs(".page.pageLeaderboards .buttonGroup.typeButtons");
  el?.qsa("button")?.removeClass("active");
  el?.qs(`button[data-type=${state.type}]`)?.addClass("active");
}

function updateFriendsButtons(): void {
  const friendsOnlyGroup = qs(
    ".page.pageLeaderboards .buttonGroup.friendsOnlyButtons",
  );
  if (
    isAuthenticated() &&
    (ServerConfiguration.get()?.connections.enabled ?? false)
  ) {
    friendsOnlyGroup?.show();
  } else {
    friendsOnlyGroup?.hide();
    state.friendsOnly = false;
    return;
  }

  const everyoneButton = qs(
    ".page.pageLeaderboards .buttonGroup.friendsOnlyButtons .everyone",
  );
  const friendsOnlyButton = qs(
    ".page.pageLeaderboards .buttonGroup.friendsOnlyButtons .friendsOnly",
  );
  if (state.friendsOnly) {
    friendsOnlyButton?.addClass("active");
    everyoneButton?.removeClass("active");
  } else {
    friendsOnlyButton?.removeClass("active");
    everyoneButton?.addClass("active");
  }
}

function updateModeButtons(): void {
  if (state.type !== "allTime" && state.type !== "daily") {
    qs(".page.pageLeaderboards .buttonGroup.modeButtons")?.hide();
    return;
  }
  qs(".page.pageLeaderboards .buttonGroup.modeButtons")?.show();

  const el = qs(".page.pageLeaderboards .buttonGroup.modeButtons");
  el?.qsa("button")?.removeClass("active");
  el?.qs(
    `button[data-mode="${state.mode}"][data-mode2="${state.mode2}"]`,
  )?.addClass("active");

  //hide all mode buttons
  qsa(`.page.pageLeaderboards .buttonGroup.modeButtons button`)?.hide();

  //show all valid ones
  for (const mode of Object.keys(validLeaderboards[state.type]) as Mode[]) {
    for (const mode2 of Object.keys(
      // oxlint-disable-next-line no-non-null-assertion
      validLeaderboards[state.type][mode]!,
    )) {
      qs(
        `.page.pageLeaderboards .buttonGroup.modeButtons button[data-mode="${mode}"][data-mode2="${mode2}"]`,
      )?.show();
    }
  }
}

function updateLanguageButtons(): void {
  if (state.type !== "daily") {
    qs(".page.pageLeaderboards .buttonGroup.languageButtons")?.hide();
    return;
  }
  qs(".page.pageLeaderboards .buttonGroup.languageButtons")?.show();

  const el = qs(".page.pageLeaderboards .buttonGroup.languageButtons");
  el?.qsa("button")?.removeClass("active");
  el?.qs(`button[data-language=${state.language}]`)?.addClass("active");

  //hide all languages
  qsa(`.page.pageLeaderboards .buttonGroup.languageButtons button`)?.hide();

  //show all valid ones
  for (const lang of validLeaderboards[state.type][state.mode]?.[state.mode2] ??
    []) {
    qs(
      `.page.pageLeaderboards .buttonGroup.languageButtons button[data-language="${lang}"]`,
    )?.show();
  }
}

let updateTimer: number | undefined;

function updateTimerElement(): void {
  if (state.type === "daily") {
    const diff = differenceInSeconds(new Date(), endOfDay(new UTCDateMini()));

    qs(".page.pageLeaderboards .titleAndButtons .timer")?.setText(
      "Next reset in: " + DateTime.secondsToString(diff, true),
    );
  } else if (state.type === "allTime") {
    const date = new Date();
    const minutesToNextUpdate = 14 - (date.getMinutes() % 15);
    const secondsToNextUpdate = 60 - date.getSeconds();
    const totalSeconds = minutesToNextUpdate * 60 + secondsToNextUpdate;
    qs(".page.pageLeaderboards .titleAndButtons .timer")?.setText(
      "Next update in: " + DateTime.secondsToString(totalSeconds, true),
    );
  } else if (state.type === "weekly") {
    const nextWeekTimestamp = endOfWeek(new UTCDateMini(), { weekStartsOn: 1 });
    const totalSeconds = differenceInSeconds(new Date(), nextWeekTimestamp);
    qs(".page.pageLeaderboards .titleAndButtons .timer")?.setText(
      "Next reset in: " +
        DateTime.secondsToString(totalSeconds, true, true, ":", true, true),
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
    qs(".page.pageLeaderboards .titleAndButtons .timer")?.removeClass(
      "invisible",
    );
  } else {
    qs(".page.pageLeaderboards .titleAndButtons .timer")?.addClass("invisible");
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
  qs(".page.pageLeaderboards .titleAndButtons .timer")?.setText("-");
}

function convertRuleOption(rule: string): string[] {
  if (rule.startsWith("(")) {
    return rule.slice(1, -1).split("|");
  }
  return [rule];
}

async function updateValidDailyLeaderboards(): Promise<void> {
  const dailyRulesConfig =
    ServerConfiguration.get()?.dailyLeaderboards.validModeRules;

  if (dailyRulesConfig === undefined) {
    throw new Error(
      "cannot load server configuration for dailyLeaderboards.validModeRules",
    );
  }

  //a rule can contain multiple values. create a flat list out of them
  const dailyRules = dailyRulesConfig.flatMap((rule) => {
    const languages = convertRuleOption(rule.language) as Language[];
    const mode2List = convertRuleOption(rule.mode2);

    return mode2List.map((mode2) => ({
      mode: rule.mode as Mode,
      mode2,
      languages,
    }));
  });

  validLeaderboards.daily = dailyRules.reduce<
    Partial<Record<Mode, Record<string /*mode2*/, Language[]>>>
  >((acc, { mode, mode2, languages }) => {
    let modes = acc[mode];
    if (modes === undefined) {
      modes = {};
      acc[mode] = modes;
    }

    let modes2 = modes[mode2];
    if (modes2 === undefined) {
      modes2 = [];
      modes[mode2] = modes2;
    }

    modes2.push(...languages);
    return acc;
  }, {});
}

function checkIfLeaderboardIsValid(): void {
  if (state.type === "weekly") return;

  const validLeaderboard = validLeaderboards[state.type];

  let validModes2 = validLeaderboard[state.mode];
  if (validModes2 === undefined) {
    const firstMode = Object.keys(validLeaderboard).sort()[0] as Mode;
    if (firstMode === undefined) {
      throw new Error(`no valid leaderboard config for type ${state.type}`);
    }
    state.mode = firstMode;
    // oxlint-disable-next-line no-non-null-assertion
    validModes2 = validLeaderboard[state.mode]!;
  }

  let supportedLanguages = validModes2[state.mode2];
  if (supportedLanguages === undefined) {
    const firstMode2 = Object.keys(validModes2).sort(
      (a, b) => parseInt(a) - parseInt(b),
    )[0];
    if (firstMode2 === undefined) {
      throw new Error(
        `no valid leaderboard config for type ${state.type} and mode ${state.mode}`,
      );
    }
    state.mode2 = firstMode2;
    supportedLanguages = validModes2[state.mode2];
  }

  if (supportedLanguages === undefined || supportedLanguages.length < 1) {
    throw new Error(
      `Daily leaderboard config not valid for mode:${state.mode} mode2:${state.mode2}`,
    );
  }

  if (!supportedLanguages.includes(state.language)) {
    state.language = supportedLanguages.sort()[0] as Language;
  }
}

async function appendModeAndLanguageButtons(): Promise<void> {
  const modes = Array.from(
    new Set(
      Object.values(validLeaderboards).flatMap(
        (rule) => Object.keys(rule) as Mode[],
      ),
    ),
  ).sort();

  const mode2Buttons = modes.flatMap((mode) => {
    const modes2 = Array.from(
      new Set(
        Object.values(validLeaderboards).flatMap((rule) =>
          Object.keys(rule[mode] ?? {}),
        ),
      ),
    ).sort((a, b) => parseInt(a) - parseInt(b));

    const icon = mode === "time" ? "fas fa-clock" : "fas fa-align-left";

    return modes2.map(
      (mode2) => `<button data-mode="${mode}" data-mode2="${mode2}">
      <i class="${icon}"></i>
       ${mode} ${mode2}
    </button>`,
    );
  });
  qs(".modeButtons")?.setHtml(
    `<div class="divider"></div>` + mode2Buttons.join("\n"),
  );

  const availableLanguages = Array.from(
    new Set(
      Object.values(validLeaderboards)
        .flatMap((rule) => Object.values(rule))
        .flatMap((mode) => Object.values(mode))
        .flatMap((it) => it),
    ),
  ).sort();

  const languageButtons = availableLanguages.map(
    (lang) =>
      `<button data-language="${lang}">
          <i class="fas fa-globe"></i>
          ${lang}
        </button>`,
  );
  qs(".languageButtons")?.setHtml(
    `<div class="divider"></div>` + languageButtons.join("\n"),
  );
}

function disableButtons(): void {
  qsa(".page.pageLeaderboards button")?.disable();
}

function enableButtons(): void {
  qsa(".page.pageLeaderboards button")?.enable();
}

export function goToPage(pageId: number): void {
  if (pageId < 0 || pageId === state.page) return;
  handleJumpButton("goToPage", pageId);
}

type Action =
  | "firstPage"
  | "previousPage"
  | "nextPage"
  | "goToPage"
  | "userPage";
function handleJumpButton(action: Action, page?: number): void {
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
      const rank = state.userData?.rank;
      if (isSafeNumber(rank)) {
        // - 1 to make sure position 50 with page size 50 is on the first page (page 0)
        const page = Math.floor((rank - 1) / state.pageSize);

        if (state.page === page) {
          return;
        }

        state.page = page;
        state.scrollToUserAfterFill = true;
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
  if (state.goToUserPage) {
    //parameters are updated in the requestData method
    return;
  }

  const params: UrlParameter = {};

  params.type = state.type;
  if (state.type === "allTime") {
    params.mode2 = state.mode2;
  } else if (state.type === "daily") {
    params.mode = state.mode;
    params.language = state.language;
    params.mode2 = state.mode2;
    if (state.yesterday) {
      params.yesterday = true;
    }
  } else if (state.type === "weekly") {
    if (state.lastWeek) {
      params.lastWeek = true;
    }
  }

  params.page = state.page + 1;

  if (state.friendsOnly) {
    params.friendsOnly = true;
  }
  page.setUrlParams(params);

  selectorLS.set(state);
}

function readGetParameters(params?: UrlParameter): void {
  if (params === undefined) {
    Object.assign(state, selectorLS.get());
    return;
  }

  if (params.type !== undefined) {
    state.type = params.type;
  }

  state.friendsOnly = params.friendsOnly ?? false;

  if (state.type === "allTime") {
    if (params.mode2 !== undefined) {
      state.mode2 = params.mode2 as AllTimeState["mode2"];
    }
  } else if (state.type === "daily") {
    if (params.language !== undefined) {
      state.language = params.language;
    }
    if (params.mode2 !== undefined) {
      state.mode2 = params.mode2;
    }
    if (params.mode !== undefined) {
      state.mode = params.mode;
    }
    if (params.yesterday !== undefined) {
      state.yesterday = params.yesterday;
    }
  } else if (state.type === "weekly") {
    if (params.lastWeek !== undefined) {
      state.lastWeek = params.lastWeek;
    }
  }

  if (params.page !== undefined) {
    state.page = params.page - 1;

    if (state.page < 0) {
      state.page = 0;
    }
  }
  if (params.goToUserPage === true) {
    state.goToUserPage = true;
  }
}

function utcToLocalDate(timestamp: UTCDateMini): Date {
  return subMinutes(timestamp, new Date().getTimezoneOffset());
}

function updateTimeText(
  dateString: string,
  localStart: Date,
  localEnd: Date,
): void {
  const localDateString =
    "local time \n" +
    format(localStart, localDateFormat) +
    " - \n" +
    format(localEnd, localDateFormat);

  const text = qs(".page.pageLeaderboards .bigtitle .subtext > .text");
  text?.setText(`${dateString}`);
  text?.setAttribute("aria-label", localDateString);
}

function formatRank(rank: number | undefined): string {
  if (rank === undefined) return "";
  if (rank === 1) return '<i class="fas fa-fw fa-crown"></i>';

  return rank.toString();
}

qsa(".page.pageLeaderboards .jumpButtons button")?.on("click", function () {
  const action = this.getAttribute("data-action") as Action;
  if (action !== "goToPage") {
    handleJumpButton(action);
  }
});

qsa(".page.pageLeaderboards .bigtitle button")?.on("click", function () {
  const action = this.getAttribute("data-action") as string;
  handleYesterdayLastWeekButton(action);
});

qs(".page.pageLeaderboards .buttonGroup.typeButtons")?.onChild(
  "click",
  "button",
  function () {
    const type = this.getAttribute("data-type") as
      | "allTime"
      | "weekly"
      | "daily";
    if (state.type === type) return;
    state.type = type;
    if (state.type === "daily") {
      state.language = "english";
      state.yesterday = false;
    }
    if (state.type === "weekly") {
      state.lastWeek = false;
    }
    checkIfLeaderboardIsValid();
    state.data = null;
    state.page = 0;
    void requestData();
    updateTitle();
    updateSideButtons();
    updateContent();
    updateGetParameters();
  },
);

qs(".page.pageLeaderboards .buttonGroup.modeButtons")?.onChild(
  "click",
  "button",
  function () {
    const mode = this.getAttribute("data-mode") as Mode;
    const mode2 = this.getAttribute("data-mode2");

    if (
      mode !== undefined &&
      mode2 !== undefined &&
      mode2 !== null &&
      (state.type === "allTime" || state.type === "daily")
    ) {
      if (state.mode === mode && state.mode2 === mode2) return;
      state.mode = mode;
      state.mode2 = mode2;
      state.page = 0;
    } else {
      return;
    }
    checkIfLeaderboardIsValid();
    state.data = null;
    void requestData();
    updateSideButtons();
    updateTitle();
    updateContent();
    updateGetParameters();
  },
);

qs(".page.pageLeaderboards .buttonGroup.languageButtons")?.onChild(
  "click",
  "button",
  function () {
    const language = this.getAttribute("data-language") as Language;

    if (language !== undefined && state.type === "daily") {
      if (state.language === language) return;
      state.language = language;
      state.page = 0;
    } else {
      return;
    }
    checkIfLeaderboardIsValid();
    state.data = null;
    void requestData();
    updateSideButtons();
    updateTitle();
    updateContent();
    updateGetParameters();
  },
);

qs(".page.pageLeaderboards .buttonGroup.friendsOnlyButtons")?.onChild(
  "click",
  "button",
  () => {
    state.friendsOnly = !state.friendsOnly;
    state.page = 0;
    void requestData();
    updateTitle();
    updateSideButtons();
    updateContent();
    updateGetParameters();
  },
);

export const page = new PageWithUrlParams({
  id: "leaderboards",
  element: qsr(".page.pageLeaderboards"),
  path: "/leaderboards",
  urlParamsSchema: UrlParameterSchema,
  loadingOptions: {
    style: "spinner",
    loadingMode: () => "sync",
    loadingPromise: async () => {
      await ServerConfiguration.configurationPromise;
    },
  },

  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLeaderboards");
    stopTimer();
  },
  beforeShow: async (options): Promise<void> => {
    Skeleton.append("pageLeaderboards", "main");
    await updateValidDailyLeaderboards();
    await appendModeAndLanguageButtons();
    readGetParameters(options.urlParams);
    checkIfLeaderboardIsValid();
    startTimer();
    updateTitle();
    updateContent();
    updateSideButtons();
    updateGetParameters();
    void requestData(false);
  },
  afterShow: async (): Promise<void> => {
    // updateSideButtons();
  },
});

onDOMReady(async () => {
  Skeleton.save("pageLeaderboards");
});

ConfigEvent.subscribe(({ key }) => {
  if (getActivePage() === "leaderboards" && key === "typingSpeedUnit") {
    updateContent();
    fillUser();
  }
});
