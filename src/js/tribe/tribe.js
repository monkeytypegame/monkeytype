import { io } from "socket.io-client";
import * as Notifications from "./notifications";
import * as UpdateConfig from "./config";
import * as DB from "./db";
import * as TribePages from "./tribe-pages";
import * as TribePagePreloader from "./tribe-page-preloader";
import * as AccountController from "./account-controller";
import * as TribePageMenu from "./tribe-page-menu";
import * as TribePageLobby from "./tribe-page-lobby";
import * as TribeSound from "./tribe-sound";
import * as TribeChat from "./tribe-chat";
import * as TribeConfig from "./tribe-config";
import seedrandom from "seedrandom";
import * as UI from "./ui";
import * as TribeCountdown from "./tribe-countdown";
import * as TestLogic from "./test-logic";
import * as TribeBars from "./tribe-bars";
import * as TribeResults from "./tribe-results";
import * as TribeUserList from "./tribe-user-list";
import * as TribeButtons from "./tribe-buttons";
import * as TribeStartRacePopup from "./tribe-start-race-popup";
import * as TribeChartController from "./tribe-chart-controller";
import * as TribeDelta from "./tribe-delta";

export const socket = io(
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://tribe.monkeytype.com",
  {
    // socket: io("http://localhost:3000", {
    autoConnect: false,
    secure: true,
    reconnectionAttempts: 0,
    reconnection: false,
  }
);
export let state = -1;
export let expectedVersion = "0.10.3";

let autoJoin = undefined;
let name = undefined;

export let room = undefined;

export function setAutoJoin(code) {
  autoJoin = code;
}

export function getSelf() {
  return room?.users[socket?.id];
}

export function getStateString(state) {
  if (state === -1) return "error";
  if (state === 1) return "connected";
  if (state === 5) return "lobby";
  if (state === 10) return "preparing race";
  if (state === 11) return "race countdown";
  if (state === 12) return "race active";
  if (state === 20) return "at least one finished";
  if (state === 21) return "everyone finished";
  if (state === 22) return "everyone ready / timer over";
  return state;
}

export function updateState(newState) {
  if (room) room.state = newState;
  state = newState;
  $("#tribeStateDisplay").text(`${state} - ${getStateString(state)}`);

  if (state === 5) {
    TribePageLobby.enableNameVisibilityButtons();
  } else if (state === 10) {
    TribeButtons.disableStartButton("lobby");
    TribeButtons.disableReadyButton("lobby");
    TribePageLobby.disableConfigButtons();
    TribePageLobby.disableNameVisibilityButtons();
    if (getSelf().isReady || getSelf().isLeader)
      Notifications.add("Race is starting...", 1, undefined, "Tribe");
  } else if (state === 11) {
    Object.keys(room.users).forEach((userId) => {
      let u = room.users[userId];
      delete u.result;
      delete u.progress;
      delete u.isFinished;
      delete u.isTyping;
      if ((u.isReady || u.isLeader) && !u.isAfk) {
        u.isTyping = true;
        u.isFinished = false;
      }
    });
    TribeUserList.update("lobby");
    TribeChartController.destroyAllCharts();
  } else if (state === 12) {
    Object.keys(room.users).forEach((userId) => {
      let u = room.users[userId];
      if (u.isReady) {
        u.isReady = false;
      }
    });
  } else if (state === 20) {
    if (TestLogic.active) {
      TribeCountdown.update("");
      TribeCountdown.show(true);
    } else {
      TribeResults.updateTimerText("Time left for everyone to finish");
    }
  } else if (state === 21) {
    TribeResults.hideTimer();
    TribeResults.updateTimerText("Time left for everyone to get ready");
  } else if (state === 22) {
    TribePageLobby.enableNameVisibilityButtons();
    TribePageLobby.enableConfigButtons();
    TribeButtons.update();
  }
}

export async function init() {
  TribePagePreloader.updateIcon("circle-notch", true);
  // TribePagePreloader.updateText("Waiting for login");
  // await AccountController.authPromise;
  TribePagePreloader.updateText("Connecting to Tribe");
  TribePagePreloader.hideReconnectButton();
  setTimeout(() => {
    socket.connect();
  }, 500);
}

