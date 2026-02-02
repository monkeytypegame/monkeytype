import {
  LeaderboardEntry,
  XpLeaderboardEntry,
} from "@monkeytype/schemas/leaderboards";
import { useQuery } from "@tanstack/solid-query";
import { createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import Ape from "../../../ape";
import { createEffectOn } from "../../../hooks/effects";
import { getConfig } from "../../../signals/config";
import { getActivePage } from "../../../signals/core";
import { Button } from "../../common/Button";

import { LeaderboardTable } from "./LeaderboardTable";
import { LeaderboardType, Selection, Sidebar } from "./Sidebar";

export function LeaderboardPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "leaderboards";
  const [selection, setSelection] = createStore<Selection>({
    type: "allTime",
    mode: "time",
    mode2: "15",
    friendsOnly: false,
  });

  const [page, setPage] = createSignal(0);
  const onSelectionChange = (selection: Selection): void => {
    setSelection(selection);
    setPage(0);
  };

  createEffectOn(
    () => getConfig.typingSpeedUnit,
    (unit) => {
      console.log("#### change typing speed to ", unit);
      //TODO better way to refresh table
    },
  );

  const query = useQuery(() => ({
    queryKey: [
      selection.friendsOnly ? "user" : "public",
      "leaderboard",
      selection.type,
      {
        mode: selection.mode,
        mode2: selection.mode2,
        language: selection.language,
        friendsOnly: selection.friendsOnly,
        previous: false, //TODO
      },
      { page: page() ?? 0 },
    ],
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
        return fetchWeeklyLeaderboard(mode.previous ?? false, mode.friendsOnly);
      }

      if (mode.language === undefined) {
        throw new Error("language missing in query");
      }

      return fetchLeaderboard(type, mode, page.page);
    },
    //5 minutes for alltime, 10 seconds for others
    staleTime: selection.type === "allTime" ? 1000 * 60 * 60 : 1000 * 60,
    placeholderData: (old) => {
      if (old === undefined || old.length === 0 || old[0] === undefined) {
        return undefined;
      }
      const last = old[0];
      if (
        (selection.type === "weekly" && !("totalXp" in last)) ||
        (selection.type !== "weekly" && !("wpm" in last))
      ) {
        return [];
      }

      return old;
    },
  }));

  return (
    <Show when={isOpen}>
      <div class="content-grid grid">
        <div class="flex flex-col gap-8 lg:flex-row">
          <div class="w-full lg:w-60">
            <Sidebar onSelect={onSelectionChange} />
          </div>

          <div class="w-full flex-1">
            <Button
              onClick={() => setPage((old) => old - 1)}
              fa={{ icon: "fa-chevron-left" }}
            />
            <Button
              onClick={() => setPage((old) => old + 1)}
              fa={{ icon: "fa-chevron-right" }}
            />

            <Show when={query.isLoading}>loading....</Show>
            <Show when={query.isRefetching}>loading updating...</Show>

            <LeaderboardTable
              type={selection.type === "weekly" ? "xp" : "wpm"}
              query={query}
              friendsOnly={selection.friendsOnly}
            />
          </div>
        </div>
      </div>
    </Show>
  );
}

async function fetchWeeklyLeaderboard(
  friendsOnly: boolean,
  previousWeek: boolean,
): Promise<XpLeaderboardEntry[]> {
  const response = await Ape.leaderboards.getWeeklyXp({
    query: { friendsOnly, weeksBefore: previousWeek ? 1 : undefined },
  });

  if (response.status !== 200) {
    throw new Error(
      "Error fetching weekly leaderboard: " + response.body.message,
    );
  }

  return response.body.data.entries;
}
async function fetchLeaderboard(
  type: "allTime" | "daily",
  selection: Required<Omit<Selection, "type"> & { previous: boolean }>,
  page: number,
): Promise<LeaderboardEntry[]> {
  const query = {
    friendsOnly: selection.friendsOnly,
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

  return response.body.data.entries;
}
