import {
  GetLeaderboardResponse,
  GetWeeklyXpLeaderboardResponse,
} from "@monkeytype/contracts/leaderboards";
import { Language } from "@monkeytype/schemas/languages";
import { Mode } from "@monkeytype/schemas/shared";
import { queryOptions } from "@tanstack/solid-query";
import Ape from "../ape";

const queryKeys = {
  leaderboardData: (options: Selection & { page: number }) => [
    options.friendsOnly ? "user" : "leaderboard",
    "leaderboard",
    options.type,
    {
      mode: options.mode,
      mode2: options.mode2,
      language: options.language,
      friendsOnly: options.friendsOnly,
      previous: options.previous,
    },
    { page: options.page },
  ],
};
export type LeaderboardType = Selection["type"];
export type Selection =
  | {
      type: "weekly";
      friendsOnly: boolean;
      previous: boolean;
      language?: never;
      mode?: never;
      mode2?: never;
    }
  | {
      type: "daily" | "allTime";
      mode: Mode;
      mode2: string;
      language: Language;
      friendsOnly: boolean;
      previous: boolean;
    };

export const getLeaderboardQueryOptions = (
  options: Selection & {
    page: number;
  }, // oxlint-disable-next-line typescript/explicit-function-return-type
) =>
  queryOptions({
    queryKey: queryKeys.leaderboardData(options),
    queryFn: async (ctx) => {
      const type = ctx.queryKey[2] as LeaderboardType | undefined;
      const mode = ctx.queryKey[3] as
        | Required<Omit<Selection, "type"> & { previous: boolean }>
        | undefined;
      const page = ctx.queryKey[4] as { page: number } | undefined;
      if (type === undefined) throw new Error("type missing in query");
      if (mode === undefined) throw new Error("mode missing in query");
      if (page === undefined) throw new Error("page missing in query");

      if (type === "weekly") {
        return await fetchWeeklyLeaderboard(
          mode.friendsOnly ?? false,
          mode.previous ?? false,
          page.page,
        );
      }

      if (mode.language === undefined) {
        throw new Error("language missing in query");
      }

      return await fetchLeaderboard(type, mode, page.page);
    },
    //5 minutes for alltime, 10 seconds for others
    staleTime: options.type === "allTime" ? 1000 * 60 * 60 : 1000 * 60,
    placeholderData: (old) => {
      if (
        old === undefined ||
        old["entries"] === undefined ||
        old["entries"].length === 0 ||
        old["entries"][0] === undefined
      ) {
        return undefined;
      }
      const last = old["entries"][0];
      if (
        (options.type === "weekly" && !("totalXp" in last)) ||
        (options.type !== "weekly" && !("wpm" in last))
      ) {
        return undefined;
      }

      return old;
    },
  });

async function fetchWeeklyLeaderboard(
  friendsOnly: boolean,
  previousWeek: boolean,
  page: number,
): Promise<GetWeeklyXpLeaderboardResponse["data"]> {
  const response = await Ape.leaderboards.getWeeklyXp({
    query: {
      friendsOnly,
      weeksBefore: previousWeek ? 1 : undefined,
      page,
      pageSize: 50,
    },
  });

  if (response.status !== 200) {
    throw new Error(
      "Error fetching weekly leaderboard: " + response.body.message,
    );
  }

  return response.body.data;
}
async function fetchLeaderboard(
  type: "allTime" | "daily",
  selection: Required<Omit<Selection, "type"> & { previous: boolean }>,
  page: number,
): Promise<GetLeaderboardResponse["data"]> {
  const query = {
    friendsOnly: selection.friendsOnly ? true : undefined,
    language: selection.language,
    mode: selection.mode,
    mode2: selection.mode2,
    pageSize: 50,
    page,
  };
  const response = await (type === "allTime"
    ? Ape.leaderboards.get({ query })
    : Ape.leaderboards.getDaily({
        query: { ...query, daysBefore: selection.previous ? 1 : undefined },
      }));

  if (response.status !== 200) {
    throw new Error(
      `Failed to get ${type} leaderboard: ` + response.body.message,
    );
  }

  return response.body.data;
}