async function reset() {
  $("#result #tribeResultBottom").addClass("hidden");
  TribeUserList.reset();
  TribeResults.reset();
  TribeChat.reset();
  TribeBars.hide();
  TribePageLobby.reset();
  TribeBars.reset();
  TribeButtons.reset();
}

export function joinRoom(roomId, fromBrowser = false) {
  if (!/^[a-f0-9]{6}$/i.test(roomId)) {
    Notifications.add("Incorrect room code format", 0);
    return;
  }
  socket.emit("room_join", { roomId, fromBrowser }, (res) => {
    if (res.room) {
      room = res.room;
      updateState(res.room.state);
      TribePageLobby.init();
      TribePages.change("lobby");
      TribeSound.play("join");
    } else {
      TribePages.change("menu");
      history.replaceState("/tribe", null, "/tribe");
    }
  });
}

export function initRace() {
  let everyoneReady = true;
  Object.keys(room.users).forEach((userId) => {
    if (room.users[userId].isLeader || room.users[userId].isAfk) return;
    if (!room.users[userId].isReady) {
      everyoneReady = false;
    }
  });
  if (everyoneReady) {
    socket.emit("room_init_race");
  } else {
    TribeStartRacePopup.show();
  }
}

socket.on("connect", async (e) => {
  let versionCheck = await new Promise((resolve, reject) => {
    socket.emit(
      "system_version_check",
      { version: expectedVersion },
      (response) => {
        if (response.status !== "ok") {
          socket.disconnect();
          TribePagePreloader.updateIcon("exclamation-triangle");
          TribePagePreloader.updateText(
            `Version mismatch.<br>Try refreshing or clearing cache.<br><br>Client version: ${expectedVersion}<br>Server version: ${response.version}`,
            true
          );
          resolve(false);
        } else {
          resolve(true);
        }
      }
    );
  });
  if (!versionCheck) return;
  UpdateConfig.setTimerStyle("mini", true);
  TribePageMenu.enableButtons();
  updateState(1);
  // Notifications.add("Connected", 1, undefined, "Tribe");
  name = "Guest";
  let snapName = DB.getSnapshot()?.name;
  if (snapName !== undefined) {
    name = snapName;
  }
  socket.emit("user_set_name", { name });
  if (autoJoin) {
    TribePagePreloader.updateText(`Joining room ${autoJoin}`);
    setTimeout(() => {
      joinRoom(autoJoin);
    }, 500);
  } else {
    TribePages.change("menu");
  }
  // setName(name);
  // changeActiveSubpage("prelobby");
});

// socket.on("user_update_name", e => {
//   name = e.name;
// })

socket.on("disconnect", (e) => {
  updateState(-1);
  if (!$(".pageTribe").hasClass("active"))
    Notifications.add("Disconnected", -1, undefined, "Tribe");
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Disconnected");
  TribePagePreloader.showReconnectButton();
  reset();
});

socket.on("connect_failed", (e) => {
  updateState(-1);
  console.error(e);
  if (!$(".pageTribe").hasClass("active"))
    Notifications.add("Connection failed", -1, undefined, "Tribe");
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Connection failed");
  TribePagePreloader.showReconnectButton();
  reset();
});

socket.on("connect_error", (e) => {
  updateState(-1);
  console.error(e);
  if (!$(".pageTribe").hasClass("active"))
    Notifications.add("Connection error", -1, undefined, "Tribe");
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Connection error");
  TribePagePreloader.showReconnectButton();
  reset();
});

socket.on("system_message", (e) => {
  Notifications.add(e.message, e.level ?? 0, undefined, "Tribe");
});

socket.on("room_joined", (e) => {
  room = e.room;
  updateState(5);
  TribePageLobby.init();
  TribePages.change("lobby");
  TribeSound.play("join");
});

socket.on("room_player_joined", (e) => {
  room.users[e.user.id] = e.user;
  room.size = Object.keys(room.users).length;
  TribeUserList.update("lobby");
  TribeSound.play("join");
  // TribeButtons.update("lobby")
});

socket.on("room_player_left", (e) => {
  delete room.users[e.userId];
  room.size = Object.keys(room.users).length;
  TribeUserList.update();
  TribeSound.play("leave");
  TribeButtons.update();
});

