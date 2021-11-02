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
  socket.emit("room_join", { roomId }, (res) => {
    if (res.room) {
      room = res.room;
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
  TribePageLobby.init();
  TribePages.change("lobby");
  TribeSound.play("join");
});

socket.on("room_player_joined", (e) => {
  room.users[e.user.id] = e.user;
  TribePageLobby.updatePlayerList();
  TribeSound.play("join");
});

socket.on("room_player_left", (e) => {
  delete room.users[e.userId];
  TribePageLobby.updatePlayerList();
  TribeSound.play("leave");
});

socket.on("room_left", (e) => {
  room = undefined;
  TribePageMenu.enableButtons();
  TribePageLobby.reset();
  TribePages.change("menu");
  TribeSound.play("leave");
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
