import { Mode } from "@monkeytype/schemas/shared";
import { createMemo, createSignal, JSXElement, Show } from "solid-js";

import {
  createResultsQueryState,
  getResultsQueryOnce,
  getResultsSize,
  useResultsLiveQuery,
} from "../../../collections/results";
import { SnapshotResult } from "../../../constants/default-snapshot";
import { getActivePage, isAuthenticated } from "../../../states/core";
import { hideLoaderBar, showLoaderBar } from "../../../states/loader-bar";
import { filters, setFilters } from "../../../states/result-filters";
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
    field: keyof SnapshotResult<Mode>;
    direction: "asc" | "desc";
  }>({
    field: "timestamp",
    direction: "desc",
  });

  const queryState = createMemo(() => {
    if (!isOpen() || !isAuthenticated()) return undefined;

    return createResultsQueryState(filters);
  });

  const [selectedResultId, setSelectedResultId] = createSignal<null | string>(
    null,
  );
  const [isExporting, setIsExporting] = createSignal(false);

  const resultsQuery = useResultsLiveQuery({ queryState, sorting, limit });

  return (
    <Show when={isAuthenticated() && isOpen()}>
      <div class="flex flex-col gap-8">
        <VerifyNotice />
        <MyProfile />

        <Advertisement id="ad-account-1" visible="sellout" />

        <Filters filters={filters} onChangeFilters={setFilters} />

        <Show
          when={resultsQuery()?.length > 0}
          fallback={
            <div class="grid h-150 place-items-center">
              <div>No data found. Check your filters.</div>
            </div>
          }
        >
          <>
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
                  qs(
                    `#resultList tbody tr:nth-child(${index + 1})`,
                  )?.scrollIntoView({
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
                disabled={isExporting()}
                onClick={() => {
                  setIsExporting(true);
                  showLoaderBar();
                  void getResultsQueryOnce({ queryState, sorting })
                    .then(
                      async (results) =>
                        results !== undefined &&
                        (await downloadResultsCSV(results)),
                    )
                    .finally(() => {
                      hideLoaderBar();
                      setIsExporting(false);
                    });
                }}
              />
            </div>

            <Advertisement id="ad-account-2" visible="sellout" />

            <AsyncContent collections={{ resultsQuery }}>
              {({ resultsQueryData }) => (
                <>
                  <Table
                    data={[...resultsQueryData()]}
                    onSortingChange={(val) => setSorting(val)}
                    selectedRowId={selectedResultId}
                  />
                  <Button
                    text="load more"
                    disabled={
                      resultsQuery.isLoading || getResultsSize() < limit() + 10
                    }
                    onClick={() => setLimit((limit) => limit + 10)}
                    class="w-full text-center"
                  />
                </>
              )}
            </AsyncContent>
          </>
        </Show>
      </div>
    </Show>
  );
}
