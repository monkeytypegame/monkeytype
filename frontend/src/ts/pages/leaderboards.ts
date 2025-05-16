import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import Config from "../config";
import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/contracts/schemas/leaderboards";
import { capitalizeFirstLetter } from "../utils/strings";
import Ape from "../ape";
import * as Notifications from "../elements/notifications";
import Format from "../utils/format";
import { Auth, isAuthenticated } from "../firebase";
import * as DB from "../db";
import {
  endOfDay,
  endOfWeek,
  format,
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
import {
  applyReducedMotion,
  getDiscordAvatarUrl,
  isDevEnvironment,
} from "../utils/misc";
import { abbreviateNumber } from "../utils/numbers";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import {
  safeParse as parseUrlSearchParams,
  serialize as serializeUrlSearchParams,
} from "zod-urlsearchparams";
import { UTCDateMini } from "@date-fns/utc";
import * as ConfigEvent from "../observables/config-event";
import * as ActivePage from "../states/active-page";
import { PaginationQuery } from "@monkeytype/contracts/leaderboards";
import {
  Language,
  LanguageSchema,
} from "@monkeytype/contracts/schemas/languages";
import { isSafeNumber } from "@monkeytype/util/numbers";

const LeaderboardTypeSchema = z.enum(["allTime", "weekly", "daily"]);
type LeaderboardType = z.infer<typeof LeaderboardTypeSchema>;
const utcDateFormat = "EEEE, do MMMM yyyy";
const localDateFormat = "EEEE, do MMMM yyyy HH:mm";

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
  title: string;
  error?: string;
  discordAvatarUrls: Map<string, string>;
  scrollToUserAfterFill: boolean;
  goToUserPage: boolean;
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
  scrollToUserAfterFill: false,
  goToUserPage: false,
} as State;

