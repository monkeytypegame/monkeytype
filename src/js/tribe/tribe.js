import { io } from "socket.io-client";
import * as Notifications from "./notifications";
import * as UpdateConfig from "./config";
import * as DB from "./db";

const socket = io(
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://tribe.monkeytype.com",
  {
    // socket: io("http://localhost:3000", {
    autoConnect: false,
    secure: true,
    reconnectionAttempts: 0,
  }
);
export let state = -1;
export let activePage = "preloader";
export let pageTransition = false;
export let expectedVersion = "0.9.12";

let autoJoin = undefined;

export function setAutoJoin(code) {
  autoJoin = code;
}

export function init() {
  // $(".pageTribe .preloader .icon").html(
  //   `<i class="fas fa-fw fa-spin fa-circle-notch"></i>`
  // );
  // $(".pageTribe .preloader .text").text("Connecting to Tribe");
  Notifications.add("Connecting to Tribe", 0, undefined, "Tribe");
  socket.connect();
}

socket.on("connect", (e) => {
  UpdateConfig.setTimerStyle("mini", true);
  state = 1;
  Notifications.add("Connected", 1, undefined, "Tribe");
  let name = "Guest";
  let snapName = DB.getSnapshot().name;
  if (snapName !== null) {
    name = snapName;
  }
  socket.emit("user_set_name", { name });
  // setName(name);
  // changeActiveSubpage("prelobby");
});
