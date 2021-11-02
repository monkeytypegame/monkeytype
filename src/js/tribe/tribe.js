import { io } from "socket.io-client";
import * as Notifications from "./notifications";
import * as UpdateConfig from "./config";
import * as DB from "./db";
import * as TribePages from "./tribe-pages";
import * as TribePagePreloader from "./tribe-page-preloader";
import * as AccountController from "./account-controller";
import * as TribePageMenu from "./tribe-page-menu";

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

let room = undefined;

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
            `Version mismatch.<br>Try refreshing or clearing cache.<br><br>Client version: ${expectedVersion}<br>Server version: ${response.version}`
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
  state = 1;
  // Notifications.add("Connected", 1, undefined, "Tribe");
  let name = "Guest";
  let snapName = DB.getSnapshot().name;
  if (snapName !== null) {
    name = snapName;
  }
  socket.emit("user_set_name", { name });
  TribePages.change("menu");
  TribePageMenu.enableButtons();
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
  console.log(e);
  room = e.room;
  TribePages.change("lobby");
  // Notifications.add("todo: room joined", -1);
});
