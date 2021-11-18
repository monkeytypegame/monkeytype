import * as Tribe from "./tribe";

function showStartButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .startTestButton";
  }
  $(elString).removeClass("hidden");
}

function hideStartButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .startTestButton";
  }
  $(elString).addClass("hidden");
}

export function disableStartButton(page) {
  if (!page) {
    disableStartButton("lobby");
    disableStartButton("result");
    return;
  }
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .startTestButton";
  }
  $(elString).addClass("disabled");
}

export function enableStartButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .startTestButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .startTestButton";
  }
  $(elString).removeClass("disabled");
}

function showReadyButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userReadyButton";
  }
  $(elString).removeClass("hidden");
}

function hideReadyButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userReadyButton";
  }
  $(elString).addClass("hidden");
}

export function disableReadyButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userReadyButton";
  }
  $(elString).addClass("disabled");
}

export function enableReadyButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userReadyButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userReadyButton";
  }
  $(elString).removeClass("disabled");
}

function showAfkButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).removeClass("hidden");
}

function hideAfkButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).addClass("hidden");
}

export function disableAfkButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).addClass("disabled");
}

export function enableAfkButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).removeClass("disabled");
}

export function deactivateAfkButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).removeClass("active");
}

export function activateAfkButton(page) {
  let elString = "";
  if (page === "lobby") {
    elString = ".pageTribe .tribePage.lobby .lobbyButtons .userAfkButton";
  } else if (page === "result") {
    elString = ".pageTest #tribeResultBottom .buttons .userAfkButton";
  }
  $(elString).addClass("active");
}

export function update(page) {
  if (Tribe.getSelf().isLeader) {
    showStartButton(page);
    hideReadyButton(page);
    hideAfkButton(page);

    enableStartButton(page);
    // TODO REENABLE
    // if (Tribe.state === 5) {
    //   let readyCount = 0;
    //   Object.keys(Tribe.room.users).forEach((userId) => {
    //     if (Tribe.room.users[userId].isLeader || room.users[userId].isAfk) return;
    //     if (Tribe.room.users[userId].isReady) {
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
    hideStartButton(page);
    showAfkButton(page);
    showReadyButton(page);
    deactivateAfkButton(page);
    enableReadyButton(page);
    enableAfkButton(page);
    if (Tribe.getSelf().isAfk) {
      activateAfkButton(page);
      disableReadyButton(page);
    }
    if (Tribe.getSelf().isReady) {
      disableAfkButton(page);
      disableReadyButton(page);
    }
  }
}
