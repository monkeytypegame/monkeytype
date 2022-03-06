import * as DB from "../db";
import Ape from "../ape";
import * as Loader from "../elements/loader";
import * as Notifications from "../elements/notifications";

function refreshList(): void {
  const data = DB.getSnapshot().apeKeys;
  const table = $("#apeKeysPopupWrapper table tbody");
  table.empty();
  if (Object.keys(data).length === 0) {
    table.append(
      "<tr><td colspan='6' style='text-align: center;'>No keys found</td></tr>"
    );
    return;
  }
  for (const keyId of Object.keys(data)) {
    const key = data[keyId];
    table.append(`
      <tr keyId="${keyId}">
        <td>
          <div class="icon-button">
            ${
              key.enabled
                ? `<i class="fas fa-check-square"></i>`
                : `<i class="far fa-fw fa-square"></i>`
            }
          </div>
        </td>
        <td>${key.name}</td>
        <td>${moment(key.createdOn).format("DD MMM YYYY HH:mm")}</td>
        <td>${moment(key.modifiedOn).format("DD MMM YYYY HH:mm")}</td>
        <td>-</td>
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
  }
}

export function hide(): void {
  if (!$("#apeKeysPopupWrapper").hasClass("hidden")) {
    $("#apeKeysPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#apeKeysPopupWrapper").addClass("hidden");
        }
      );
  }
}

//show the popup
export function show(): void {
  if ($("#apeKeysPopupWrapper").hasClass("hidden")) {
    refreshList();
    $("#apeKeysPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate(
        {
          opacity: 1,
        },
        100,
        () => {
          $("#apeKeysPopup textarea").focus().select();
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

$(document).on("click", "#apeKeysPopup table .keyButtons .button", () => {
  hide();
});

$(document).on("click", "#apeKeysPopup table .icon-button", async (e) => {
  const keyId = $(e.target).closest("tr").attr("keyId") as string;
  const key = DB.getSnapshot().apeKeys[keyId];
  Loader.show();
  const response = await Ape.apeKeys.update(keyId, { enabled: !key.enabled });
  Loader.hide();
  if (response.status !== 200) {
    return Notifications.add("Failed to update key: " + response.message, -1);
  }
  const snap = DB.getSnapshot();
  snap.apeKeys[keyId].enabled = !key.enabled;
  DB.setSnapshot(snap);
  refreshList();
  if (key.enabled) {
    Notifications.add("Key active", 1);
  } else {
    Notifications.add("Key inactive", 1);
  }
});
