import * as Loader from "../../elements/loader";
import * as Notifications from "../../elements/notifications";
import Ape from "../../ape";
import { ApeKey, ApeKeys } from "@monkeytype/contracts/schemas/ape-keys";
import { format } from "date-fns/format";
import { SimpleModal, TextArea } from "../../utils/simple-modal";

const editApeKey = new SimpleModal({
  id: "editApeKey",
  title: "Edit Ape key",
  inputs: [
    {
      type: "text",
      placeholder: "name",
      initVal: "",
    },
  ],
  buttonText: "edit",
  onlineOnly: true,
  execFn: async (_thisPopup, input) => {
    const response = await Ape.apeKeys.save({
      params: { apeKeyId: _thisPopup.parameters[0] ?? "" },
      body: {
        name: input,
      },
    });
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to update key: " + response.body.message,
      };
    }
    return {
      status: 1,
      message: "Key updated",
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
});

const deleteApeKeyModal = new SimpleModal({
  id: "deleteApeKey",
  title: "Delete Ape key",
  text: "Are you sure?",
  buttonText: "delete",
  onlineOnly: true,
  execFn: async (_thisPopup) => {
    const response = await Ape.apeKeys.delete({
      params: { apeKeyId: _thisPopup.parameters[0] ?? "" },
    });
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to delete key: " + response.body.message,
      };
    }

    onApeKeyChange?.();

    return {
      status: 1,
      message: "Key deleted",
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
});

const viewApeKey = new SimpleModal({
  id: "viewApeKey",
  title: "Ape key",
  inputs: [
    {
      type: "textarea",
      disabled: true,
      placeholder: "key",
      initVal: "",
    },
  ],
  textAllowHtml: true,
  text: `
    This is your new Ape Key. Please keep it safe. You will only see it once!<br><br>
    <strong>Note:</strong> Ape Keys are disabled by default, you need to enable them before they can be used.`,
  buttonText: "close",
  hideCallsExec: true,
  execFn: async (_thisPopup) => {
    return {
      status: 1,
      message: "Key generated",
      showNotification: false,
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
  beforeInitFn: (_thisPopup): void => {
    (_thisPopup.inputs[0] as TextArea).initVal = _thisPopup
      .parameters[0] as string;
  },
  beforeShowFn: (_thisPopup): void => {
    _thisPopup.canClose = false;
    $("#simpleModal textarea").css("height", "110px");
    $("#simpleModal .submitButton").addClass("hidden");
    setTimeout(() => {
      _thisPopup.canClose = true;
      $("#simpleModal .submitButton").removeClass("hidden");
    }, 5000);
  },
});

const generateApeKey = new SimpleModal({
  id: "generateApeKey",
  title: "Generate new Ape key",
  inputs: [
    {
      type: "text",
      placeholder: "Name",
      initVal: "",
    },
  ],
  buttonText: "generate",
  onlineOnly: true,
  execFn: async (thisPopup, name) => {
    const response = await Ape.apeKeys.add({ body: { name, enabled: false } });
    if (response.status !== 200) {
      return {
        status: -1,
        message: "Failed to generate key: " + response.body.message,
      };
    }

    const data = response.body.data;

    const modalChain = thisPopup.modal.getPreviousModalInChain();

    onApeKeyChange?.();

    return {
      status: 1,
      message: "Key generated",
      hideOptions: {
        clearModalChain: true,
        animationMode: "modalOnly",
      },
      afterHide: (): void => {
        viewApeKey.show([data.apeKey], {
          modalChain,
          animationMode: "modalOnly",
        });
      },
    };
  },
});

let apeKeys: ApeKeys | null = {};

const element = $("#pageAccountSettings .tab[data-tab='api']");

async function getData(): Promise<boolean> {
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
    tr.querySelector("button.deleteButton")?.addEventListener("click", (e) => {
      deleteApeKeyModal.show([keyid], {});
    });
    tr.querySelector("button.editButton")?.addEventListener("click", (e) => {
      editApeKey.show([keyid], {});
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

let onApeKeyChange: (() => void) | undefined = undefined;

let lostAccess = false;

export async function update(onApeKeyChangee?: () => void): Promise<void> {
  if (lostAccess) {
    $(".pageAccountSettings .tab[data-tab='api'] table").remove();
    $(".pageAccountSettings .section.apeKeys .buttons").remove();
    $(".pageAccountSettings .section.apeKeys .lostAccess").removeClass(
      "hidden"
    );
    return;
  }
  onApeKeyChange = onApeKeyChangee;
  await getData();
  refreshList();
}

$(".pageAccountSettings").on("click", "#generateNewApeKey", () => {
  generateApeKey.show([], {});
});
