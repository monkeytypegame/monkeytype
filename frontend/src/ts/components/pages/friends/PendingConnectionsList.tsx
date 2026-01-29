import { Connection, ConnectionStatus } from "@monkeytype/schemas/connections";
import { and, eq, not, useLiveQuery } from "@tanstack/solid-db";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { createEffect, createSignal, JSXElement, Show } from "solid-js";

import { connectionsCollection } from "../../../collections/connections";
import { getUserId } from "../../../signals/core";
import { formatAge } from "../../../utils/date-and-time";
import { addToGlobal } from "../../../utils/misc";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { User } from "../../common/User";
import { DataTable } from "../../ui/table/DataTable";
import { MiniTable } from "../../ui/table/MinimalTable";
import { TableColumnHeader } from "../../ui/table/TableColumnHeader";

let onUpdate: (
  conenctionId: string,
  status: ConnectionStatus | "rejected",
) => Promise<void> | undefined;

export function PendingConnectionsList(props: {
  onUpdate: (
    conenctionId: string,
    status: ConnectionStatus | "rejected",
  ) => Promise<void>;
}): JSXElement {
  onUpdate = props.onUpdate;
  const query = useLiveQuery((q) =>
    q
      .from({ connections: connectionsCollection })
      .where(({ connections }) =>
        and(
          eq(connections.status, "pending"),
          not(eq(connections.initiatorUid, getUserId())),
        ),
      ),
  );
  addToGlobal({
    q: query,
  });

  createEffect(() => {
    console.log("first ", query()[0]?.initiatorName);
    setSignal(() => query());
  });

  const [signal, setSignal] = createSignal(query());

  return (
    <Show when={true}>
      <H2
        text="Incoming Requests"
        fa={{ icon: "fa-user-plus", fixedWidth: true }}
      />

      <Show when={true} fallback={<div>no data</div>}>
        <DataTable id="pendingConnections" columns={columns} query={query} />
        <MiniTable columns={columns} query={signal} />
      </Show>
    </Show>
  );
}
const defineColumn = createColumnHelper<Connection>().accessor;
const columns = [
  defineColumn("initiatorName", {
    header: (props) => <TableColumnHeader column={props.column} title="name" />,
    enableSorting: true,
    cell: (info) => (
      <User
        user={{ name: info.getValue(), uid: info.row.original.initiatorUid }}
        options={{ showAvatar: false }}
      />
    ),
  }),
  defineColumn("lastModified", {
    header: (props) => <TableColumnHeader column={props.column} title="date" />,
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
          fa={{ icon: "fa-check", fixedWidth: true }}
        />
        <Button
          onClick={() => void onUpdate(info.getValue(), "rejected")}
          fa={{ icon: "fa-times", fixedWidth: true }}
        />
        <Button
          onClick={() => void onUpdate(info.getValue(), "blocked")}
          fa={{ icon: "fa-shield-alt", fixedWidth: true }}
        />
      </div>
    ),
  }),
];
