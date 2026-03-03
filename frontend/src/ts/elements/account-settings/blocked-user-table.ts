import * as Notifications from "../../elements/notifications";
import { Connection } from "@monkeytype/schemas/connections";
import Ape from "../../ape";
import { format } from "date-fns/format";
import { isAuthenticated } from "../../firebase";
import { getReceiverUid } from "../../pages/friends";
import * as DB from "../../db";
import { updateFriendRequestsIndicator } from "../account-button";
import { qsr } from "../../utils/dom";

let blockedUsers: Connection[] = [];
const element = qsr("#pageAccountSettings .tab[data-tab='blockedUsers']");

async function getData(): Promise<boolean> {
  showLoaderRow();

  if (!isAuthenticated()) {
    blockedUsers = [];
    return false;
  }

  const response = await Ape.connections.get({
    query: { status: "blocked", type: "incoming" },
  });

  if (response.status !== 200) {
    blockedUsers = [];
    Notifications.add("Error getting blocked users", -1, { response });
    return false;
  }

  blockedUsers = response.body.data;
  return true;
}
export async function update(): Promise<void> {
  await getData();
  refreshList();
}

function showLoaderRow(): void {
  const table = element.qs("table tbody");

  table?.empty();
  table?.appendHtml(
    "<tr><td colspan='3' style='text-align: center;font-size:1rem;'><i class='fas fa-spin fa-circle-notch'></i></td></tr>",
  );
}

function refreshList(): void {
  const table = element.qs("table tbody");
  table?.empty();
  if (blockedUsers.length === 0) {
    table?.appendHtml(
      "<tr><td colspan='3' style='text-align: center;'>No blocked users</td></tr>",
    );
    return;
  }
  const content = blockedUsers.map(
    (blocked) => `
    <tr data-id="${blocked._id}" data-uid="${getReceiverUid(blocked)}">
       <td><a href="${location.origin}/profile/${blocked.initiatorName}" router-link>${blocked.initiatorName}</a></td>
       <td>${format(new Date(blocked.lastModified), "dd MMM yyyy HH:mm")}</td>
       <td>
         <button class="delete">
           <i class="fas fa-fw fa-trash-alt"></i>
         </button>
       </td>
    </tr>
    `,
  );
  table?.appendHtml(content.join());
}

element.onChild("click", "table button.delete", async (e) => {
  const row = (e.childTarget as HTMLElement).closest("tr") as HTMLElement;
  const id = row?.dataset["id"];

  if (id === undefined) {
    throw new Error("Cannot find id of target.");
  }

  row.querySelectorAll("button").forEach((button) => (button.disabled = true));

  const response = await Ape.connections.delete({ params: { id } });
  if (response.status !== 200) {
    Notifications.add(`Cannot unblock user: ${response.body.message}`, -1);
  } else {
    blockedUsers = blockedUsers.filter((it) => it._id !== id);
    refreshList();

    const snapshot = DB.getSnapshot();
    if (snapshot) {
      const uid = row.dataset["uid"];
      if (uid === undefined) {
        throw new Error("Cannot find uid of target.");
      }

      // oxlint-disable-next-line no-dynamic-delete, no-unsafe-member-access
      delete snapshot.connections[uid];
      updateFriendRequestsIndicator();
    }
  }
});
