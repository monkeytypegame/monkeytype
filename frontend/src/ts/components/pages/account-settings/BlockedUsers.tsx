import { Connection } from "@monkeytype/schemas/connections";
import {
  and,
  eq,
  InitialQueryBuilder,
  not,
  useLiveQuery,
} from "@tanstack/solid-db";
import { createColumnHelper } from "@tanstack/solid-table";
import { format } from "date-fns/format";
import { createMemo, JSXElement, Show } from "solid-js";

import { connectionsCollection } from "../../../collections/connections";
import { updateFriendRequestsIndicator } from "../../../elements/account-button";
import * as Notifications from "../../../elements/notifications";
import { getUserId } from "../../../signals/core";
import { Button } from "../../common/Button";
import { H3 } from "../../common/Headers";
import { User } from "../../common/User";
import { DataTable } from "../../ui/table/DataTable";

export function BlockedUsers(): JSXElement {
  const query = useLiveQuery(() => ({
    id: "blockedConnections",
    startSync: false,
    query: (q: InitialQueryBuilder) => {
      console.log("### blocked");
      return q
        .from({ connections: connectionsCollection })
        .where(({ connections }) =>
          and(
            eq(connections.status, "blocked"),
            not(eq(connections.initiatorUid, getUserId())),
          ),
        );
    },
  }));

  const columns = createMemo(() => {
    const defineColumn = createColumnHelper<Connection>().accessor;
    return [
      defineColumn("initiatorName", {
        header: "name",
        cell: (info) => (
          <User
            user={{
              name: info.getValue(),
              uid: info.row.original.initiatorUid,
            }}
            showAvatar={false}
          />
        ),
      }),
      defineColumn("lastModified", {
        header: "blocked on",
        cell: ({ getValue }) => format(getValue(), "dd MMM yyyy HH:mm"),
      }),
      defineColumn("_id", {
        header: "",
        cell: (info) => (
          <Button
            onClick={() => removeBlocked(info.getValue())}
            label="unblock user"
            fa={{ icon: "fa-trash-alt", fixedWidth: true }}
          />
        ),
      }),
    ];
  });

  return (
    <>
      <div class="section blockedUsers">
        <H3 text="blocked users" fa={{ icon: "fa-user-shield" }} />
        <p>Blocked users cannot send you friend requests.</p>
      </div>

      <Show
        when={query().length > 0}
        fallback={<p>You have not blocked any users.</p>}
      >
        <DataTable id="blockedUsers" columns={columns()} query={query} />
      </Show>
    </>
  );
}

function removeBlocked(id: string): void {
  void connectionsCollection.delete(id).isPersisted.promise.then(() => {
    Notifications.add("User unblocked.", 0);
    updateFriendRequestsIndicator();
  });
}
