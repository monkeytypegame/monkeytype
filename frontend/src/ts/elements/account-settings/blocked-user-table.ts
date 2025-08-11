import * as Notifications from "../../elements/notifications";
import { FriendRequest } from "@monkeytype/schemas/friends";
import Ape from "../../ape";
import { format } from "date-fns/format";
import { isAuthenticated } from "../../firebase";

let blockedUsers: FriendRequest[] = [];
const element = $("#pageAccountSettings .tab[data-tab='blockedUsers']");

async function getData(): Promise<boolean> {
  showLoaderRow();

  if (!isAuthenticated()) {
    blockedUsers = [];
    return false;
  }

  const response = await Ape.friends.getRequests({
    query: { status: "blocked", type: "incoming" },
  });

  if (response.status !== 200) {
    blockedUsers = [];
    Notifications.add(
      "Error getting blocked users: " + response.body.message,
      -1
    );
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
  const table = element.find("table tbody");

  table.empty();
  table.append(
    "<tr><td colspan='3' style='text-align: center;font-size:1rem;'><i class='fas fa-spin fa-circle-notch'></i></td></tr>"
  );
}

function refreshList(): void {
  const table = element.find("table tbody");
  table.empty();
  if (blockedUsers.length === 0) {
    table.append(
      "<tr><td colspan='3' style='text-align: center;'>No blocked users</td></tr>"
    );
    return;
  }
  const content = blockedUsers.map(
    (blocked) => `
    <tr data-id="${blocked._id}">
       <td><a href="${location.origin}/profile/${
      blocked.initiatorUid
    }?isUid" router-link>${blocked.initiatorName}</a></td>
       <td>${format(new Date(blocked.addedAt), "dd MMM yyyy HH:mm")}</td>
       <td>
         <button class="delete">
           <i class="fas fa-fw fa-trash-alt"></i>
         </button>
       </td>
    </tr>
    `
  );
  table.append(content.join());
}

element.on("click", "table button.delete", async (e) => {
  const id = (e.target as HTMLElement).parentElement?.parentElement?.dataset[
    "id"
  ];
  if (id === undefined) {
    throw new Error("Cannot find id of target.");
  }

  const response = await Ape.friends.deleteRequest({ params: { id } });
  if (response.status !== 200) {
    Notifications.add(`Cannot unblock user: ${response.body.message}`, -1);
  } else {
    blockedUsers = blockedUsers.filter((it) => it._id !== id);
    refreshList();
  }
});
