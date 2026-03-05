import {
  LeaderboardUrlParams,
  LeaderboardUrlParamsSchema,
  Selection,
  setPage,
  setSelection,
} from "../stores/leaderboard-selection";
import { PageWithUrlParams } from "./page";
import * as Skeleton from "../utils/skeleton";
import { onDOMReady, qsr } from "../utils/dom";
import { configurationPromise as serverConfigurationPromise } from "../ape/server-configuration";

export const page = new PageWithUrlParams({
  id: "leaderboards",
  element: qsr(".page.pageLeaderboards"),
  path: "/leaderboards",
  urlParamsSchema: LeaderboardUrlParamsSchema,
  loadingOptions: {
    style: "spinner",
    loadingMode: () => "sync",
    loadingPromise: async () => {
      await serverConfigurationPromise;
    },
  },

  afterHide: async (): Promise<void> => {
    Skeleton.remove("pageLeaderboards");
  },
  beforeShow: async (options): Promise<void> => {
    Skeleton.append("pageLeaderboards", "main");
    readGetParameters(options.urlParams);
  },
});

onDOMReady(async () => {
  Skeleton.add("pageLeaderboards");
});

function readGetParameters(params: LeaderboardUrlParams | undefined): void {
  if (params === undefined || params.type === undefined) return;

  let newSelection: Partial<Selection> = {
    type: params.type,
    friendsOnly: params.friendsOnly ?? false,
  };

  if (params.type === "weekly") {
    newSelection.previous = params.lastWeek ?? false;
  } else {
    newSelection.mode = params.mode ?? "time";
    newSelection.mode2 = params.mode2 ?? "15";
    newSelection.language = params.language ?? "english";
    newSelection.previous =
      (params.type === "daily" && params.yesterday) ?? false;
  }

  setSelection({ ...getSelection(), ...newSelection } as Selection);

  if (params.page !== undefined) {
    setPage(params.page - 1);
  }
}

export function updateGetParameters(
  selection: Selection,
  pageNumber: number,
): void {
  const params: LeaderboardUrlParams = {
    type: selection.type,
    mode: selection.mode,
    mode2: selection.mode2,
    language: selection.language,
    page: pageNumber + 1,
  };

  if (selection.type === "weekly" && selection.previous) {
    params.lastWeek = true;
  }
  if (selection.type === "daily" && selection.previous) {
    params.yesterday = true;
  }
  if (selection.friendsOnly) {
    params.friendsOnly = true;
  }
  page.setUrlParams(params);
}
