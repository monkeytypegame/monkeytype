import { ResultFilters } from "@monkeytype/schemas/users";
import { inArray, useLiveQuery } from "@tanstack/solid-db";
import { createSignal, JSXElement, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { resultsCollection } from "../../../collections/results";
import defaultResultFilters from "../../../constants/default-result-filters";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { getActivePage, isLoggedIn } from "../../../signals/core";
import { addToGlobal } from "../../../utils/misc";
import { Button } from "../../common/Button";

import { Filters } from "./Filters";
import { Table } from "./Table";

export function AccountPage(): JSXElement {
  //TODO change page
  const isOpen = (): boolean => getActivePage() === "about";
  const [limit, setLimit] = createSignal(10);
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

  const data = useLiveQuery((q) =>
    !isLoggedIn() || !isOpen()
      ? undefined
      : q
          .from({ r: resultsCollection })
          .where(({ r }) =>
            inArray(r.difficulty, valueFilter(filters.difficulty)),
          )
          .where(({ r }) => inArray(r.isPb, boolFilter(filters.pb)))
          .where(({ r }) => inArray(r.mode, valueFilter(filters.mode)))
          //.where(({ r }) =>        inArray(r.quoteLength, valueFilter(filters.quoteLength)),      )
          .where(({ r }) =>
            inArray(r.mode2, [
              ...valueFilter(filters.words),
              ...valueFilter(filters.time),
            ]),
          )
          .where(({ r }) =>
            inArray(r.punctuation, boolFilter(filters.punctuation)),
          )
          .where(({ r }) => inArray(r.numbers, boolFilter(filters.numbers)))
          .orderBy(({ r }) => r[sorting().field], sorting().direction)
          .limit(limit()),
  );

  addToGlobal({ data });

  return (
    <Show when={isLoggedIn()}>
      <Filters
        filters={filters}
        onChangeFilter={(key, value) => {
          setFilters(key, value);
        }}
      />

      {/*
      <Button text="words" onClick={() => setModeFilter("words")} />
      <Button text="time" onClick={() => setModeFilter("time")} />
      <Button
        text="wpm desc"
        onClick={() => setSorting({ field: "wpm", direction: "desc" })}
      />
      <Button
        text="wpm asc"
        onClick={() => setSorting({ field: "wpm", direction: "asc" })}
      />
      <Button
        text="acc desc"
        onClick={() => setSorting({ field: "acc", direction: "desc" })}
      />
      <Button
        text="acc asc"
        onClick={() => setSorting({ field: "acc", direction: "asc" })}
      />
      <pre>
        liveQuery size:{data().length} time: time:{" "}
        {data().filter((it) => it.mode === "time").length}, words:{" "}
        {data().filter((it) => it.mode === "words").length}
      </pre>
      
      <pre>
        {modeFilter()}
        collection size:{resultsCollection.toArray.length} time:{" "}
        {resultsCollection.toArray.filter((it) => it.mode === "time").length},
        words:{" "}
        {resultsCollection.toArray.filter((it) => it.mode === "words").length}
      </pre>
      */}
      <Table data={[...data()]} onSortingChange={(val) => setSorting(val)} />
      <Button
        text="load more"
        disabled={data.isLoading}
        onClick={() => setLimit((limit) => limit + 10)}
      />
    </Show>
  );
}

function valueFilter(val: Record<string, boolean>): string[] {
  return Object.entries(val)
    .filter(([_, v]) => v)
    .map(([k]) => k);
}

function boolFilter(
  val: Record<"on" | "off", boolean> | Record<"yes" | "no", boolean>,
): boolean[] {
  return Object.entries(val)
    .filter(([_, v]) => v)
    .map(([k]) => k === "on" || k === "yes");
}
