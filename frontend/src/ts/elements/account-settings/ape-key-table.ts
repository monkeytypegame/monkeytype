import * as Loader from "../../elements/loader";
import * as Notifications from "../../elements/notifications";
import Ape from "../../ape";
import { ApeKey, ApeKeys } from "@monkeytype/contracts/schemas/ape-keys";
import { format } from "date-fns/format";

let apeKeys: ApeKeys | null = {};

const element = $("#pageAccountSettings .tab[data-tab='api']");

//todo handle no ape key permission

//todo edit and delete

async function getData(): Promise<boolean> {
  showLoaderRow();
  const response = await Ape.apeKeys.get();

  if (response.status !== 200) {
    Notifications.add("Error getting ape keys: " + response.body.message, -1);
    return false;
  }

  apeKeys = response.body.data;
  return true;
}

function showLoaderRow(): void {
  const table = element.find("table tbody");

  table.empty();
  table.append(
    "<tr><td colspan='6' style='text-align: center;font-size:1rem;'><i class='fas fa-spin fa-circle-notch'></i></td></tr>"
  );
}

function refreshList(): void {
  const data = apeKeys;
  if (data === undefined || data === null) return;
  const table = element.find("table tbody");
  table.empty();
  const apeKeyIds = Object.keys(data);
  if (apeKeyIds.length === 0) {
    table.append(
      "<tr><td colspan='6' style='text-align: center;'>No keys found</td></tr>"
    );
    return;
  }
  apeKeyIds.forEach((apeKeyId) => {
    const key = data[apeKeyId] as ApeKey;
    table.append(`
      <tr keyId="${apeKeyId}">
        <td>
          <button class="textButton toggleActive" style="font-size: 1.25rem">
            ${
              key.enabled
                ? `<i class="fas fa-fw fa-check-square"></i>`
                : `<i class="far fa-fw fa-square"></i>`
            }
          </button>
        </td>
        <td>${key.name}</td>
        <td>${format(new Date(key.createdOn), "dd MMM yyyy HH:mm")}</td>
        <td>${format(new Date(key.modifiedOn), "dd MMM yyyy HH:mm")}</td>
        <td>${
          key.lastUsedOn === -1
            ? "-"
            : format(new Date(key.lastUsedOn), "dd MMM yyyy HH:mm")
        }</td>
        <td>
          <div class="keyButtons">
            <button class="editButton">
              <i class="fas fa-fw fa-pen"></i>
            </button>
            <button class="deleteButton">
              <i class="fas fa-fw fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `);
  });
  for (const tr of table.find("tr")) {
    const keyid = tr.getAttribute("keyid") as string;
    tr.querySelector("button.toggleActive")?.addEventListener("click", (e) => {
      void toggleActiveKey(keyid);
    });
  }
}

async function toggleActiveKey(keyId: string): Promise<void> {
  const key = apeKeys?.[keyId];
  if (!key || apeKeys === undefined) return;
  Loader.show();
  const response = await Ape.apeKeys.save({
    params: { apeKeyId: keyId },
    body: { enabled: !key.enabled },
  });
  Loader.hide();
  if (response.status !== 200) {
    Notifications.add("Failed to update key: " + response.body.message, -1);
    return;
  }
  key.enabled = !key.enabled;
  refreshList();
  if (key.enabled) {
    Notifications.add("Key active", 1);
  } else {
    Notifications.add("Key inactive", 1);
  }
}

export async function update(): Promise<void> {
  await getData();
  refreshList();
}