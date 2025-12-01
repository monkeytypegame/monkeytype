import * as Tribe from "../tribe/tribe";
import * as TribeConfig from "../tribe/tribe-config";
import * as Loader from "../elements/loader";
import TribeSocket from "../tribe/tribe-socket";
import * as TribeType from "../tribe/types";

function updateList(list: TribeType.Room[]): void {
  // TODO: Confirm type from miodec
  if (list.length === 0) {
    $("#tribeBrowsePublicRoomsPopup .error").removeClass("hidden");
    $("#tribeBrowsePublicRoomsPopup .list").addClass("hidden");
    return;
  }
  $("#tribeBrowsePublicRoomsPopup .error").addClass("hidden");
  $("#tribeBrowsePublicRoomsPopup .list").removeClass("hidden");
  $("#tribeBrowsePublicRoomsPopup .list").html("");
  for (const room of list) {
    const html = `
    <div class="room" id="${room.id}">
      <div class="name">
        <div class="title">name</div>
        <div class="value">${room.name}</div>
      </div>
      <div class="players">
        <div class="title">players</div>
        <div class="value">${room.size}</div>
      </div>
      <div class="state">
        <div class="title">state</div>
        <div class="value">${Tribe.getStateString(room.state)}</div>
      </div>
      <div class="config">
        <div class="title">config</div>
        <div class="value">${TribeConfig.getArray(room.config).join(" ")}</div>
      </div>
      <div class="chevron">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
    `;
    $("#tribeBrowsePublicRoomsPopup .list").append(html);
  }
}

export function show(): void {
  Loader.show();
  void TribeSocket.out.room.getPublicRooms(0, "").then((r) => {
    Loader.hide();
    if (r.status !== "Error" && r.rooms) {
      updateList(r.rooms);
    }
  });
  if ($("#tribeBrowsePublicRoomsPopupWrapper").hasClass("hidden")) {
    $("#tribeBrowsePublicRoomsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#tribeBrowsePublicRoomsPopup .search").trigger("focus");
        $("#tribeBrowsePublicRoomsPopup .search").val("");
      });
  }
}

function hide(): void {
  if (!$("#tribeBrowsePublicRoomsPopupWrapper").hasClass("hidden")) {
    $("#tribeBrowsePublicRoomsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#tribeBrowsePublicRoomsPopupWrapper").addClass("hidden");
        }
      );
  }
}

$(document).on("click", "#tribeBrowsePublicRoomsPopup .room", (e) => {
  const roomId = $(e.currentTarget).attr("id") as string;
  Tribe.joinRoom(roomId, true);
  hide();
});

$("#tribeBrowsePublicRoomsPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "tribeBrowsePublicRoomsPopupWrapper") {
    hide();
  }
});

$(".pageTribe .menu .customRooms #browseCustomRooms").on("click", (e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  show();
});
