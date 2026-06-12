import { Connection } from "@monkeytype/schemas/connections";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { createMemo, Show } from "solid-js";

import {
  acceptConnection,
  blockConnection,
  rejectConnection,
  usePendingConnectionsQuery,
} from "../../../collections/connections";
import { formatAge } from "../../../utils/date-and-time";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { User } from "../../common/User";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";

export function PendingRequests() {
  const columns = createMemo(() => getColumns());
  const pendingQuery = usePendingConnectionsQuery();
  return (
    <div>
      <AsyncContent collections={{ pendingQuery }}>
        {({ pendingQueryData }) => (
          <Show when={pendingQueryData().length > 0}>
            <H2
              text="Incoming Requests"
              fa={{ icon: "fa-user-plus", fixedWidth: true }}
            />
            <DataTable
              id="pendingConnections"
              columns={columns()}
              data={[...pendingQueryData()]}
            />
          </Show>
        )}
      </AsyncContent>
    </div>
  );
}

function getColumns(): DataTableColumnDef<Connection>[] {
  const defineColumn = createColumnHelper<Connection>().accessor;
  const cols = [
    defineColumn("initiatorName", {
      enableSorting: true,
      header: "user",
      cell: (info) => (
        <User
          user={{ name: info.getValue(), uid: info.row.original.initiatorUid }}
          showAvatar={false}
          linkToProfile
          class="w-min **:data-[ui-element='button']:[--themable-button-text:var(--text-color)]"
        />
      ),
    }),
    defineColumn("lastModified", {
      enableSorting: true,
      header: "date",
      cell: (info) => `${formatAge(info.getValue())} ago`,
      meta: {
        cellMeta: ({ value }) => ({
          "aria-label": `since ${dateFormat(value, "dd MMM yyyy HH:mm")}`,
          "data-balloon-pos": "up",
        }),
        breakpoint: "md",
      },
    }),
    defineColumn("_id", {
      header: "",

      cell: (info) => (
        <div class="flex justify-end gap-2">
          <Button
            onClick={() => void acceptConnection({ id: info.getValue() })}
            balloon={{ text: "accept" }}
            fa={{ icon: "fa-check", fixedWidth: true }}
          />
          <Button
            onClick={() => void rejectConnection({ id: info.getValue() })}
            balloon={{ text: "reject" }}
            fa={{ icon: "fa-times", fixedWidth: true }}
          />
          <Button
            onClick={() => void blockConnection({ id: info.getValue() })}
            balloon={{ text: "block" }}
            fa={{ icon: "fa-shield-alt", fixedWidth: true }}
          />
        </div>
      ),
    }),
  ];

  return cols;
}
