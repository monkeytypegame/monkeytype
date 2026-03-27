import {
  GetLeaderboardQuery,
  GetLeaderboardRankQuery,
} from "@monkeytype/contracts/leaderboards";
import { queryOptions } from "@tanstack/solid-query";
import Ape from "../ape";
import { pageSize, Selection, setPage } from "../states/leaderboard-selection";

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
    queryFn: async () => {
      const baseQuery = {
        friendsOnly: options.friendsOnly ? true : undefined,
        pageSize,
        page: options.page,
      };

      let request;

      if (options.type === "weekly") {
        request = Ape.leaderboards.getWeeklyXp({
          query: {
            ...baseQuery,
            weeksBefore: options.previous ? 1 : undefined,
          },
        });
      } else {
        const modeQuery: GetLeaderboardQuery = {
          ...baseQuery,
          mode: options.mode,
          mode2: options.mode2,
          language: options.language,
        };

        if (options.type === "allTime") {
          request = Ape.leaderboards.get({ query: modeQuery });
        } else {
          request = Ape.leaderboards.getDaily({
            query: {
              ...modeQuery,
              daysBefore: options.previous ? 1 : undefined,
            },
          });
        }
      }

      const response = await request;
      if (response.status !== 200) {
        throw new Error(
          `Failed to get ${options.type} leaderboard data: ` +
            response.body.message,
        );
      }

      if (response.body.data.entries.length === 0 && options.page !== 0) {
        const page = Math.max(
          0,
          Math.ceil(response.body.data.count / pageSize) - 1,
        );
        if (page !== options.page) {
          setPage(page);
        }
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
    queryFn: async () => {
      let request;
      if (options.type === "weekly") {
        request = Ape.leaderboards.getWeeklyXpRank({
          query: {
            friendsOnly: options.friendsOnly ? true : undefined,
            weeksBefore: options.previous ? 1 : undefined,
          },
        });
      } else {
        const baseQuery: GetLeaderboardRankQuery = {
          mode: options.mode,
          mode2: options.mode2,
          language: options.language,
          friendsOnly: options.friendsOnly ? true : undefined,
        };
        if (options.type === "allTime") {
          request = Ape.leaderboards.getRank({ query: baseQuery });
        } else {
          request = Ape.leaderboards.getDailyRank({
            query: {
              ...baseQuery,
              daysBefore: options.previous ? 1 : undefined,
            },
          });
        }
      }

      const response = await request;
      if (response.status !== 200) {
        throw new Error(
          `Failed to get ${options.type} leaderboard rank: ` +
            response.body.message,
        );
      }
      return response.body.data;
    },
    //5 minutes for alltime, one minute for others
    staleTime: options.type === "allTime" ? 1000 * 60 * 5 : 1000 * 60,
  });