socket.on("room_left", (e) => {
  room = undefined;
  updateState(1);
  TribePageMenu.enableButtons();
  if (!$(".pageTribe").hasClass("active")) {
    UI.changePage("tribe");
  }
  TribeSound.play("leave");
  TribePages.change("menu").then(() => {
    reset();
  });
});

socket.on("room_visibility_changed", (e) => {
  room.isPrivate = e.isPrivate;
  TribePageLobby.updateVisibility();
});

socket.on("room_name_changed", (e) => {
  room.name = e.name;
  TribePageLobby.updateRoomName();
});

socket.on("room_user_is_ready", (e) => {
  room.users[e.userId].isReady = true;
  TribeUserList.update();
  TribeButtons.update();
  if (getSelf().isLeader) {
    let everyoneReady = true;
    Object.keys(room.users).forEach((userId) => {
      if (room.users[userId].isLeader || room.users[userId].isAfk) return;
      if (!room.users[userId].isReady) {
        everyoneReady = false;
      }
    });
    if (everyoneReady) {
      Notifications.add("Everyone is ready", 1, undefined, "Tribe");
      TribeSound.play("chat_mention");
    }
  }
});

socket.on("room_user_afk_update", (e) => {
  room.users[e.userId].isAfk = e.isAfk;
  TribeUserList.update();
  TribeButtons.update();
});

socket.on("room_leader_changed", (e) => {
  Object.keys(room.users).forEach((userId) => {
    delete room.users[userId].isLeader;
  });
  room.users[e.userId].isLeader = true;
  room.users[e.userId].isAfk = false;
  room.users[e.userId].isReady = false;
  TribeUserList.update();
  TribeButtons.update();
  TribePageLobby.updateVisibility();
  TribePageLobby.updateRoomName();
});

socket.on("room_chatting_changed", (e) => {
  room.users[e.userId].isChatting = e.isChatting;
  TribeChat.updateIsTyping();
});

socket.on("chat_message", async (data) => {
  data.message = data.message.trim();
  let nameregex;
  if (data.isLeader) {
    nameregex = new RegExp(
      ` @${name.replace(/[.()]/g, "\\$&")} |^@${name.replace(
        /[.()]/g,
        "\\$&"
      )}$|ready|@everyone`,
      "i"
    );
  } else {
    nameregex = new RegExp(
      ` @${name.replace(/[.()]/g, "\\$&")} |^@${name.replace(
        /[.()]/g,
        "\\$&"
      )}$`,
      "i"
    );
  }
  if (!data.isSystem && data.from.id != socket.id) {
    if (nameregex.test(data.message)) {
      TribeSound.play("chat_mention");
      data.message = data.message.replace(
        nameregex,
        "<span class='mention'>$&</span>"
      );
    } else {
      TribeSound.play("chat");
    }
  }

  TribeChat.appendMessage(data);
});

socket.on("room_config_changed", (e) => {
  room.config = e.config;
  Object.keys(room.users).forEach((userId) => {
    if (room.users[userId].isReady) {
      room.users[userId].isReady = false;
    }
  });
  TribeConfig.apply(e.config);
  TribePageLobby.updateRoomConfig();
  TribeButtons.update();
  TribeConfig.setLoadingIndicator(false);
  TribeUserList.update();
});

socket.on("room_init_race", (e) => {
  updateState(11);
  if (getSelf().isTyping) {
    TribeResults.init("result");
    TribeBars.init("test");
    TribeBars.show("test");
  } else {
    //TODO update lobby bars
    TribeBars.init("tribe");
    TribeBars.show("tribe");
    if (!$(".pageTest").hasClass("hidden")) {
      UI.changePage("tribe", undefined, true);
    }
    return;
  }
  seedrandom(e.seed, { global: true });
  console.log(`seed: ${e.seed}`);
  console.log(`random: ${Math.random()}`);
  UI.changePage("test", false, true);
  TribeCountdown.show();
  TribeSound.play("start");
});

socket.on("room_state_changed", (e) => {
  updateState(e.state);
});

socket.on("room_countdown", (e) => {
  TribeCountdown.update(e.time);
  if (e.time <= 3) TribeSound.play("cd");
});

