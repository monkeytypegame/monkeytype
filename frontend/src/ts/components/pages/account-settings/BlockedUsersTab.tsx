import { Connection } from "@monkeytype/schemas/connections";
import { createColumnHelper } from "@tanstack/solid-table";
import { format } from "date-fns/format";
import { createMemo, Show } from "solid-js";

import {
  rejectConnection,
  useBlockedConnectionsQuery,
} from "../../../collections/connections";
import { showSimpleModal } from "../../../states/simple-modal";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { User } from "../../common/User";
import { DataTable, DataTableColumnDef } from "../../ui/table/DataTable";
import { Section } from "./utils";

export function BlockedUsersTab() {
  const query = useBlockedConnectionsQuery();
  const columns = createMemo(getColumns);

  return (
    <Section
      title="blocked users"
      fa={{ icon: "fa-user-shield" }}
      fullWidth
      description=<>Blocked users cannot send you friend requests.</>
    >
      <AsyncContent collections={{ query }}>
        {({ queryData }) => (
          <Show
            when={query().length > 0}
            fallback={<p>You have not blocked any users.</p>}
          >
            <DataTable
              id="blockedUsers"
              columns={columns()}
              data={queryData()}
            />
          </Show>
        )}
      </AsyncContent>
    </Section>
  );
}

function getColumns(): DataTableColumnDef<Connection>[] {
  const defineColumn = createColumnHelper<Connection>().accessor;
  const cols = [
    defineColumn("initiatorName", {
      header: "name",
      cell: (info) => (
        <User
          user={{
            name: info.getValue(),
            uid: info.row.original.initiatorUid,
          }}
          showAvatar={false}
          linkToProfile
          class="w-min **:data-[ui-element='button']:[--themable-button-text:var(--text-color)]"
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
          onClick={() =>
            showSimpleModal({
              title: `Unblock user ${info.row.original.initiatorName}?`,
              buttonText: "unblock",
              execFn: async () => {
                await rejectConnection({ id: info.getValue() });
                return {
                  status: "success",
                  message: `User ${info.row.original.initiatorName} unblocked`,
                };
              },
            })
          }
          balloon={{ text: "unblock user" }}
          fa={{ icon: "fa-trash-alt", fixedWidth: true }}
        />
      ),
    }),
  ];
  return cols;
}
