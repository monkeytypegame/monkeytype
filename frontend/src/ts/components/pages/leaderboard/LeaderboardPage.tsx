import { and, gt, lt, lte, useLiveQuery } from "@tanstack/solid-db";
import { createSignal, For, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { allTimeLeaderboardCollection } from "../../../collections/leaderboards";
import { getActivePage } from "../../../signals/core";
import { addToGlobal } from "../../../utils/misc";

import { Selection, Sidebar } from "./Sidebar";

export function LeaderboardPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "leaderboards";
  const [selection, setSelection] = createStore<Selection>({
    type: "allTime",
    time: "60",
    friendsOnly: false,
  });

  const [page, setPage] = createSignal(0);

  addToGlobal({ setPage });
  const allTimeQuery = useLiveQuery((q) =>
    q
      .from({ lb: allTimeLeaderboardCollection })
      .where(({ lb }) =>
        and(gt(lb.rank, page() * 50), lte(lb.rank, (page() + 1) * 50)),
      )
      .orderBy(({ lb }) => lb.rank, "asc"),
  );

  return (
    <Show when={isOpen}>
      <div class="content-grid grid">
        <div class="flex flex-col gap-8 lg:flex-row">
          <div class="w-full lg:w-60">
            <Sidebar onSelect={setSelection} />
          </div>

          <div class="w-full flex-1">
            {JSON.stringify(selection)}
            <For each={allTimeQuery()}>
              {(item) => (
                <div>
                  {item.rank} - {item.name} - {item.wpm}
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}
