import { createCollection, parseLoadSubsetOptions } from "@tanstack/db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "./client";
import Ape from "../ape";
import { GetLeaderboardQuery } from "@monkeytype/contracts/leaderboards";
import { LeaderboardEntry } from "@monkeytype/schemas/leaderboards";
const allTimeQueryKey = ["leaderboard", "all-time"];
export const allTimeLeaderboardCollection = createCollection(
  queryCollectionOptions<LeaderboardEntry>({
    syncMode: "on-demand",
    queryClient,
    queryKey: allTimeQueryKey,
    getKey: (item) => item.uid,
    staleTime: 1000 * 60 * 15, //15 minutes
    queryFn: async (ctx) => {
      const { filters, limit } = parseLoadSubsetOptions(
        ctx.meta?.loadSubsetOptions,
      );
      const lower =
        (filters.find((it) => it.field[0] === "rank" && it.operator === "gt")
          ?.value as number) ?? 0;
      const upper =
        (filters.find((it) => it.field[0] === "rank" && it.operator === "lte")
          .value as number) ?? -1;
      const pageSize = upper - lower;
      const page = upper / pageSize - 1;

      console.log("####", { lower, upper, page, pageSize });

      const query: GetLeaderboardQuery = {
        language: "english",
        mode: "time",
        mode2: "60",
        pageSize,
        page,
      };

      const response = await Ape.leaderboards.get({ query });

      if (response.status !== 200) {
        throw new Error(
          "Cannot fetch all-time leaderboard " + response.body.message,
        );
      }
      return response.body.data.entries;
    },
    meta: {},
  }),
);
