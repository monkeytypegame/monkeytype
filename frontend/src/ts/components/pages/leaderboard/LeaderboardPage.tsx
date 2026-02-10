import { LanguageSchema } from "@monkeytype/schemas/languages";
import { ModeSchema } from "@monkeytype/schemas/shared";
import { useQuery } from "@tanstack/solid-query";
import {
  Accessor,
  createEffect,
  createSignal,
  JSXElement,
  Setter,
  Show,
} from "solid-js";
import { z } from "zod";

import { getSnapshot, updateLbMemory } from "../../../db";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { PageWithUrlParams } from "../../../pages/page";
import { queryClient } from "../../../queries";
import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
  Selection,
  SelectionSchema,
} from "../../../queries/leaderboards";
import { getServerConfigurationQueryOptions } from "../../../queries/server-configuration";
import {
  getActivePage,
  getCurrentPage,
  isLoggedIn,
} from "../../../signals/core";
import { qsr } from "../../../utils/dom";
import AsyncContent from "../../common/AsyncContent";

import { Sidebar } from "./Sidebar";
import { Table } from "./Table";
import { TableNavigation } from "./TableNavigation";
import { Title } from "./Title";
import { UserRank } from "./UserRank";

//TODO change
export const pageName = "about";

export const LeaderboardUrlParamsSchema = z
  .object({
    type: z.enum(["allTime", "daily", "weekly"]),
    mode: ModeSchema.optional(),
    mode2: z.string().optional(),
    language: LanguageSchema.optional(),
    yesterday: z.boolean().optional(),
    lastWeek: z.boolean().optional(),
    friendsOnly: z.boolean().optional(),
    page: z.number().optional(),
    goToUserPage: z.boolean().optional(),
  })
  .partial();
type LeaderboardUrlParams = z.infer<typeof LeaderboardUrlParamsSchema>;

qsr(`nav .view-${pageName}`).on("mouseenter", () => {
  prefetch();
});

const [selection, setSelection] = lsSelection();
const [page, setPage] = createSignal(0);

