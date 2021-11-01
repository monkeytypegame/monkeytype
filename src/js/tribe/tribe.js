import { io } from "socket.io-client";
import * as Notifications from "./notifications";
import * as UpdateConfig from "./config";
import * as DB from "./db";
import * as TribePages from "./tribe-pages";
import * as AccountController from "./account-controller";
import "./tribe-prelobby";

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

export function setAutoJoin(code) {
  autoJoin = code;
}

export async function init() {
  $(".pageTribe .tribePage.preloader .icon").html(
    `<i class="fas fa-fw fa-spin fa-circle-notch"></i>`
  );
  $(".pageTribe .tribePage.preloader .text").text("Waiting for login");

  await AccountController.authPromise;

  $(".pageTribe .tribePage.preloader .text").text("Connecting to Tribe");

  setTimeout(() => {
    socket.connect();
  }, 500);
}

$(".pageTribe .tribePage.preloader .reconnectButton").click((e) => {
  $(".pageTribe .tribePage.preloader .reconnectButton").addClass(`hidden`);
  init();
});

socket.on("connect", async (e) => {
  let versionCheck = await new Promise((resolve, reject) => {
    socket.emit(
      "system_version_check",
      { version: expectedVersion },
      (response) => {
        if (response.status !== "ok") {
          socket.disconnect();
          $(".pageTribe .tribePage.preloader .icon").html(
            `<i class="fas fa-exclamation-triangle"></i>`
          );
          $(".pageTribe .tribePage.preloader .text").html(
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
  Notifications.add("Connected", 1, undefined, "Tribe");
  let name = "Guest";
  let snapName = DB.getSnapshot().name;
  if (snapName !== null) {
    name = snapName;
  }
  socket.emit("user_set_name", { name });
  TribePages.change("prelobby");
  // setName(name);
  // changeActiveSubpage("prelobby");
});

socket.on("disconnect", (e) => {
  state = -1;
  TribePages.change("preloader");
  $(".pageTribe .tribePage.preloader .icon").html(
    `<i class="fas fa-fw fa-times"></i>`
  );
  $(".pageTribe .tribePage.preloader .text").text(`Disconnected`);
  $(".pageTribe .tribePage.preloader .reconnectButton").removeClass(`hidden`);
});

socket.on("connect_failed", (e) => {
  state = -1;
  console.error(e);
  TribePages.change("preloader");
  $(".pageTribe .tribePage.preloader .icon").html(
    `<i class="fas fa-fw fa-times"></i>`
  );
  $(".pageTribe .tribePage.preloader .text").text(`Connection failed`);
  $(".pageTribe .tribePage.preloader .reconnectButton").removeClass(`hidden`);
});

socket.on("connect_error", (e) => {
  state = -1;
  console.error(e);
  TribePages.change("preloader");
  $(".pageTribe .tribePage.preloader .icon").html(
    `<i class="fas fa-fw fa-times"></i>`
  );
  $(".pageTribe .tribePage.preloader .text").text(`Connection error`);
  $(".pageTribe .tribePage.preloader .reconnectButton").removeClass(`hidden`);
});
