import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import { format } from "date-fns/format";
import * as ConnectionState from "../states/connection";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { showPopup } from "./simple-modals";

let apeKeys: Ape.ApeKeys.GetApeKeys | null = {};

async function getData(): Promise<void> {
  Loader.show();
  const response = await Ape.apeKeys.get();
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Error getting ape keys: " + response.message, -1);
    return undefined;
  }

  apeKeys = response.data;
}

function refreshList(): void {
  const data = apeKeys;
  if (data === undefined || data === null) return;
  const table = $("#apeKeysModal table tbody");
  table.empty();
  const apeKeyIds = Object.keys(data);
  if (apeKeyIds.length === 0) {
    table.append(
      "<tr><td colspan='6' style='text-align: center;'>No keys found</td></tr>"
    );
    return;
  }
  apeKeyIds.forEach((apeKeyId) => {
    const key = data[apeKeyId] as SharedTypes.ApeKey;
    table.append(`
      <tr keyId="${apeKeyId}">
        <td>
          <button class="textButton toggleActive">
            ${
              key.enabled
                ? `<i class="fas fa-fw fa-check-square"></i>`
                : `<i class="far fa-fw fa-square"></i>`
            }
          </button>
        </td>
        <td  onClick=${console.log(key)}>${key.name}</td>
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
    tr.querySelector("button.deleteButton")?.addEventListener("click", (e) => {
      showPopup("deleteApeKey", [keyid], {
        modalChain: modal,
      });
    });
    tr.querySelector("button.editButton")?.addEventListener("click", (e) => {
      showPopup("editApeKey", [keyid], {
        modalChain: modal,
      });
    });
    tr.querySelector("button.toggleActive")?.addEventListener("click", (e) => {
      void toggleActiveKey(keyid);
    });
  }
}

// function hide(clearModalChain = false): void {
//   void modal.hide({
//     clearModalChain,
//   });
// }

//show the popup
export async function show(showOptions?: ShowOptions): Promise<void> {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  void modal.show({
    ...showOptions,
    beforeAnimation: async () => {
      await getData();
      refreshList();
    },
  });
}

async function toggleActiveKey(keyId: string): Promise<void> {
  const key = apeKeys?.[keyId];
  if (!key || apeKeys === undefined) return;
  Loader.show();
  const response = await Ape.apeKeys.update(keyId, { enabled: !key.enabled });
  Loader.hide();
  if (response.status !== 200) {
    return Notifications.add("Failed to update key: " + response.message, -1);
  }
  key.enabled = !key.enabled;
  refreshList();
  if (key.enabled) {
    Notifications.add("Key active", 1);
  } else {
    Notifications.add("Key inactive", 1);
  }
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl
    .querySelector(".generateApeKey")
    ?.addEventListener("click", async () => {
      showPopup("generateApeKey", [], {
        modalChain: modal,
      });
    });
}

const modal = new AnimatedModal({
  dialogId: "apeKeysModal",
  setup,
});
