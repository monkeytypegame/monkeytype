import {
  GetLeaderboardQuery,
  GetLeaderboardRankQuery,
} from "@monkeytype/contracts/leaderboards";
import { QueryKey, queryOptions } from "@tanstack/solid-query";
import Ape from "../ape";
import {
  LeaderboardType,
  pageSize,
  Selection,
  setPage,
} from "../stores/leaderboard-selection";

const queryKeys = {
  root: (options: Selection & { userSpecific?: true }) => [
    //don't use baseKey, we require the key to have the options at the same position for user and non user specific
    options.userSpecific === true || options.friendsOnly
      ? "user"
      : "leaderboard",
    "leaderboard",
    options.type,
    {
      mode: options.mode,
      mode2: options.mode2,
      language: options.language,
      friendsOnly: options.friendsOnly,
      previous: options.previous,
    },
  ],
  data: (options: Selection & { page: number }) => [
    ...queryKeys.root(options),
    { page: options.page },
  ],
  rank: (options: Selection) =>
    queryKeys.root({ ...options, userSpecific: true }), //rank is always user specific
};

export const getLeaderboardQueryOptions = (
  options: Selection & {
    page: number;
  }, // oxlint-disable-next-line typescript/explicit-function-return-type
) =>
  queryOptions({
    queryKey: queryKeys.data(options),
    queryFn: async (ctx) => {
      const page = ctx.queryKey[4] as { page: number } | undefined;
      if (page === undefined) throw new Error("page missing in query");

      const selection = getSelectionFromQueryKey(ctx.queryKey);

      const baseQuery = {
        friendsOnly: selection.friendsOnly ? true : undefined,
        pageSize,
        page: page.page,
      };

      let request;

      if (selection.type === "weekly") {
        request = Ape.leaderboards.getWeeklyXp({
          query: {
            ...baseQuery,
            weeksBefore: selection.previous ? 1 : undefined,
          },
        });
      } else {
        const modeQuery: GetLeaderboardQuery = {
          ...baseQuery,
          mode: selection.mode,
          mode2: selection.mode2,
          language: selection.language,
        };

        if (selection.type === "allTime") {
          request = Ape.leaderboards.get({ query: modeQuery });
        } else {
          request = Ape.leaderboards.getDaily({
            query: {
              ...modeQuery,
              daysBefore: selection.previous ? 1 : undefined,
            },
          });
        }
      }

      const response = await request;
      if (response.status !== 200) {
        throw new Error(
          `Failed to get ${selection.type} leaderboard data: ` +
            response.body.message,
        );
      }

      if (response.body.data.entries.length === 0 && page.page !== 0) {
        setPage(Math.floor(response.body.data.count / pageSize));
      }
      return response.body.data;
    },
    //5 minutes for alltime, one minute for others
    staleTime: options.type === "allTime" ? 1000 * 60 * 5 : 1000 * 60,
  });

// oxlint-disable-next-line typescript/explicit-function-return-type
export const getRankQueryOptions = (options: Selection) =>
  queryOptions({
    queryKey: queryKeys.rank(options),
    queryFn: async (ctx) => {
      let request;
      const selection = getSelectionFromQueryKey(ctx.queryKey);
      if (selection.type === "weekly") {
        request = Ape.leaderboards.getWeeklyXpRank({
          query: {
            friendsOnly: selection.friendsOnly ? true : undefined,
            weeksBefore: selection.previous ? 1 : undefined,
          },
        });
      } else {
        const baseQuery: GetLeaderboardRankQuery = {
          mode: selection.mode,
          mode2: selection.mode2,
          language: selection.language,
          friendsOnly: selection.friendsOnly ? true : undefined,
        };
        if (selection.type === "allTime") {
          request = Ape.leaderboards.getRank({ query: baseQuery });
        } else {
          request = Ape.leaderboards.getDailyRank({
            query: {
              ...baseQuery,
              daysBefore: selection.previous ? 1 : undefined,
            },
          });
        }
      }

      const response = await request;
      if (response.status !== 200) {
        throw new Error(
          `Failed to get ${selection.type} leaderboard rank: ` +
            response.body.message,
        );
      }
      return response.body.data;
    },
    //5 minutes for alltime, one minute for others
    staleTime: options.type === "allTime" ? 1000 * 60 * 5 : 1000 * 60,
  });

function getSelectionFromQueryKey(queryKey: QueryKey): Selection {
  if (queryKey.length < 3) throw new Error("invalid query key");

  const type = queryKey[2] as LeaderboardType | undefined;
  const mode = queryKey[3] as
    | Required<Omit<Selection, "type"> & { previous: boolean }>
    | undefined;

  if (type === undefined) throw new Error("type missing in query");
  if (mode === undefined) throw new Error("mode missing in query");

  if (type === "weekly") {
    return {
      type: "weekly",
      friendsOnly: mode.friendsOnly,
      previous: mode.previous,
    };
  } else {
    if (mode.language === undefined) {
      throw new Error("language missing in query");
    }
    return {
      type,
      mode: mode.mode,
      mode2: mode.mode2,
      language: mode.language,
      friendsOnly: mode.friendsOnly,
      previous: mode.previous,
    };
  }
}