socket.on("room_users_update", (e) => {
  Object.keys(e).forEach((userId) => {
    let user = e[userId];
    if (user.isTyping !== undefined)
      room.users[userId].isTyping = user.isTyping;
    if (user.isAfk !== undefined) room.users[userId].isAfk = user.isAfk;
    if (user.isReady !== undefined) room.users[userId].isReady = user.isReady;
  });
  TribeUserList.update("lobby");
  TribeUserList.update("result");
  TribeButtons.update("lobby");
});

socket.on("room_race_started", (e) => {
  updateState(12);
  if (!getSelf().isTyping) return;
  TribeSound.play("cd_go");
  TribeCountdown.hide();
  setTimeout(() => {
    if (!TestLogic.active) {
      TestLogic.startTest();
    }
  }, 500);
});

socket.on("room_progress_update", (e) => {
  room.maxWpm = e.roomMaxWpm;
  room.maxRaw = e.roomMaxRaw;
  room.users[e.userId].progress = e.progress;
  if (e.userId == socket.id) {
    TribeDelta.update();
  }
  //todo only update one
  TribeBars.update("test", e.userId);
  TribeBars.update("tribe", e.userId);
  TribeResults.updateBar("result", e.userId);
});

socket.on("room_user_result", (e) => {
  room.users[e.userId].result = e.result;
  room.users[e.userId].isFinished = true;
  room.users[e.userId].isTyping = false;
  let resolve = e.result.resolve;
  if (
    resolve?.afk ||
    resolve?.repeated ||
    resolve?.valid === false ||
    resolve?.saved === false
  ) {
    //todo only one
    TribeBars.fadeUser("test", e.userId);
    TribeBars.fadeUser("tribe", e.userId);
    TribeResults.fadeUser("result", e.userId);
  } else {
    if (resolve?.failed !== true) {
      //todo only one
      TribeBars.completeBar("test", e.userId);
      TribeBars.completeBar("tribe", e.userId);
      TribeResults.updateBar("result", e.userId, 100);
    }
  }
  if (!TestLogic.active) {
    TribeResults.update("result", e.userId);
    TribeUserList.update("result");
    setTimeout(async () => {
      if (e.everybodyCompleted) {
        await TribeChartController.drawAllCharts();
      } else {
        await TribeChartController.drawChart(e.userId);
      }
      if (state === 21) {
        TribeChartController.updateChartMaxValues();
      }
    }, 250);
  }
});

socket.on("room_finishTimer_countdown", (e) => {
  if (TestLogic.active) {
    TribeCountdown.update(e.time);
  } else {
    TribeResults.updateTimer(e.time);
  }
});

socket.on("room_finishTimer_over", (e) => {
  TribeCountdown.hide();
  TribeResults.hideTimer();
  if (TestLogic.active) {
    TestLogic.fail("out of time");
  }
});

socket.on("room_readyTimer_countdown", (e) => {
  if (TestLogic.active) {
    TribeCountdown.update(e.time);
  } else {
    TribeResults.updateTimer(e.time);
  }
});

socket.on("room_readyTimer_over", (e) => {
  TribeCountdown.hide();
  TribeResults.hideTimer();
  if (TestLogic.active) {
    TestLogic.fail("out of time");
  }
});

socket.on("room_back_to_lobby", (e) => {
  UI.changePage("tribe", false, true);
});

socket.on("room_final_positions", (e) => {
  // console.log(e);
  TribeResults.updatePositions("result", e.sorted);
  TribeResults.updateMiniCrowns("result", e.miniCrowns);
  e.sorted.forEach((user) => {
    room.users[user.id].points = user.newPoints;
  });
  TribeUserList.update();

  let isGlowing = false;
  if (
    e.miniCrowns.wpm === e.miniCrowns.raw &&
    e.miniCrowns.raw === e.miniCrowns.acc &&
    e.miniCrowns.acc === e.miniCrowns.consistency
  ) {
    isGlowing = true;
  }

  if (e.sorted[0]?.id)
    TribeResults.showCrown("result", e.sorted[0]?.id, isGlowing);

  if (e?.sorted[0]?.id === socket.id) {
    TribeSound.play("finish_win");
    if (isGlowing) {
      TribeSound.play("glow");
    }
  } else {
    TribeSound.play("finish");
  }
});
