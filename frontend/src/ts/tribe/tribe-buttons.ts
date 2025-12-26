import * as TribeState from "../tribe/tribe-state";
import tribeSocket from "./tribe-socket";
import { ROOM_STATE } from "./types";

function showStartButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .startTestButton,
                .pageTest #tribeResultBottom .buttons .backToLobbyButton`;
  }
  $(elString).removeClass("hidden");
}

function hideStartButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .startTestButton,
                .pageTest #tribeResultBottom .buttons .backToLobbyButton`;
  }
  $(elString).addClass("hidden");
}

export function disableStartButton(page?: string): void {
  if (page === undefined) {
    disableStartButton("lobby");
    disableStartButton("result");
    return;
  }
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .startTestButton,
                .pageTest #tribeResultBottom .buttons .backToLobbyButton`;
  }
  $(elString).addClass("disabled");
}

export function enableStartButton(page: string): void {
  if (!page) {
    enableStartButton("lobby");
    enableStartButton("result");
    return;
  }
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .startTestButton,
                .pageTest #tribeResultBottom .buttons .backToLobbyButton`;
  }
  $(elString).removeClass("disabled");
}

function showReadyButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = `.pageTribe .tribePage.lobby .lobbyButtons .readyButtonGroup,
                .pageTribe .tribePage.lobby .lobbyButtons .userReadyButton,
                .pageTribe .tribePage.lobby .lobbyButtons .autoReadyButton`;
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .readyButtonGroup,
                .pageTest #tribeResultBottom .buttons .userReadyButton,
                .pageTest #tribeResultBottom .buttons .autoReadyButton`;
  }
  $(elString).removeClass("hidden");
}

function hideReadyButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .readyButtonGroup";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .readyButtonGroup`;
  }
  $(elString).addClass("hidden");
}

export function disableReadyButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .userReadyButton`;
  }
  $(elString).addClass("disabled");
}

export function enableReadyButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .userReadyButton`;
  }
  $(elString).removeClass("disabled");
}

export function disableAutoReadyButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .autoReadyButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .autoReadyButton`;
  }
  $(elString).addClass("disabled");
}

export function enableAutoReadyButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .autoReadyButton";
  } else if (page === "result") {
    elString = `.pageTest #tribeResultBottom .buttons .autoReadyButton`;
  }
  $(elString).removeClass("disabled");
}
function showAfkButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).removeClass("hidden");
}

function hideAfkButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).addClass("hidden");
}

export function disableAfkButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).addClass("disabled");
}

export function enableAfkButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).removeClass("disabled");
}

export function deactivateAfkButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).removeClass("active");
}

export function activateAfkButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).addClass("active");
}

export function updateAutoReadyButton(page: string): void {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .autoReadyButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .autoReadyButton";
  }
  if (TribeState.getAutoReady()) {
    $(elString).addClass("active");
  } else {
    $(elString).removeClass("active");
  }
}

export function update(page?: string): void {
  if (page === undefined) {
    update("lobby");
    update("result");
    return;
  }
  const self = TribeState.getSelf();
  if (self?.isLeader) {
    showStartButton(page);
    hideReadyButton(page);
    hideAfkButton(page);

    disableStartButton(page);

    const tribeRoom = TribeState.getRoom();

    if (
      tribeRoom?.state === ROOM_STATE.LOBBY ||
      tribeRoom?.state === ROOM_STATE.READY_TO_CONTINUE
    ) {
      enableStartButton(page);
    }

    // TODO REENABLE
    // if (TribeState.get() === 5) {
    //   let readyCount = 0;
    //   Object.keys(TribeState.getRoom().users).forEach((userId) => {
    //     if (TribeState.getRoom().users[userId].isLeader || room.users[userId].isAfk) return;
    //     if (TribeState.getRoom().users[userId].isReady) {
    //       readyCount++;
    //     }
    //   });
    //   if (readyCount > 0) {
    //     enableStartButton();
    //   } else {
    //     disableStartButton();
    //   }
    // }
  } else {
    updateAutoReadyButton(page);
    hideStartButton(page);
    showAfkButton(page);
    showReadyButton(page);
    deactivateAfkButton(page);
    enableReadyButton(page);
    enableAfkButton(page);
    enableAutoReadyButton(page);
    if (self?.isAfk) {
      activateAfkButton(page);
      disableReadyButton(page);
      disableAutoReadyButton(page);
    }
    if (self?.isReady) {
      disableAfkButton(page);
      disableReadyButton(page);
    }
  }
}

$(`.pageTribe .tribePage.lobby .lobbyButtons .userAfkButton,
  .pageTest #tribeResultBottom .buttons .userAfkButton`).on("click", (_e) => {
  const self = TribeState.getSelf();
  if (!self) return;
  tribeSocket.out.room.afkUpdate(!self.isAfk);
});

$(`.pageTribe .tribePage.lobby .lobbyButtons .leaveRoomButton,
.pageTest #tribeResultBottom .buttons .leaveRoomButton`).on("click", (_e) => {
  tribeSocket.out.room.leave();
});

$(
  `.pageTribe .tribePage.lobby .lobbyButtons .userReadyButton, .pageTest #tribeResultBottom .buttons .userReadyButton`,
).on("click", (_e) => {
  tribeSocket.out.room.readyUpdate();
});

$(`.pageTribe .tribePage.lobby .lobbyButtons .autoReadyButton,
.pageTest #tribeResultBottom .buttons .autoReadyButton`).on("click", (e) => {
  TribeState.setAutoReady(!TribeState.getAutoReady());
  if (TribeState.getAutoReady()) {
    $(e.currentTarget).addClass("active");
  } else {
    $(e.currentTarget).removeClass("active");
  }

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