export function LeaderboardPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === pageName;

  const [scrollToUser, setScrollToUser] = createSignal(false);

  createEffect(() => {
    //TODO fetch previous page as well, check boundaries
    if (isOpen()) {
      void queryClient.prefetchQuery(
        getLeaderboardQueryOptions({
          ...selection(),
          page: page() + 1,
        }),
      );
    }
  });

  createEffect(() => {
    //update url after the data is loaded
    if (dataQuery.isSuccess) updateGetParameters(selection(), page());
  });

  createEffect(() => {
    //update url after the data is loaded
    if (rankQuery.isSuccess) syncLbMemory();
  });

  const dataQuery = useQuery(() => ({
    ...getLeaderboardQueryOptions({
      ...selection(),
      page: page() ?? 0,
    }),
    enabled: isOpen(),
  }));

  const rankQuery = useQuery(() => ({
    ...getRankQueryOptions(selection()),
    enabled: isLoggedIn() && isOpen(),
  }));

  const serverConfigurationQuery = useQuery(() => ({
    ...getServerConfigurationQueryOptions(),
    enabled: isOpen(),
  }));

  const onSelectionChange = (newSelection: Selection): void => {
    setSelection(newSelection);
    setPage(0);
  };

  const userPage = (): number | undefined => {
    const userRank = rankQuery.data?.friendsRank ?? rankQuery.data?.rank;
    if (userRank === undefined) return undefined;
    const page = Math.ceil(userRank / 50) - 1;
    return page;
  };

  return (
    <div class="content-grid grid">
      <div class="flex flex-col gap-8 lg:flex-row">
        <div class="w-full lg:w-60">
          <AsyncContent query={serverConfigurationQuery}>
            {(config) => (
              <Sidebar
                selection={selection}
                onSelect={onSelectionChange}
                validModeRules={config.dailyLeaderboards.validModeRules ?? []}
              />
            )}
          </AsyncContent>
        </div>

        <div class="flex w-full flex-1 flex-col gap-4">
          <Title
            selection={selection()}
            onPreviousSelect={() =>
              setSelection((old) => ({
                ...old,
                previous: !old.previous,
              }))
            }
          />

          <Show when={isLoggedIn()}>
            <AsyncContent query={rankQuery} alwaysShowContent>
              {(data) => (
                <UserRank
                  type={selection().type === "weekly" ? "xp" : "wpm"}
                  data={data}
                  friendsOnly={selection().friendsOnly}
                  total={dataQuery.data?.count}
                  minWpm={
                    dataQuery.data && "minWpm" in dataQuery.data
                      ? (dataQuery.data.minWpm as number)
                      : undefined
                  }
                  memoryDifference={getLbMemoryDifference(
                    selection(),
                    data?.rank,
                  )}
                  isLbOptOut={getSnapshot()?.lbOptOut ?? false}
                  isBanned={getSnapshot()?.banned ?? false}
                  minTimeTyping={
                    serverConfigurationQuery.data?.leaderboards.minTimeTyping ??
                    0
                  }
                  userTimeTyping={getSnapshot()?.typingStats.timeTyping ?? 0}
                />
              )}
            </AsyncContent>
          </Show>

          <TableNavigation
            type={selection().type}
            lastPage={Math.ceil((dataQuery.data?.count ?? 0) / 50)}
            currentPage={page()}
            onPageChange={setPage}
            userPage={userPage()}
            onScrollToUser={setScrollToUser}
            isLoading={
              dataQuery.isLoading ||
              dataQuery.isFetching ||
              dataQuery.isRefetching
            }
          >
            <AsyncContent query={dataQuery} alwaysShowContent>
              {(data) => (
                <Table
                  type={selection().type === "weekly" ? "xp" : "wpm"}
                  entries={data?.entries ?? []}
                  friendsOnly={selection().friendsOnly}
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

  function syncLbMemory(): void {
    if (
      rankQuery.data !== undefined &&
      rankQuery.data !== null &&
      selection !== undefined &&
      selection().type === "allTime"
    ) {
      const diff = getLbMemoryDifference(selection(), rankQuery.data.rank);

      if (diff !== 0) {
        void updateLbMemory(
          "time",
          selection().mode2 as string,
          "english",
          rankQuery.data.rank,
          true,
        );
      }
    }
  }
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

function lsSelection(): [Accessor<Selection>, Setter<Selection>] {
  return useLocalStorage<Selection>({
    key: "leaderboardSelector",
    schema: SelectionSchema,
    fallback: {
      type: "allTime",
      mode: "time",
      mode2: "15",
      language: "english",
      friendsOnly: false,
      previous: false,
    },
    migrate: (value) => {
      if (value === null || typeof value !== "object") {
        return {} as Selection;
      }
      const result = value as Selection;
      if ("lastWeek" in result) {
        delete result["lastWeek"];
        result.previous = true;
      } else if ("yesterday" in result) {
        delete result["yesterday"];
        result.previous = true;
      }

      if (result.type === "weekly") {
        delete result.mode;
        delete result.mode2;
        delete result.language;
      }
      return result;
    },
  });
}

function updateGetParameters(selection: Selection, page: number): void {
  const params: LeaderboardUrlParams = {
    type: selection.type,
    mode: selection.mode,
    mode2: selection.mode2,
    language: selection.language,
    page: page + 1,
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
  // oxlint-disable-next-line typescript/no-explicit-any
  const currentPage = getCurrentPage() as PageWithUrlParams<unknown, any>;
  if (currentPage !== undefined && currentPage.id === pageName) {
    currentPage.setUrlParams(params);
  }
}

export function readGetParameters(
  params: LeaderboardUrlParams | undefined,
): void {
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

  setSelection({ ...selection(), ...newSelection } as Selection);

  if (params.page !== undefined) {
    setPage(params.page - 1);
  }
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