const SelectorSchema = z.object({
  type: LeaderboardTypeSchema,
  mode2: z.enum(["15", "60"]).optional(),
  language: LanguageSchema.optional(),
  yesterday: z.boolean().optional(),
  lastWeek: z.boolean().optional(),
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

    let timestamp = startOfDay(new UTCDateMini());
    if (state.yesterday) {
      timestamp = subHours(timestamp, 24);
    }

    updateTimeText(
      format(timestamp, utcDateFormat) + " UTC",
      utcToLocalDate(timestamp),
      utcToLocalDate(endOfDay(timestamp))
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

    let timestamp = startOfWeek(new UTCDateMini(), { weekStartsOn: 1 });
    if (state.lastWeek) {
      timestamp = subDays(timestamp, 7);
    }
    const endingTimestamp = endOfWeek(timestamp, { weekStartsOn: 1 });

    const dateString = `${format(timestamp, utcDateFormat)} - ${format(
      endingTimestamp,
      utcDateFormat
    )} UTC`;
    updateTimeText(
      dateString,
      utcToLocalDate(timestamp),
      utcToLocalDate(endingTimestamp)
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
    data: (args: { query: TQuery & PaginationQuery }) => Promise<TData>,
    rank: (args: { query: TQuery }) => Promise<TRank>,
    baseQuery: TQuery
  ): {
    rank: undefined | (() => Promise<TRank>);
    data: () => Promise<TData>;
  } => ({
    rank: async () => rank({ query: baseQuery }),
    data: async () =>
      data({
        query: { ...baseQuery, page: state.page, pageSize: state.pageSize },
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
        mode: "time",
        mode2: state.mode2,
        daysBefore: state.yesterday ? 1 : undefined,
      }
    );
  } else if (state.type === "weekly") {
    requests = defineRequests(
      Ape.leaderboards.getWeeklyXp,
      Ape.leaderboards.getWeeklyXpRank,
      {
        weeksBefore: state.lastWeek ? 1 : undefined,
      }
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      state.minWpm = dataResponse.body.data.minWpm;
    }
  } else {
    state.data = null;
    state.error = "Something went wrong";
    Notifications.add(
      "Failed to get leaderboard: " + dataResponse.body.message,
      -1
    );
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
}

function updateJumpButtons(): void {
  const el = $(".page.pageLeaderboards .titleAndButtons .jumpButtons");
  el.find("button").removeClass("active");

  const totalPages = Math.ceil(state.count / state.pageSize);

  if (totalPages <= 1) {
    el.find("button").addClass("disabled");
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

  if (isAuthenticated()) {
    const userButton = el.find("button[data-action='userPage']");
    if (!state.userData) {
      userButton.addClass("disabled");
    } else {
      const userPage = Math.floor((state.userData.rank - 1) / state.pageSize);
      if (state.page === userPage) {
        userButton.addClass("disabled");
      } else {
        userButton.removeClass("disabled");
      }
    }
  }

  if (state.page >= totalPages - 1) {
    el.find("button[data-action='nextPage']").addClass("disabled");
  } else {
    el.find("button[data-action='nextPage']").removeClass("disabled");
  }
}

async function getAvatarUrls(
  data: {
    uid: string;
    discordId?: string | undefined;
    discordAvatar?: string | undefined;
  }[]
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
    (DB.getSnapshot()?.typingStats?.timeTyping ?? 0) < 7200
  ) {
    $(".page.pageLeaderboards .bigUser").html(
      '<div class="warning">Your account must have 2 hours typed to be placed on the leaderboard.</div>'
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

    $(".page.pageLeaderboards .bigUser").html(
      `<div class="warning">${str}</div>`
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
          <div class="title">last activity</div>
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

  for (const element of document.querySelectorAll(
    ".page.pageLeaderboards .speedUnit"
  )) {
    element.innerHTML = Config.typingSpeedUnit;
  }

  if (state.scrollToUserAfterFill) {
    const windowHeight = $(window).height() ?? 0;
    const offset = $(`.tableAndUser .me`).offset()?.top ?? 0;
    const scrollTo = offset - windowHeight / 2;
    $([document.documentElement, document.body]).animate(
      {
        scrollTop: scrollTo,
      },
      applyReducedMotion(500)
    );
    state.scrollToUserAfterFill = false;
  }
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
    const diff = differenceInSeconds(new Date(), endOfDay(new UTCDateMini()));

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
    const nextWeekTimestamp = endOfWeek(new UTCDateMini(), { weekStartsOn: 1 });
    const totalSeconds = differenceInSeconds(new Date(), nextWeekTimestamp);
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
      const user = Auth?.currentUser;
      if (user) {
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

  const urlParams = serializeUrlSearchParams({
    schema: UrlParameterSchema,
    data: params,
  });

  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
  window.history.replaceState({}, "", newUrl);

  selectorLS.set(state);
}

function readGetParameters(): void {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.size === 0) {
    Object.assign(state, selectorLS.get());
    return;
  }

  const parsed = parseUrlSearchParams({
    schema: UrlParameterSchema,
    input: urlParams,
  });
  if (!parsed.success) {
    return;
  }
  const params = parsed.data;

  if (params.type !== undefined) {
    state.type = params.type;
  }

  if (state.type === "allTime") {
    if (params.mode2) {
      state.mode2 = params.mode2;
    }
  } else if (state.type === "daily") {
    if (params.language !== undefined) {
      state.language = params.language;
    }
    if (state.language === undefined) {
      state.language = "english";
    }
    if (params.mode2 !== undefined) {
      state.mode2 = params.mode2;
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
  if (params.goToUserPage) {
    state.goToUserPage = true;
  }
}

function utcToLocalDate(timestamp: UTCDateMini): Date {
  return subMinutes(timestamp, new Date().getTimezoneOffset());
}

function updateTimeText(
  dateString: string,
  localStart: Date,
  localEnd: Date
): void {
  const localDateString =
    "local time \n" +
    format(localStart, localDateFormat) +
    " - \n" +
    format(localEnd, localDateFormat);

  const text = $(".page.pageLeaderboards .bigtitle .subtext > .text");
  text.text(`${dateString}`);
  text.attr("aria-label", localDateString);
}

$(".page.pageLeaderboards .jumpButtons button").on("click", function () {
  const action = $(this).data("action") as Action;
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
    const mode = $(this).attr("data-mode") as "15" | "60" | undefined;
    const language = $(this).data("language") as Language;
    if (
      mode !== undefined &&
      (state.type === "allTime" || state.type === "daily")
    ) {
      if (state.mode2 === mode) return;
      state.mode2 = mode;
      state.page = 0;
    } else if (language !== undefined && state.type === "daily") {
      if (state.language === language) return;
      state.language = language;
      state.page = 0;
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
  id: "leaderboards",
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
    void requestData(false);
  },
  afterShow: async (): Promise<void> => {
    updateSecondaryButtons();
  },
});

$(async () => {
  Skeleton.save("pageLeaderboards");
});

ConfigEvent.subscribe((eventKey) => {
  if (ActivePage.get() === "leaderboards" && eventKey === "typingSpeedUnit") {
    updateContent();
    fillUser();
    fillAvatars();
  }
});
