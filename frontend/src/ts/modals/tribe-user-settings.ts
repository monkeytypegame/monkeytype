import * as TribeState from "../tribe/tribe-state";
import * as Notifications from "../elements/notifications";
import tribeSocket from "../tribe/tribe-socket";
import AnimatedModal from "../utils/animated-modal";

export function show(userId: string): void {
  if (!userId) {
    Notifications.add(
      "Cannot show user settings without passing in user id",
      -1,
    );
    return;
  }

  modal
    .getModal()
    .qs(".title")
    ?.setText(`User settings (${TribeState.getRoom()?.users[userId]?.name})`);
  modal.getModal().setAttribute("data-userid", userId);
  void modal.show();
}

const modal = new AnimatedModal({
  dialogId: "tribeUserSettingsModal",
  setup: async (modalEl) => {
    modalEl.qs("button.giveLeaderButton")?.on("click", () => {
      const userId = modalEl.getAttribute("data-userid");
      if (userId === undefined || userId === null) return;
      tribeSocket.out.room.giveLeader(userId);
      void modal.hide();
    });
    modalEl.qs("button.banButton")?.on("click", () => {
      const userId = modalEl.getAttribute("data-userid");
      if (userId === undefined || userId === null) return;
      tribeSocket.out.room.banUser(userId);
      void modal.hide();
    });
  },
});
