import { ResultFilters, ResultFiltersSchema } from "@monkeytype/schemas/users";
import { createMemo, createSignal, JSXElement, Show } from "solid-js";

import {
  createResultsQueryState,
  useResultsLiveQuery,
} from "../../../collections/results";
import defaultResultFilters from "../../../constants/default-result-filters";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { useLocalStorageStore } from "../../../hooks/useLocalStorageStore";
import { getActivePage, isLoggedIn } from "../../../signals/core";
import { isObject, typedKeys } from "../../../utils/misc";
import { sanitize } from "../../../utils/sanitize";
import { Advertisement } from "../../common/Advertisement";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { Charts } from "./Charts";
import { Filters } from "./Filters";
import { MyProfile } from "./MyProfile";
import { Table } from "./Table";
import { TestStats } from "./TestStats";
import { VerifyNotice } from "./VerifyNotice";

export function AccountPage(): JSXElement {
  const isOpen = (): boolean => getActivePage() === "account";
  const [limit, setLimit] = createSignal(10);

  const [filters, setFilters] = useLocalStorageStore({
    key: "resultFilters",
    schema: ResultFiltersSchema,
    fallback: defaultResultFilters,
    migrate: migrateFilterStorage,
  });

  const [sorting, setSorting] = createSignal<{
    // oxlint-disable-next-line typescript/no-explicit-any
    field: keyof SnapshotResult<any>;
    direction: "asc" | "desc";
  }>({
    field: "timestamp",
    direction: "desc",
  });

  const queryState = createMemo(() => {
    if (!isOpen() || !isLoggedIn()) return undefined;

    return createResultsQueryState(filters);
  });

  const data = useResultsLiveQuery({ queryState, sorting, limit });

  return (
    <Show when={isLoggedIn() && isOpen()}>
      <div class="flex flex-col gap-8">
        <VerifyNotice />
        <MyProfile />

        <Advertisement id="ad-account-1" visible="sellout" />

        <Filters filters={filters} onChangeFilters={setFilters} />

        <Charts filters={filters} queryState={queryState} />
        <TestStats queryState={queryState} />

        <Advertisement id="ad-account-2" visible="sellout" />

        <AsyncContent collection={data}>
          {(results) => (
            <>
              <Table
                data={[...results]}
                onSortingChange={(val) => setSorting(val)}
              />
              <Button
                text="load more"
                disabled={data.isLoading || data().length < limit() + 10}
                onClick={() => setLimit((limit) => limit + 10)}
                class="w-full text-center"
              />
            </>
          )}
        </AsyncContent>
      </div>
    </Show>
  );
}

function migrateFilterStorage(unknown: unknown): ResultFilters {
  if (!isObject(unknown)) {
    return defaultResultFilters;
  }
  const filters = sanitize(
    ResultFiltersSchema.partial().strip(),
    unknown as ResultFilters,
  );

  try {
    const merged = {} as ResultFilters;
    for (const groupKey of typedKeys(defaultResultFilters)) {
      if (groupKey === "_id") {
        let id = filters[groupKey] ?? defaultResultFilters[groupKey];
        if (id === "default-result-filters-id" || id === "") {
          id = "default";
        }
        merged[groupKey] = id;
      } else if (groupKey === "name") {
        merged[groupKey] = filters[groupKey] ?? defaultResultFilters[groupKey];
      } else {
        // @ts-expect-error i cant figure this out
        merged[groupKey] = {
          ...defaultResultFilters[groupKey],
          ...filters[groupKey],
        };
      }
    }
    return merged;
  } catch (e) {
    return defaultResultFilters;
  }
}
