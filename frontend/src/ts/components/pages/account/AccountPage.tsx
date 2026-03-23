import {
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  Show,
} from "solid-js";

import {
  createResultsQueryState,
  resultsCollection,
  useResultsLiveQuery,
} from "../../../collections/results";
import defaultResultFilters from "../../../constants/default-result-filters";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { getActivePage, isLoggedIn } from "../../../states/core";
import { hideLoaderBar, showLoaderBar } from "../../../states/loader-bar";
import { filters, setFilters } from "../../../states/result-filters";
import { getSnapshot } from "../../../states/snapshot";
import { qs } from "../../../utils/dom";
import { downloadResultsCSV } from "../../../utils/misc";
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

  const [selectedResultId, setSelectedResultId] = createSignal<null | string>(
    null,
  );

  const data = useResultsLiveQuery({ queryState, sorting, limit });

  //sync tags with default filters TODO: move tags to a collection
  createEffect(() => {
    const currentTags = getSnapshot()?.tags;

    currentTags?.forEach((tag) => {
      defaultResultFilters.tags[tag._id] = true;
    });
  });

  return (
    <Show when={isLoggedIn() && isOpen()}>
      <div class="flex flex-col gap-8">
        <VerifyNotice />
        <MyProfile />

        <Advertisement id="ad-account-1" visible="sellout" />

        <Filters filters={filters} onChangeFilters={setFilters} />

        <Charts
          filters={filters}
          queryState={queryState}
          onHistoryChartClick={({ index, _id }) => {
            const newLimit = Math.ceil(index / 10) * 10;
            if (limit() < newLimit) {
              setLimit(newLimit);
            }
            setSelectedResultId(_id);

            requestAnimationFrame(() => {
              qs(`#resultList tbody tr:nth-child(${index})`)?.scrollIntoView({
                block: "center",
              });
            });
          }}
        />
        <TestStats queryState={queryState} />

        <div class="grid grid-cols-3">
          <Button
            text="Export CSV"
            fa={{ icon: "fa-file-csv" }}
            class="col-start-3 w-full"
            onClick={() => {
              showLoaderBar();
              const filteredResults = useResultsLiveQuery({
                queryState,
                sorting,
                limit: () => Infinity,
              });
              void downloadResultsCSV(filteredResults()).finally(() => {
                hideLoaderBar();
              });
            }}
          />
        </div>

        <Advertisement id="ad-account-2" visible="sellout" />

        <AsyncContent collection={data}>
          {(results) => (
            <>
              <Table
                data={[...results]}
                onSortingChange={(val) => setSorting(val)}
                selectedRowId={selectedResultId}
              />
              <Button
                text="load more"
                disabled={
                  data.isLoading || resultsCollection.size < limit() + 10
                }
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
