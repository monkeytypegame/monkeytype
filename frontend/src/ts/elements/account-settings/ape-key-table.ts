import { showLoaderBar, hideLoaderBar } from "../../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import Ape from "../../ape";
import {
  ApeKey,
  ApeKeys,
  ApeKeyNameSchema,
} from "@monkeytype/schemas/ape-keys";
import { format } from "date-fns/format";
import { isAuthenticated } from "../../states/core";
import { qs, qsr } from "../../utils/dom";
import { showSimpleModal } from "../../states/simple-modal";
import { z } from "zod";
import { showModal } from "../../states/modals";
import { setLastGeneratedApeKey } from "../../states/account-settings";

let apeKeys: ApeKeys | null = {};

const element = qsr("#pageAccountSettings .tab[data-tab='apeKeys']");

async function getData(): Promise<boolean> {
  if (!isAuthenticated()) return false;

  showLoaderRow();
  const response = await Ape.apeKeys.get();

  if (response.status !== 200) {
    if (
      response.body.message ===
      "You have lost access to ape keys, please contact support"
    ) {
      lostAccess = true;
      void update();
      return false;
    }
    showErrorNotification("Error getting ape keys", { response });
    return false;
  }

  apeKeys = response.body.data;
  return true;
}

function showLoaderRow(): void {
  const table = element.qs("table tbody");

  table?.empty();
  table?.appendHtml(
    "<tr><td colspan='6' style='text-align: center;font-size:1rem;'><i class='fas fa-spin fa-circle-notch'></i></td></tr>",
  );
}

function refreshList(): void {
  const data = apeKeys;
  if (data === undefined || data === null) return;
  const table = element.qs("table tbody");
  table?.empty();
  const apeKeyIds = Object.keys(data);
  if (apeKeyIds.length === 0) {
    table?.appendHtml(
      "<tr><td colspan='6' style='text-align: center;'>No keys found</td></tr>",
    );
    return;
  }
  apeKeyIds.forEach((apeKeyId) => {
    const key = data[apeKeyId] as ApeKey;
    table?.appendHtml(`
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
  for (const tr of table?.qsa("tr") ?? []) {
    const keyid = tr.getAttribute("keyid") as string;
    tr.qs("button.toggleActive")?.on("click", (e) => {
      void toggleActiveKey(keyid);
    });
    tr.qs("button.deleteButton")?.on("click", (e) => {
      showSimpleModal({
        title: "Delete Ape key",
        text: "Are you sure?",
        buttonText: "delete",
        execFn: async (_thisPopup) => {
          const response = await Ape.apeKeys.delete({
            params: { apeKeyId: keyid },
          });
          if (response.status !== 200) {
            return {
              status: "error",
              message: "Failed to delete key",
              notificationOptions: { response },
            };
          }

          onApeKeyChange?.();

          return {
            status: "success",
            message: "Key deleted",
            hideOptions: {
              clearModalChain: true,
            },
          };
        },
      });
    });
    tr.qs("button.editButton")?.on("click", (e) => {
      showSimpleModal({
        title: "Edit Ape key",
        buttonText: "edit",
        schema: z.object({ name: ApeKeyNameSchema }),
        inputs: {
          name: {
            type: "text",
            placeholder: "name",
            initVal: "",
          },
        },

        execFn: async ({ name }) => {
          const response = await Ape.apeKeys.save({
            params: { apeKeyId: keyid },
            body: { name },
          });
          if (response.status !== 200) {
            return {
              status: "error",
              message: "Failed to update key",
              notificationOptions: { response },
            };
          }
          return {
            status: "success",
            message: "Key updated",
            hideOptions: {
              clearModalChain: true,
            },
          };
        },
      });
    });
  }
}

async function toggleActiveKey(keyId: string): Promise<void> {
  const key = apeKeys?.[keyId];
  if (!key || apeKeys === undefined) return;
  showLoaderBar();
  const response = await Ape.apeKeys.save({
    params: { apeKeyId: keyId },
    body: { enabled: !key.enabled },
  });
  hideLoaderBar();
  if (response.status !== 200) {
    showErrorNotification("Failed to update key", { response });
    return;
  }
  key.enabled = !key.enabled;
  refreshList();
  if (key.enabled) {
    showSuccessNotification("Key active");
  } else {
    showSuccessNotification("Key inactive");
  }
}

let onApeKeyChange: (() => void) | undefined = undefined;

let lostAccess = false;

export async function update(onApeKeyChangee?: () => void): Promise<void> {
  if (lostAccess) {
    qs(".pageAccountSettings .tab[data-tab='apeKeys'] table")?.remove();
    qs(".pageAccountSettings .section.apeKeys .buttons")?.remove();
    qs(".pageAccountSettings .section.apeKeys .lostAccess")?.removeClass(
      "hidden",
    );
    return;
  }
  onApeKeyChange = onApeKeyChangee;
  await getData();
  refreshList();
}

qs(".pageAccountSettings")?.onChild("click", "#generateNewApeKey", () => {
  showSimpleModal({
    title: "Generate new Ape key",
    buttonText: "generate",
    schema: z.object({ name: ApeKeyNameSchema }),
    inputs: {
      name: {
        type: "text",
        placeholder: "Name",
        initVal: "",
      },
    },

    execFn: async ({ name }) => {
      const response = await Ape.apeKeys.add({
        body: { name, enabled: false },
      });
      if (response.status !== 200) {
        return {
          status: "error",
          message: "Failed to generate key",
          notificationOptions: { response },
        };
      }

      const data = response.body.data;

      onApeKeyChange?.();

      return {
        status: "success",
        message: "Key generated",
        hideOptions: {
          clearModalChain: true,
          animationMode: "modalOnly",
        },
        afterHide: (): void => {
          setLastGeneratedApeKey(data.apeKey);
          showModal("ViewApeKey");
        },
      };
    },
  });
});
