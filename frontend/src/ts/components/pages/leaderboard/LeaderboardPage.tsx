import { useQuery } from "@tanstack/solid-query";
import { createEffect, createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { getSnapshot, updateLbMemory } from "../../../db";
import { queryClient } from "../../../queries";
import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
  Selection,
} from "../../../queries/leaderboards";
import { getActivePage, isLoggedIn } from "../../../signals/core";
import { qsr } from "../../../utils/dom";
import AsyncContent from "../../common/AsyncContent";

import { Sidebar } from "./Sidebar";
import { Table } from "./Table";
import { TableNavigation } from "./TableNavigation";
import { Title } from "./Title";
import { UserRank } from "./UserRank";

//TODO update page name
qsr("nav .view-about").on("mouseenter", () => {
  prefetch();
});

export function LeaderboardPage(): JSXElement {
  //TODO update page
  const isOpen = (): boolean => getActivePage() === "about";
  const [selection, setSelection] = createStore<Selection>({
    type: "allTime",
    mode: "time",
    mode2: "15",
    language: "english",
    friendsOnly: false,
    previous: false,
  });

  const [page, setPage] = createSignal(0);
  const [scrollToUser, setScrollToUser] = createSignal(false);

  createEffect(() => {
    //TODO fetch previous page as well, check boundaries
    if (isOpen()) {
      void queryClient.prefetchQuery(
        getLeaderboardQueryOptions({
          ...selection,
          page: page() + 1,
        }),
      );
    }
  });

  const query = useQuery(() => ({
    ...getLeaderboardQueryOptions({
      ...selection,
      page: page() ?? 0,
    }),
    enabled: isOpen(),
  }));

  const rank = useQuery(() => ({
    ...getRankQueryOptions(selection),
    enabled: isLoggedIn() && isOpen(),
  }));

  const onSelectionChange = (newSelection: Selection): void => {
    //TODO: find a better place to update
    if (
      rank.data !== undefined &&
      rank.data !== null &&
      selection !== undefined &&
      selection.type === "allTime"
    ) {
      const diff = getLbMemoryDifference(selection, rank.data.rank);

      if (diff !== 0) {
        void updateLbMemory(
          "time",
          selection.mode2,
          "english",
          rank.data.rank,
          true,
        );
      }
    }
    setSelection(newSelection);
    setPage(0);
  };

  const userPage = (): number | undefined => {
    const userRank = rank.data?.friendsRank ?? rank.data?.rank;
    if (userRank === undefined) return undefined;
    const page = Math.ceil(userRank / 50) - 1;
    return page;
  };

  return (
    <div class="content-grid grid">
      <div class="flex flex-col gap-8 lg:flex-row">
        <div class="w-full lg:w-60">
          <Sidebar onSelect={onSelectionChange} />
        </div>

        <div class="flex w-full flex-1 flex-col gap-4">
          <Title
            selection={selection}
            onPreviousSelect={() => setSelection("previous", (old) => !old)}
          />

          <Show when={isLoggedIn()}>
            <AsyncContent query={rank} alwaysShowContent>
              {(data) => (
                <UserRank
                  type={selection.type === "weekly" ? "xp" : "wpm"}
                  data={data}
                  friendsOnly={selection.friendsOnly}
                  total={query.data?.count}
                  minWpm={
                    query.data && "minWpm" in query.data
                      ? (query.data.minWpm as number)
                      : undefined
                  }
                  memoryDifference={getLbMemoryDifference(
                    selection,
                    data?.rank,
                  )}
                />
              )}
            </AsyncContent>
          </Show>

          <TableNavigation
            type={selection.type}
            lastPage={Math.ceil((query.data?.count ?? 0) / 50)}
            currentPage={page()}
            onPageChange={setPage}
            userPage={userPage()}
            onScrollToUser={setScrollToUser}
            isLoading={
              query.isLoading || query.isFetching || query.isRefetching
            }
          >
            <AsyncContent query={query} alwaysShowContent>
              {(data) => (
                <Table
                  type={selection.type === "weekly" ? "xp" : "wpm"}
                  entries={data?.entries ?? []}
                  friendsOnly={selection.friendsOnly}
                  scrollToUser={scrollToUser}
                  onScrolledToUser={() => setScrollToUser(false)}
                />
              )}
            </AsyncContent>
          </TableNavigation>
        </div>
      </div>
    </div>
  );
}

function getLbMemoryDifference(
  selection: Selection,
  currentRank: number | undefined,
): number | undefined {
  if (
    selection.type !== "allTime" ||
    selection.mode !== "time" ||
    selection.language !== "english" ||
    selection.friendsOnly ||
    currentRank === undefined
  ) {
    return undefined;
  }
  const oldRank =
    getSnapshot()?.lbMemory?.time?.[selection.mode2]?.english ?? 0;
  const diff = oldRank - currentRank;

  return diff;
}

function prefetch(): void {
  void queryClient.prefetchQuery(
    getLeaderboardQueryOptions({
      type: "allTime",
      mode: "time",
      mode2: "15",
      language: "english",
      friendsOnly: false,
      page: 0,
      previous: false,
    }),
  );
}
