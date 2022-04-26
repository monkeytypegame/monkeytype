import * as Tribe from "./tribe";
import * as TribeConfig from "./tribe-config";
import * as Loader from "./loader";

function updateList(list) {
  if (list.length === 0) {
    $("#tribeBrowsePublicRoomsPopup .error").removeClass("hidden");
    $("#tribeBrowsePublicRoomsPopup .list").addClass("hidden");
    return;
  }
  $("#tribeBrowsePublicRoomsPopup .error").addClass("hidden");
  $("#tribeBrowsePublicRoomsPopup .list").removeClass("hidden");
  $("#tribeBrowsePublicRoomsPopup .list").html("");
  for (let i = 0; i < list.length; i++) {
    let room = list[i];
    let html = `
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

export function show() {
  Loader.show();
  Tribe.socket.emit(
    "get_public_rooms",
    {
      page: 0,
      search: "",
    },
    (e) => {
      Loader.hide();
      updateList(e.rooms);
    }
  );
  if ($("#tribeBrowsePublicRoomsPopupWrapper").hasClass("hidden")) {
    $("#tribeBrowsePublicRoomsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125, () => {
        $("#tribeBrowsePublicRoomsPopup .search").focus();
        $("#tribeBrowsePublicRoomsPopup .search").val("");
      });
  }
}

function hide() {
  if (!$("#tribeBrowsePublicRoomsPopupWrapper").hasClass("hidden")) {
    $("#tribeBrowsePublicRoomsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#tribeBrowsePublicRoomsPopupWrapper").addClass("hidden");
        }
      );
  }
}

$(document).on("click", "#tribeBrowsePublicRoomsPopup .room", (e) => {
  let roomId = $(e.currentTarget).attr("id");
  Tribe.joinRoom(roomId, true);
  hide();
});

$("#tribeBrowsePublicRoomsPopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "tribeBrowsePublicRoomsPopupWrapper") {
    hide();
  }
});
