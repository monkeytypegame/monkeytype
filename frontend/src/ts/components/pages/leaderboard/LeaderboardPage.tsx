import { useQuery } from "@tanstack/solid-query";
import { createEffect, createSignal, JSXElement, Show } from "solid-js";

import { getSnapshot, updateLbMemory } from "../../../db";
import { createEffectOn } from "../../../hooks/effects";
import { PageName } from "../../../pages/page";
import { queryClient } from "../../../queries";
import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
} from "../../../queries/leaderboards";
import { getServerConfigurationQueryOptions } from "../../../queries/server-configuration";
import { getActivePage, isAuthenticated } from "../../../states/core";
import {
  getGoToUserPage,
  getPage,
  getSelection,
  pageSize,
  Selection,
  setGoToUserPage,
  setPage,
  setSelection,
  updateGetParameters,
} from "../../../states/leaderboard-selection";
import { cn } from "../../../utils/cn";
import AsyncContent from "../../common/AsyncContent";
import { LoadingCircle } from "../../common/LoadingCircle";
import { Separator } from "../../common/Separator";
import { Navigation } from "./Navigation";
import { NextUpdate } from "./NextUpdate";
import { Sidebar } from "./Sidebar";
import { Table } from "./Table";
import { Title } from "./Title";
import { UserRank } from "./UserRank";

const pageName: PageName = "leaderboards";

export function LeaderboardPage(): JSXElement {
  const isOpen = () => getActivePage() === pageName;

  const [scrollToUser, setScrollToUser] = createSignal(false);

  //invalidate cache for daily and weekly lb on close
  createEffectOn(isOpen, (open) => {
    if (!open) {
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.length >= 3 &&
          query.queryKey[1] === "leaderboard" &&
          ["weekly", "daily"].includes(query.queryKey[2] as string),
      });
    }
  });

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
    if (isOpen() && dataQuery.isSuccess) {
      updateGetParameters(getSelection(), getPage());
    }
  });

  //update lb memory after the rank is loaded
  createEffect(() => {
    if (isOpen() && rankQuery.isSuccess) {
      syncLbMemory();
    }
  });

  //handle goToUserPage url param once rank is loaded
  createEffect(() => {
    if (isOpen() && getGoToUserPage() && rankQuery.isSuccess) {
      setGoToUserPage(false);
      const page = userPage();
      if (page !== undefined) {
        setPage(page);
        setScrollToUser(true);
      }
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
    enabled: isAuthenticated() && isOpen(),
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
    const page = Math.ceil(userRank / pageSize) - 1;
    return page;
  };

  const syncLbMemory = () => {
    if (
      rankQuery.data !== undefined &&
      rankQuery.data !== null &&
      getSelection() !== undefined &&
      getSelection().type === "allTime"
    ) {
      const diff = getLbMemoryDifference(getSelection(), rankQuery.data.rank);

      if (diff !== 0) {
        void updateLbMemory(
          "time",
          getSelection().mode2,
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
    <Show when={isOpen()}>
      <div class="content-grid flex flex-col gap-8 lg:flex-row">
        <div class="w-full shrink-0 lg:w-60 2xl:w-75">
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

          <Show
            when={isAuthenticated() && !dataQuery.isLoading}
            fallback={<Separator />}
          >
            <AsyncContent
              queries={{
                data: dataQuery,
                rank: rankQuery,
                config: serverConfigurationQuery,
              }}
              alwaysShowContent
              errorClass="rounded bg-sub-alt p-4"
            >
              {({ data, rank, config }) => (
                <UserRank
                  type={getSelection().type === "weekly" ? "xp" : "speed"}
                  data={rank}
                  friendsOnly={getSelection().friendsOnly}
                  total={data?.count}
                  minWpm={
                    data && "minWpm" in data
                      ? (data.minWpm as number)
                      : undefined
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
              <div class="flex justify-center pt-4 text-4xl">
                <LoadingCircle />
              </div>
            }
          >
            {(data) => (
              <div>
                <div
                  class={cn(
                    "mb-2 grid grid-cols-1 items-center justify-between gap-2 text-sm sm:grid-cols-2 sm:text-base",
                  )}
                >
                  <NextUpdate type={getSelection().type} />
                  <Navigation
                    isLoading={
                      dataQuery.isLoading ||
                      dataQuery.isFetching ||
                      dataQuery.isRefetching
                    }
                    lastPage={Math.ceil((data?.count ?? 0) / pageSize)}
                    userPage={userPage()}
                    currentPage={getPage()}
                    onPageChange={setPage}
                    onScrollToUser={setScrollToUser}
                    class="w-full sm:w-max"
                  />
                </div>

                <div>
                  <Table
                    type={getSelection().type === "weekly" ? "xp" : "speed"}
                    entries={data?.entries ?? []}
                    friendsOnly={getSelection().friendsOnly}
                    scrollToUser={scrollToUser}
                    onScrolledToUser={() => setScrollToUser(false)}
                  />
                </div>

                <div class="mt-4 grid grid-cols-1 items-center justify-between text-sm sm:text-base">
                  <Navigation
                    lastPage={Math.ceil((data?.count ?? 0) / pageSize)}
                    currentPage={getPage()}
                    onPageChange={setPage}
                    onScrollToUser={setScrollToUser}
                    class="w-full sm:w-max"
                  />
                </div>
              </div>
            )}
          </AsyncContent>
        </div>
      </div>
    </Show>
  );
}
