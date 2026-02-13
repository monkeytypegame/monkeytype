import { ResultFilters } from "@monkeytype/schemas/users";
import { inArray, useLiveQuery } from "@tanstack/solid-db";
import { createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { resultsCollection } from "../../../collections/results";
import defaultResultFilters from "../../../constants/default-result-filters";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { isLoggedIn } from "../../../signals/core";
import { addToGlobal } from "../../../utils/misc";

import { Filters } from "./Filters";
import { Table } from "./Table";

export function AccountPage(): JSXElement {
  const [filters, setFilters] =
    createStore<ResultFilters>(defaultResultFilters);

  const [sorting, setSorting] = createSignal<{
    // oxlint-disable-next-line typescript/no-explicit-any
    field: keyof SnapshotResult<any>;
    direction: "asc" | "desc";
  }>({
    field: "timestamp",
    direction: "desc",
  });

  addToGlobal({ setSorting });
  const data = useLiveQuery((q) => {
    if (!isLoggedIn()) return undefined;
    return q
      .from({ results: resultsCollection })
      .where(({ results }) =>
        inArray(
          results.mode,
          Object.entries(filters.mode)
            .filter(([_, v]) => v)
            .map(([k]) => k),
        ),
      )
      .where(({ results }) =>
        inArray(
          results.punctuation,
          Object.entries(filters.punctuation)
            .filter(([_, v]) => v)
            .map(([k]) => k === "on"),
        ),
      )
      .orderBy(({ results }) => results[sorting().field], sorting().direction);
    //.limit(10);
  });

  addToGlobal({ data });

  return (
    <Show when={isLoggedIn()}>
      <Filters
        filters={filters}
        onChangeFilter={(key, value) => {
          setFilters(key, value);
        }}
      />
      <Table
        data={[...data()]}
        onSortingChange={(val) => {
          console.log("### page", val);
          setSorting(val);
        }}
      />
    </Show>
  );
}
