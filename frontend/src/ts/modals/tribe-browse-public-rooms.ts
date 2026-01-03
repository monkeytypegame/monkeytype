import AnimatedModal from "../utils/animated-modal";
import { qs } from "../utils/dom";
import * as Loader from "../elements/loader";
import * as TribeConfig from "../tribe/tribe-config";
import TribeSocket from "../tribe/tribe-socket";
import * as TribeType from "../tribe/types";
import * as Tribe from "../tribe/tribe";

function updateList(list: TribeType.PublicRoomData[]): void {
  const el = modal.getModal();

  if (list.length === 0) {
    el.qs(".error")?.show();
    el.qs(".list")?.hide();
    return;
  }
  el.qs(".error")?.hide();
  el.qs(".list")?.show();

  let html = "";
  for (const room of list) {
    html += `
    <div class="room" data-roomid="${room.id}">
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
  }
  el.qs(".list")?.setHtml(html);
}

export function show(): void {
  Loader.show();
  void TribeSocket.out.room.getPublicRooms(0, "").then((r) => {
    Loader.hide();
    updateList(r.rooms);
  });
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "tribeBrowsePublicRooms",
  cleanup: async () => {
    const el = modal.getModal();
    el.qs<HTMLInputElement>(".search")?.setValue("");
    el.qs(".list")?.empty();
  },
  setup: async (modalEl) => {
    modalEl.onChild("click", ".room", (e) => {
      if (!e.childTarget || !(e.childTarget instanceof HTMLElement)) return;
      const roomId = e.childTarget.getAttribute("data-roomid") ?? "";
      if (roomId !== "") {
        Tribe.joinRoom(roomId, true);
        void modal.hide();
      }
    });
  },
});

qs(".pageTribe .menu .customRooms #browseCustomRooms")?.on("click", (e) => {
  show();
});
