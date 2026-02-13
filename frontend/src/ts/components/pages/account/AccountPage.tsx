import { ResultFilters, ResultFiltersSchema } from "@monkeytype/schemas/users";
import { createSignal, JSXElement, Show } from "solid-js";

import { useResultsLiveQuery } from "../../../collections/results";
import defaultResultFilters from "../../../constants/default-result-filters";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { getActivePage, isLoggedIn } from "../../../signals/core";
import { isObject, typedKeys } from "../../../utils/misc";
import { sanitize } from "../../../utils/sanitize";
import { Button } from "../../common/Button";

import { Filters } from "./Filters";
import { Table } from "./Table";

export function AccountPage(): JSXElement {
  //TODO change page
  const isOpen = (): boolean => getActivePage() === "about";
  const [limit, setLimit] = createSignal(10);

  const [filters, setFilters] = useLocalStorage({
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

  const data = useResultsLiveQuery({
    enabled: () => isOpen() && isLoggedIn(),
    filters,
    sorting,
    limit,
  });

  return (
    <Show when={isLoggedIn()}>
      <Filters
        filters={filters()}
        onChangeFilter={(key, value) =>
          setFilters({ ...filters(), [key]: value })
        }
      />

      <Table data={[...data()]} onSortingChange={(val) => setSorting(val)} />
      <Button
        text="load more"
        disabled={data.isLoading}
        onClick={() => setLimit((limit) => limit + 10)}
      />
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
