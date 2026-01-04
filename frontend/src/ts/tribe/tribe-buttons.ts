import * as TribeState from "../tribe/tribe-state";
import { qsa } from "../utils/dom";
import tribeSocket from "./tribe-socket";
import { ROOM_STATE } from "./types";

const buttonsElements = qsa(
  ".pageTribe .tribePage.lobby .lobbyButtons, .pageTest #tribeResultBottom .buttons",
);

function buildFunctions(query: string): {
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  setActive: (active: boolean) => void;
} {
  return {
    show: () => {
      buttonsElements.qs(query)?.show();
    },
    hide: () => {
      buttonsElements.qs(query)?.hide();
    },
    enable: () => {
      buttonsElements.qs(query)?.enable();
    },
    disable: () => {
      buttonsElements.qs(query)?.disable();
    },
    setActive: (active: boolean) => {
      if (active) {
        buttonsElements.qs(query)?.addClass("active");
      } else {
        buttonsElements.qs(query)?.removeClass("active");
      }
    },
  };
}

const buttons = {
  start: {
    ...buildFunctions(".startTestButton"),
  },
  ready: {
    ...buildFunctions(".userReadyButton"),
  },
  autoReady: {
    ...buildFunctions(".autoReadyButton"),
  },
  readyButtonGroup: {
    ...buildFunctions(".readyButtonGroup"),
  },
  afk: {
    ...buildFunctions(".userAfkButton"),
  },
  backToLobby: {
    ...buildFunctions(".backToLobbyButton"),
  },
  leave: {
    ...buildFunctions(".leaveRoomButton"),
  },
};

export function disableStartButton(): void {
  buttons.start.disable();
}

export function enableStartButton(): void {
  buttons.start.enable();
}

export function update(): void {
  const self = TribeState.getSelf();
  const room = TribeState.getRoom();
  if (!self || !room) return;

  buttons.leave.show();

  if (self.isLeader) {
    buttons.start.show();
    buttons.readyButtonGroup.hide();
    buttons.backToLobby.show();
    buttons.afk.hide();
  } else {
    buttons.start.hide();
    buttons.readyButtonGroup.show();
    buttons.backToLobby.hide();
    buttons.afk.show();
  }

  buttons.autoReady.setActive(TribeState.getAutoReady());

  if (self.isReady) {
    buttons.afk.disable();
    buttons.ready.disable();
  } else {
    buttons.afk.enable();
    buttons.ready.enable();
  }

  if (self.isAfk) {
    buttons.afk.setActive(true);
    buttons.ready.disable();
    buttons.autoReady.disable();
  } else {
    buttons.afk.setActive(false);
    buttons.ready.enable();
    buttons.autoReady.enable();
  }

  if (
    room.state === ROOM_STATE.LOBBY ||
    room.state === ROOM_STATE.READY_TO_CONTINUE
  ) {
    buttons.start.enable();
    buttons.backToLobby.enable();
  } else {
    buttons.start.disable();
    buttons.backToLobby.disable();
  }
}

buttonsElements.qs(".userAfkButton")?.on("click", () => {
  const self = TribeState.getSelf();
  if (!self) return;
  tribeSocket.out.room.afkUpdate(!self.isAfk);
});

buttonsElements.qs(".leaveRoomButton")?.on("click", () => {
  tribeSocket.out.room.leave();
});

buttonsElements.qs(".userReadyButton")?.on("click", () => {
  tribeSocket.out.room.readyUpdate();
});

buttonsElements.qs(".backToLobbyButton")?.on("click", () => {
  tribeSocket.out.room.backToLobby();
});

buttonsElements.qs(".autoReadyButton")?.on("click", (e) => {
  TribeState.setAutoReady(!TribeState.getAutoReady());
  update();

  const tribeRoomState = TribeState.getRoom()?.state;
  if (
    TribeState.getAutoReady() &&
    tribeRoomState !== undefined &&
    ["LOBBY", "SHOWING_RESULTS", "READY_TO_CONTINUE"].includes(
      tribeRoomState,
    ) &&
    TribeState.getSelf()?.isReady !== true
  ) {
    tribeSocket.out.room.readyUpdate();
  }
});
