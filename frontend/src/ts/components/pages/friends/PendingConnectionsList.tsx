import { Connection, ConnectionStatus } from "@monkeytype/schemas/connections";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { createMemo, JSXElement, Show } from "solid-js";

import { pendingConnectionsQuery } from "../../../collections/connections";
import { formatAge } from "../../../utils/date-and-time";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { User } from "../../common/User";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";
import { TableColumnHeader } from "../../ui/table/TableColumnHeader";

type OnUpdateFn = (
  conenctionId: string,
  status: ConnectionStatus | "rejected",
) => Promise<void>;

export function PendingConnectionsList(props: {
  onUpdate: OnUpdateFn;
}): JSXElement {
  const columns = createMemo(() =>
    getColumnDefinitions({ onUpdate: props.onUpdate }),
  );
  const query = pendingConnectionsQuery;
  return (
    <Show when={query().length > 0}>
      <H2
        text="Incoming Requests"
        fa={{ icon: "fa-user-plus", fixedWidth: true }}
      />

      <DataTable id="pendingConnections" columns={columns()} query={query} />
    </Show>
  );
}

function getColumnDefinitions({
  onUpdate,
}: {
  onUpdate: OnUpdateFn;
}): DataTableColumnDef<Connection>[] {
  const defineColumn = createColumnHelper<Connection>().accessor;
  const cols = [
    defineColumn("initiatorName", {
      header: (props) => (
        <TableColumnHeader column={props.column} title="name" />
      ),
      enableSorting: true,
      cell: (info) => (
        <User
          user={{ name: info.getValue(), uid: info.row.original.initiatorUid }}
          options={{ showAvatar: false }}
        />
      ),
    }),
    defineColumn("lastModified", {
      header: (props) => (
        <TableColumnHeader column={props.column} title="date" />
      ),
      enableSorting: true,
      cell: (info) => `${formatAge(info.getValue())} ago`,
      meta: {
        cellMeta: ({ value }) => ({
          "aria-label": `since ${dateFormat(value, "dd MMM yyyy HH:mm")}`,
          "data-balloon-pos": "up",
        }),
      },
    }),
    defineColumn("_id", {
      header: "",

      cell: (info) => (
        <div class="flex w-auto justify-between">
          <Button
            onClick={() => void onUpdate(info.getValue(), "accepted")}
            label="accept"
            fa={{ icon: "fa-check", fixedWidth: true }}
          />
          <Button
            onClick={() => void onUpdate(info.getValue(), "rejected")}
            label="reject"
            fa={{ icon: "fa-times", fixedWidth: true }}
          />
          <Button
            onClick={() => void onUpdate(info.getValue(), "blocked")}
            label="block"
            fa={{ icon: "fa-shield-alt", fixedWidth: true }}
          />
        </div>
      ),
    }),
  ];
  return cols;
}
