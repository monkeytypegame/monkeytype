import { useQuery } from "@tanstack/solid-query";
import { createEffect, createSignal, JSXElement, Show } from "solid-js";

import { getSnapshot, updateLbMemory } from "../../../db";
import { updateGetParameters } from "../../../pages/leaderboard";
import { PageName } from "../../../pages/page";
import { queryClient } from "../../../queries";
import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
  Selection,
} from "../../../queries/leaderboards";
import { getServerConfigurationQueryOptions } from "../../../queries/server-configuration";
import { getActivePage, isLoggedIn } from "../../../signals/core";
import {
  getPage,
  getSelection,
  setPage,
  setSelection,
} from "../../../stores/leaderboard-selection";
import { qsr } from "../../../utils/dom";
import AsyncContent from "../../common/AsyncContent";
import { LoadingCircle } from "../../common/LoadingCircle";
import { Navigation } from "./Navigation";
import { NextUpdate } from "./NextUpdate";
import { Sidebar } from "./Sidebar";
import { Table } from "./Table";
import { Title } from "./Title";
import { UserRank } from "./UserRank";

const pageName: PageName = "leaderboards";

qsr(`nav .view-${pageName}`).on("mouseenter", () => {
  prefetch();
});

//used for url params so we need this global

export function LeaderboardPage(): JSXElement {
  const isOpen = () => getActivePage() === pageName;

  const [scrollToUser, setScrollToUser] = createSignal(false);

  //prefetch next page
  createEffect(() => {
    if (isOpen()) {
      void queryClient.prefetchQuery(
        getLeaderboardQueryOptions({
          ...getSelection(),
          page: getPage() + 1,
        }),
      );
    }
  });

  //update url after the data is loaded
  createEffect(() => {
    if (dataQuery.isSuccess) updateGetParameters(getSelection(), getPage());
  });

  //update lb memory after the rank is loaded
  createEffect(() => {
    if (rankQuery.isSuccess) syncLbMemory();
  });

  //if connections are disabled, friendsOnly cannot be true
  createEffect(() => {
    const connectionsEnabled =
      serverConfigurationQuery.data?.connections.enabled;
    if (connectionsEnabled === false && getSelection().friendsOnly) {
      setSelection((old) => ({ ...old, friendsOnly: false }));
    }
  });

  const dataQuery = useQuery(() => ({
    ...getLeaderboardQueryOptions({
      ...getSelection(),
      page: getPage() ?? 0,
    }),
    enabled: isOpen(),
  }));

  const rankQuery = useQuery(() => ({
    ...getRankQueryOptions(getSelection()),
    enabled: isLoggedIn() && isOpen(),
  }));

  const serverConfigurationQuery = useQuery(() => ({
    ...getServerConfigurationQueryOptions(),
    enabled: isOpen(),
  }));

  const onSelectionChange = (newSelection: Selection) => {
    setSelection(newSelection);
    setPage(0);
  };

  /**
   * the page that contains the user
   */
  const userPage = () => {
    const userRank = getSelection().friendsOnly
      ? rankQuery.data?.friendsRank
      : rankQuery.data?.rank;
    if (userRank === undefined) return undefined;
    const page = Math.ceil(userRank / (dataQuery.data?.pageSize ?? 50)) - 1;
    return page;
  };

  const syncLbMemory = () => {
    if (
      rankQuery.data !== undefined &&
      rankQuery.data !== null &&
      getSelection !== undefined &&
      getSelection().type === "allTime"
    ) {
      const diff = getLbMemoryDifference(getSelection(), rankQuery.data.rank);

      if (diff !== 0) {
        void updateLbMemory(
          "time",
          getSelection().mode2 as string,
          "english",
          rankQuery.data.rank,
          true,
        );
      }
    }
  };

  const getLbMemoryDifference = (
    selection: Selection,
    currentRank: number | undefined,
  ): number | undefined => {
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
  };

  return (
    <div class="content-grid flex flex-col gap-8 lg:flex-row">
      <div class="w-full lg:w-60 2xl:w-75">
        <AsyncContent query={serverConfigurationQuery}>
          {(config) => (
            <Sidebar
              selection={getSelection}
              onSelect={onSelectionChange}
              validModeRules={config.dailyLeaderboards.validModeRules ?? []}
              connectionsEnabled={config.connections.enabled}
            />
          )}
        </AsyncContent>
      </div>

      <div class="flex w-full flex-1 flex-col gap-8">
        <Title
          selection={getSelection()}
          onPreviousSelect={() =>
            setSelection((old) => ({ ...old, previous: !old.previous }))
          }
        />

        <Show when={isLoggedIn() && !dataQuery.isLoading}>
          <AsyncContent
            queries={{
              data: dataQuery,
              rank: rankQuery,
              config: serverConfigurationQuery,
            }}
            alwaysShowContent
          >
            {({ data, rank, config }) => (
              <UserRank
                type={getSelection().type === "weekly" ? "xp" : "speed"}
                data={rank}
                friendsOnly={getSelection().friendsOnly}
                total={data?.count}
                minWpm={
                  data && "minWpm" in data ? (data.minWpm as number) : undefined
                }
                memoryDifference={getLbMemoryDifference(
                  getSelection(),
                  rank?.rank,
                )}
                isLbOptOut={getSnapshot()?.lbOptOut ?? false}
                isBanned={getSnapshot()?.banned ?? false}
                minTimeTyping={config?.leaderboards.minTimeTyping ?? 0}
                userTimeTyping={getSnapshot()?.typingStats.timeTyping ?? 0}
              />
            )}
          </AsyncContent>
        </Show>

        <AsyncContent
          query={dataQuery}
          loader={
            <>
              <div class="h-1 w-full rounded bg-sub-alt"></div>
              <div class="flex justify-center pt-4 text-4xl">
                <LoadingCircle />
              </div>
            </>
          }
        >
          {(data) => (
            <div class="grid gap-2">
              <div class="grid grid-cols-2 items-center justify-between text-sm sm:text-base">
                <NextUpdate type={getSelection().type} />
                <Navigation
                  isLoading={
                    dataQuery.isLoading ||
                    dataQuery.isFetching ||
                    dataQuery.isRefetching
                  }
                  lastPage={Math.ceil((data?.count ?? 0) / 50)}
                  userPage={userPage()}
                  currentPage={getPage()}
                  onPageChange={setPage}
                  onScrollToUser={setScrollToUser}
                />
              </div>
              <Table
                type={getSelection().type === "weekly" ? "xp" : "speed"}
                entries={data?.entries ?? []}
                friendsOnly={getSelection().friendsOnly}
                scrollToUser={scrollToUser}
                onScrolledToUser={() => setScrollToUser(false)}
              />
              <div class="grid grid-cols-1 items-center justify-between text-sm sm:text-base">
                <Navigation
                  lastPage={Math.ceil((data?.count ?? 0) / 50)}
                  currentPage={getPage()}
                  onPageChange={setPage}
                  onScrollToUser={setScrollToUser}
                />
              </div>
            </div>
          )}
        </AsyncContent>
      </div>
    </div>
  );
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
