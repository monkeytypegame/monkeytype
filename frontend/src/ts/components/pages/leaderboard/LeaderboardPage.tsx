import { useQuery } from "@tanstack/solid-query";
import { createEffect, createSignal, JSXElement } from "solid-js";
import { createStore } from "solid-js/store";

import { queryClient } from "../../../queries";
import {
  getLeaderboardQueryOptions,
  Selection,
} from "../../../queries/leaderboards";
import { getActivePage } from "../../../signals/core";
import { qsr } from "../../../utils/dom";
import { addToGlobal } from "../../../utils/misc";
import AsyncContent from "../../common/AsyncContent";

import { Sidebar } from "./Sidebar";
import { Table } from "./Table";
import { TableNavigation } from "./TableNavigation";
import { Title } from "./Title";

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
  const onSelectionChange = (selection: Selection): void => {
    setSelection(selection);
    setPage(0);
  };

  addToGlobal({ selection });

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

          <TableNavigation
            type={selection.type}
            lastPage={Math.ceil((query.data?.count ?? 0) / 50)}
            currentPage={page()}
            onPageChange={setPage}
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
                />
              )}
            </AsyncContent>
          </TableNavigation>
        </div>
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
