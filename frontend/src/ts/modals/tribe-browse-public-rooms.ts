import AnimatedModal from "../utils/animated-modal";
import { qs } from "../utils/dom";
import * as Loader from "../elements/loader";
import * as TribeConfig from "../tribe/tribe-config";
import TribeSocket from "../tribe/tribe-socket";
import * as TribeType from "../tribe/types";
import * as Tribe from "../tribe/tribe";

function updateList(list: TribeType.Room[]): void {
  // TODO: Confirm type from miodec

  const el = $(modal.getModal());

  if (list.length === 0) {
    el.find(".error").removeClass("hidden");
    el.find(".list").addClass("hidden");
    return;
  }
  el.find(".error").addClass("hidden");
  el.find(".list").removeClass("hidden");
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
        <div class="value">${room.state}</div>
      </div>
      <div class="config">
        <div class="title">config</div>
        <div class="value">${TribeConfig.getConfigString(room.config)}</div>
      </div>
      <div class="chevron">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
    `;
    const roomEl = el.find(".list").append(html);
    roomEl.on("click", () => {
      Tribe.joinRoom(room.id, true);
      void modal.hide();
    });
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
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "tribeBrowsePublicRooms",
  cleanup: async () => {
    const el = $(modal.getModal());
    el.find(".search").val("");
    el.find(".list").empty();
  },
});

qs(".pageTribe .menu .customRooms #browseCustomRooms")?.on("click", (e) => {
  show();
});
