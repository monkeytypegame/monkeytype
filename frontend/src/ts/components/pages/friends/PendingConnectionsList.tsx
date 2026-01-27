import { Connection } from "@monkeytype/schemas/connections";
import { and, eq, not, useLiveQuery } from "@tanstack/solid-db";
import { createColumnHelper } from "@tanstack/solid-table";
import { format as dateFormat } from "date-fns/format";
import { createSignal, For, JSXElement, Show } from "solid-js";

import { connectionsCollection } from "../../../collections/connections";
import { createEffectOn } from "../../../hooks/effects";
import { getActivePage, getUserId } from "../../../signals/core";
import { formatAge } from "../../../utils/date-and-time";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";
import { LoadingCircle } from "../../common/Loader";
import { User } from "../../common/User";
import { DataTable } from "../../ui/table/DataTable";
import { TableColumnHeader } from "../../ui/table/TableColumnHeader";

const [isOpen, setIsOpen] = createSignal(false);
createEffectOn(getActivePage, (page) => {
  console.log("### open page", page);
  setIsOpen(page === "friends");
});

createEffectOn(isOpen, (open) => {
  if (open) {
    console.log("### refetch ", getUserId());
    void connectionsCollection.utils.refetch();
  }
});

function updateConnection(id: string, status: Connection["status"]): void {
  const connection = connectionsCollection.get(id);
  if (!connection) return;
  console.log("### update", connection);

  connectionsCollection.update(id, (draft) => {
    draft.status = status;
  });
}

export function PendingConnectionsList(): JSXElement {
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

  return (
    <Show when={isOpen()}>
      <H2
        text="Incoming Requests"
        fa={{ icon: "fa-user-plus", fixedWidth: true }}
      />
      <Button
        onClick={() => {
          void connectionsCollection.utils.refetch();
        }}
        text="refetch"
      />

      {`live ${query.isReady}   ${query().length}`}
      <Show when={query.isReady} fallback={<LoadingCircle />}>
        <DataTable id="pendingConnections" columns={columns} data={query()} />
        <For each={query() ?? []}>
          {(item) => `live ${item.initiatorName} ${item._id}`}
        </For>
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
      <>
        <Button
          onClick={() => updateConnection(info.getValue(), "accepted")}
          fa={{ icon: "fa-check", fixedWidth: true }}
        />
      </>
    ),
  }),
];
