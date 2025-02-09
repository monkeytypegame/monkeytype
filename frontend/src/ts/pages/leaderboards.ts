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
import { isAuthenticated } from "../firebase";
import * as DB from "../db";
import { format } from "date-fns";

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
    state.userData = null;
  }
  updateContent();

  if (state.mode === "allTime") {
    const baseQuery = {
      language: "english",
      mode: "time" as Mode,
    };

    const data = await Ape.leaderboards.get({
      query: { ...baseQuery, mode2: state.allTimeMode, page: state.page },
    });

    if (data.status === 200) {
      state.data = data.body.data.entries;
      state.count = data.body.data.count;
      state.pageSize = data.body.data.pageSize;
    }

    if (isAuthenticated() && state.userData === null) {
      Notifications.add("Getting user data");
      const userData = await Ape.leaderboards.getRank({
        query: { ...baseQuery, mode2: state.allTimeMode },
      });

      if (userData.status === 200 && userData.body.data.entry !== undefined) {
        state.userData = userData.body.data.entry;
      }
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

  if (state.page === totalPages - 1) {
    el.find("button[data-action='nextPage']").addClass("disabled");
  } else {
    el.find("button[data-action='nextPage']").removeClass("disabled");
  }
}

function buildTableRow(entry: LeaderboardEntry): string {
  return `
    <tr>
      <td>${entry.rank}</td>
      <td>
        <div class="avatarNameBadge">
          <div class="lbav">
            <div class="avatarPlaceholder">
              <i class="fas fa-user-circle"></i>
            </div>
          </div>
          <div class="name">${entry.name}</div>
        </div>
      </td>
      <td>${Format.typingSpeed(entry.wpm, {
        showDecimalPlaces: true,
      })}</td>
      <td>${Format.percentage(entry.acc, {
        showDecimalPlaces: true,
      })}</td>
      <td>${Format.typingSpeed(entry.raw, {
        showDecimalPlaces: true,
      })}</td>
      <td>${Format.percentage(entry.consistency, {
        showDecimalPlaces: true,
      })}</td>
      <td class="small">${format(entry.timestamp, "dd MMM yyyy HH:mm")}</td>
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
      table.append(buildTableRow(entry));
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
  const percentile = ((state.count - userData.rank) / state.count) * 100;

  $(".page.pageLeaderboards .bigUser .rank").text(userData.rank);
  $(".page.pageLeaderboards .bigUser .userInfo .top").text(
    `${userData.name} (Top ${percentile.toFixed(2)}%)`
  );

  const diff = getLbMemoryDifference();

  if (diff === null) {
    $(".page.pageLeaderboards .bigUser .userInfo .bottom").text("");
  } else if (diff === 0) {
    $(".page.pageLeaderboards .bigUser .userInfo .bottom").text(
      ` ( = since you last checked)`
    );
  } else if (diff > 0) {
    $(".page.pageLeaderboards .bigUser .userInfo .bottom").html(
      ` (<i class="fas fa-fw fa-angle-up"></i>${Math.abs(
        diff
      )} since you last checked)`
    );
  } else {
    $(".page.pageLeaderboards .bigUser .userInfo .bottom").html(
      ` (<i class="fas fa-fw fa-angle-down"></i>${Math.abs(
        diff
      )} since you last checked
        )`
    );
  }

  $(".page.pageLeaderboards .bigUser .stat.wpm .value").text(
    Format.typingSpeed(userData.wpm, { showDecimalPlaces: true })
  );
  $(".page.pageLeaderboards .bigUser .stat.acc .value").text(
    Format.percentage(userData.acc, { showDecimalPlaces: true })
  );
  $(".page.pageLeaderboards .bigUser .stat.raw .value").text(
    Format.typingSpeed(userData.raw, { showDecimalPlaces: true })
  );
  $(".page.pageLeaderboards .bigUser .stat.con .value").text(
    Format.percentage(userData.consistency, { showDecimalPlaces: true })
  );
  $(".page.pageLeaderboards .bigUser .stat.timestamp .value").text(
    format(userData.timestamp, "dd MMM yyyy HH:mm")
  );

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
  } else {
    return;
  }
  void requestData(true);
  updateContent();
}

$(".page.pageLeaderboards .jumpButtons button").on("click", function () {
  const action = $(this).data("action") as string;
  if (action !== "goToPage" && action !== "userPage") {
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
    }
    state.data = null;
    void requestData();
    updateModeButtons();
    updateTitle();
    updateSecondaryButtons();
    updateContent();
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
  }
);

export const page = new Page({
  name: "leaderboards",
  element: $(".page.pageLeaderboards"),
  path: "/leaderboards",
  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLeaderboards");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLeaderboards", "main");
    updateModeButtons();
    updateTitle();
    updateSecondaryButtons();
    updateContent();
    void requestData();
  },
});

$(async () => {
  Skeleton.save("pageLeaderboards");
});
