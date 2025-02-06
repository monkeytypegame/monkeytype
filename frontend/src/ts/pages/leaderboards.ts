import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { LeaderboardEntry } from "@monkeytype/contracts/schemas/leaderboards";
import { capitalizeFirstLetter } from "../utils/strings";
import Ape from "../ape";
import { Mode } from "@monkeytype/contracts/schemas/shared";
import * as Notifications from "../elements/notifications";

type State = {
  loading: boolean;
  updating: boolean;
  mode: "allTime" | "weekly" | "daily";
  allTimeMode: "15" | "60";
  dailyLanguage: string;
  data: LeaderboardEntry[] | null;
  userData: LeaderboardEntry | null;
  page: number;
  title: string;
  error?: string;
};

const state: State = {
  loading: true,
  updating: false,
  mode: "allTime",
  allTimeMode: "15",
  dailyLanguage: "english",
  data: null,
  userData: null,
  page: 1,
  title: "All-time English Time 15 Leaderboard",
};

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

async function requestData(): Promise<void> {
  state.loading = true;
  state.error = undefined;
  updateContent();

  if (state.mode === "allTime") {
    const baseQuery = {
      language: state.dailyLanguage,
      mode: "time" as Mode,
    };

    const data = await Ape.leaderboards.get({
      query: { ...baseQuery, mode2: state.allTimeMode },
    });
    state.loading = false;

    if (data.status === 200) {
      state.data = data.body.data;
    }

    updateContent();
    return;
  }

  state.loading = false;
  state.error = "Unsupported mode";
  updateContent();
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
      <td>${entry.wpm}</td>
      <td>${entry.acc}%</td>
      <td>${entry.raw}</td>
      <td>${entry.consistency}%</td>
      <td class="small">${entry.timestamp}</td>
    </tr>
  `;
}

function fillTable(): void {
  if (state.data === null) return;

  const table = $(".page.pageLeaderboards table tbody");
  table.empty();

  for (const entry of state.data) {
    table.append(buildTableRow(entry));
  }

  $(".page.pageLeaderboards table").removeClass("hidden");
  $(".page.pageLeaderboards .titleAndButtons").removeClass("hidden");
}

function updateContent(): void {
  $(".page.pageLeaderboards .bigUser").addClass("hidden");
  $(".page.pageLeaderboards .titleAndButtons").addClass("hidden");
  $(".page.pageLeaderboards table").addClass("hidden");
  $(".page.pageLeaderboards .loading").addClass("hidden");
  $(".page.pageLeaderboards .error").addClass("hidden");

  if (state.loading) {
    disableButtons();
    $(".page.pageLeaderboards .loading").removeClass("hidden");
    return;
  } else {
    enableButtons();
  }

  if (state.error !== undefined) {
    $(".page.pageLeaderboards .error").removeClass("hidden");
    $(".page.pageLeaderboards .error p").text(state.error);
    return;
  }

  if (state.data === null) {
    Notifications.add("Data is null");
    return;
  }

  fillTable();
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
  const el = $(".page.pageLeaderboards .buttonGroup.allTimeModeButtons");
  el.find("button").removeClass("active");
  el.find(`button[data-allTimeMode=${state.allTimeMode}]`).addClass("active");
}

function updateDailyLanguageButtons(): void {
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

$(".page.pageLeaderboards .buttonGroup.modeButtons").on(
  "click",
  "button",
  function () {
    const mode = $(this).data("mode") as "allTime" | "weekly" | "daily";
    if (state.mode === mode) return;
    state.mode = mode;
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
    if (allTimeMode !== undefined) {
      if (state.allTimeMode === allTimeMode) return;
      state.allTimeMode = allTimeMode;
    } else if (language !== undefined) {
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

Skeleton.save("pageLeaderboards");
