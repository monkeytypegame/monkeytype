import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";
import format from "date-fns/format";
import * as ConnectionState from "../states/connection";
import * as Skeleton from "./skeleton";
import { isPopupVisible } from "../utils/misc";

let apeKeys: MonkeyTypes.ApeKeys = {};

const wrapperId = "apeKeysPopupWrapper";

async function getData(): Promise<void> {
  Loader.show();
  const response = await Ape.apeKeys.get();
  Loader.hide();

  if (response.status !== 200) {
    Notifications.add("Error getting ape keys: " + response.message, -1);
    return undefined;
  }

  apeKeys = response.data as MonkeyTypes.ApeKeys;
}

function refreshList(): void {
  const data = apeKeys;
  if (!data) return;
  const table = $("#apeKeysPopupWrapper table tbody");
  table.empty();
  const apeKeyIds = Object.keys(data);
  if (apeKeyIds.length === 0) {
    table.append(
      "<tr><td colspan='6' style='text-align: center;'>No keys found</td></tr>"
    );
    return;
  }
  apeKeyIds.forEach((apeKeyId) => {
    const key = data[apeKeyId] as MonkeyTypes.ApeKey;
    table.append(`
      <tr keyId="${apeKeyId}">
        <td>
          <div class="textButton">
            ${
              key.enabled
                ? `<i class="fas fa-fw fa-check-square"></i>`
                : `<i class="far fa-fw fa-square"></i>`
            }
          </div>
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
            <div class="button edit">
              <i class="fas fa-fw fa-pen"></i>
            </div>
            <div class="button delete">
              <i class="fas fa-fw fa-trash-alt"></i>
            </div>
          </div>
        </td>
      </tr>
    `);
  });
}

function hide(): void {
  if (isPopupVisible(wrapperId)) {
    $("#apeKeysPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#apeKeysPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

//show the popup
export async function show(): Promise<void> {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  Skeleton.append(wrapperId);
  if (!isPopupVisible(wrapperId)) {
    await getData();
    refreshList();
    $("#apeKeysPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        125,
        () => {
          $("#apeKeysPopup textarea").trigger("focus").trigger("select");
        }
      );
  }
}

$("#apeKeysPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "apeKeysPopupWrapper") {
    hide();
  }
});

$("#apeKeysPopup .generateApeKey").on("click", () => {
  hide();
});

$("#popups").on("click", "#apeKeysPopup table .keyButtons .button", () => {
  hide();
});

$("#popups").on("click", "#apeKeysPopup table .textButton", async (e) => {
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  const key = apeKeys?.[keyId];
  if (!key || !apeKeys) return;
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
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
