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
export let expectedVersion = "0.9.12";

let autoJoin = undefined;
let name = undefined;

export let room = undefined;

export function setAutoJoin(code) {
  autoJoin = code;
}

export function getSelf() {
  return room?.users[socket?.id];
}

export async function init() {
  TribePagePreloader.updateIcon("circle-notch", true);
  TribePagePreloader.updateText("Waiting for login");
  await AccountController.authPromise;
  TribePagePreloader.updateText("Connecting to Tribe");
  TribePagePreloader.hideReconnectButton();
  setTimeout(() => {
    socket.connect();
  }, 500);
}

export function joinRoom(roomId) {
  if (!/^[a-f0-9]{6}$/i.test(roomId)) {
    Notifications.add("Incorrect room code format", 0);
    return;
  }
  socket.emit("room_join", { roomId }, (res) => {
    if (res.room) {
      room = res.room;
      state = res.room.state;
      TribePageLobby.init();
      TribePages.change("lobby");
      TribeSound.play("join");
    } else {
      TribePages.change("menu");
      history.replaceState("/tribe", null, "/tribe");
    }
  });
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
  state = 1;
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
  state = -1;
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Disconnected");
  TribePagePreloader.showReconnectButton();
});

socket.on("connect_failed", (e) => {
  state = -1;
  console.error(e);
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Connection failed");
  TribePagePreloader.showReconnectButton();
});

socket.on("connect_error", (e) => {
  state = -1;
  console.error(e);
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Connection error");
  TribePagePreloader.showReconnectButton();
});

socket.on("system_message", (e) => {
  Notifications.add(e.message, e.level ?? 0);
});

socket.on("room_joined", (e) => {
  room = e.room;
  state = 5;
  TribePageLobby.init();
  TribePages.change("lobby");
  TribeSound.play("join");
});

socket.on("room_player_joined", (e) => {
  room.users[e.user.id] = e.user;
  room.size = Object.keys(room.users).length;
  TribePageLobby.updatePlayerList();
  TribeSound.play("join");
  // TribePageLobby.updateButtons();
});

socket.on("room_player_left", (e) => {
  delete room.users[e.userId];
  room.size = Object.keys(room.users).length;
  TribePageLobby.updatePlayerList();
  TribeSound.play("leave");
  TribePageLobby.updateButtons();
});

socket.on("room_left", (e) => {
  room = undefined;
  state = 1;
  TribePageMenu.enableButtons();
  TribePageLobby.reset();
  TribePages.change("menu");
  TribeSound.play("leave");
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
  TribePageLobby.updatePlayerList();
  TribePageLobby.updateButtons();
  if (getSelf().isLeader) {
    let everyoneReady = true;
    Object.keys(room.users).forEach((userId) => {
      if (room.users[userId].isLeader) return;
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

socket.on("room_leader_changed", (e) => {
  Object.keys(room.users).forEach((userId) => {
    delete room.users[userId].isLeader;
  });
  room.users[e.userId].isLeader = true;
  TribePageLobby.updatePlayerList();
  TribePageLobby.updateButtons();
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
      TribeSound.play("chat2");
    }
  }

  TribeChat.appendMessage(data);
});

socket.on("room_config_changed", (e) => {
  room.config = e.config;
  TribeConfig.apply(e.config);
  TribePageLobby.updateRoomConfig();
  TribePageLobby.enableStartButton();
  TribeConfig.setLoadingIndicator(false);
});
