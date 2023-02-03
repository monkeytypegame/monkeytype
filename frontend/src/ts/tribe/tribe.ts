import * as Notifications from "../elements/notifications";
import * as UpdateConfig from "../config";
import * as DB from "../db";
import * as TribePages from "./tribe-pages";
import * as TribePagePreloader from "./pages/tribe-page-preloader";
import * as TribePageMenu from "./pages/tribe-page-menu";
import * as TribePageLobby from "./pages/tribe-page-lobby";
import * as TribeSound from "./tribe-sound";
import * as TribeChat from "./tribe-chat";
import * as TribeConfig from "./tribe-config";
import * as TribeCountdown from "./tribe-countdown";
import * as TestLogic from "../test/test-logic";
import * as TribeBars from "./tribe-bars";
import * as TribeResults from "./tribe-results";
import * as TribeUserList from "./tribe-user-list";
import * as TribeButtons from "./tribe-buttons";
import * as TribeStartRacePopup from "../popups/tribe-start-race-popup";
import * as TribeChartController from "./tribe-chart-controller";
import * as TribeDelta from "./tribe-delta";
import * as TestActive from "../states/test-active";
import { navigate } from "../observables/navigate-event";
import * as Random from "../utils/random";
import TribeSocket from "./tribe-socket";
import * as ActivePage from "../states/active-page";
import { escapeRegExp, escapeHTML } from "../utils/misc";

const defaultName = "Guest";
let name = "Guest";

export let state = -1;
export const expectedVersion = "0.11.4";

let autoJoin: string | undefined = undefined;

export let room: TribeTypes.Room | undefined = undefined;

export function setAutoJoin(code: string): void {
  autoJoin = code;
}

export function getSelf(): TribeTypes.User | undefined {
  return room?.users?.[TribeSocket.getId()];
}

export function applyRandomSeed(): void {
  Random.setSeed(room?.seed.toString() ?? "");
}

export function getStateString(state: number): string {
  if (state === -1) return "error";
  if (state === 1) return "connected";
  if (state === 5) return "lobby";
  if (state === 10) return "preparing race";
  if (state === 11) return "race countdown";
  if (state === 12) return "race active";
  if (state === 20) return "at least one finished";
  if (state === 21) return "everyone finished";
  if (state === 22) return "everyone ready / timer over";
  return "Unknown state " + state;
}

function updateState(newState: number): void {
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
    const self = getSelf();
    if (self && (self.isReady || self.isLeader)) {
      Notifications.add("Race is starting...", 1, undefined, "Tribe");
    }
  } else if (state === 11) {
    if (room?.users) {
      for (const user of Object.values(room.users)) {
        delete user.result;
        delete user.progress;
        delete user.isFinished;
        delete user.isTyping;
        if ((user.isReady || user.isLeader) && !user.isAfk) {
          user.isTyping = true;
          user.isFinished = false;
        }
      }
    }
    $("#tribeMiniChartCustomTooltip").remove();
    TribeUserList.update("lobby");
    TribeChartController.destroyAllCharts();
  } else if (state === 12) {
    if (room?.users) {
      for (const user of Object.values(room.users)) {
        if (user.isReady) {
          user.isReady = false;
        }
      }
    }
  } else if (state === 20) {
    if (TestActive.get()) {
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

export async function init(): Promise<void> {
  TribePagePreloader.updateIcon("circle-notch", true);
  // TribePagePreloader.updateText("Waiting for login");
  // await AccountController.authPromise;
  TribePagePreloader.updateText("Connecting to Tribe");
  TribePagePreloader.hideReconnectButton();

  const snapName = DB.getSnapshot()?.name;
  if (snapName !== undefined) {
    name = snapName;
    TribeSocket.updateName(name);
  }

  setTimeout(() => {
    TribeSocket.connect();
  }, 500);
}

async function reset(): Promise<void> {
  $("#result #tribeResultBottom").addClass("hidden");
  TribeUserList.reset();
  TribeResults.reset();
  TribeChat.reset();
  TribeBars.hide();
  TribePageLobby.reset();
  TribeBars.reset();
  TribeButtons.reset();
}

export function joinRoom(roomId: string, fromBrowser = false): void {
  if (!/^[a-f0-9]{6}$/i.test(roomId)) {
    Notifications.add("Incorrect room code format", 0);
    return;
  }

  TribeSocket.out.room.join(roomId, fromBrowser).then((response) => {
    if (response.room) {
      room = response.room;
      updateState(response.room.state);
      TribePageLobby.init();
      TribePages.change("lobby");
      TribeSound.play("join");
      // history.replaceState(null, "", `/tribe/${roomId}`);
    } else {
      TribePages.change("menu");
      history.replaceState("/tribe", "", "/tribe");
    }
  });
}

export function initRace(): void {
  let everyoneReady = true;
  if (room?.users) {
    for (const user of Object.values(room.users)) {
      if (user.isLeader || user.isAfk) continue;
      if (!user.isReady) {
        everyoneReady = false;
      }
    }
  }
  if (everyoneReady) {
    TribeSocket.out.room.init();
  } else {
    TribeStartRacePopup.show();
  }
}

async function connect(): Promise<void> {
  const versionCheck = await TribeSocket.out.system.versionCheck(
    expectedVersion
  );

  if (versionCheck.status !== "ok") {
    TribeSocket.disconnect();
    TribePagePreloader.updateIcon("exclamation-triangle");
    TribePagePreloader.updateText(
      `Version mismatch.<br>Try refreshing or clearing cache.<br><br>Client version: ${expectedVersion}<br>Server version: ${versionCheck.version}`,
      true
    );
    return;
  }

  UpdateConfig.setTimerStyle("mini", true);
  TribePageMenu.enableButtons();
  updateState(1);
  if (autoJoin) {
    TribePagePreloader.updateText(`Joining room ${autoJoin}`);
    setTimeout(() => {
      joinRoom(autoJoin as string);
    }, 500);
  } else {
    TribePages.change("menu");
  }
}

function checkIfEveryoneIsReady(): void {
  if (!room) return;
  if (getSelf()?.isLeader) {
    if (Object.keys(room.users).length <= 1) return;
    let everyoneReady = true;
    Object.keys(room.users).forEach((userId) => {
      if (room && (room.users[userId].isLeader || room.users[userId].isAfk)) {
        return;
      }
      if (room && !room.users[userId].isReady) {
        everyoneReady = false;
      }
    });
    if (everyoneReady) {
      Notifications.add("Everyone is ready", 1, undefined, "Tribe");
      TribeSound.play("chat_mention");
    }
  }
}

TribeSocket.in.system.connect(() => {
  connect();
});

$(".tribechangename").on("click", () => {
  const name = prompt("Name");
  if (name) {
    TribeSocket.out.user.setName(name, true);
  }
});

TribeSocket.in.user.updateName((e) => {
  name = e.name;
});

TribeSocket.in.system.disconnect(() => {
  updateState(-1);
  if (!$(".pageTribe").hasClass("active")) {
    Notifications.add("Disconnected", -1, undefined, "Tribe");
  }
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Disconnected");
  TribePagePreloader.showReconnectButton();
  reset();
});
TribeSocket.in.system.connectFailed((err) => {
  updateState(-1);
  console.error(err);
  if (!$(".pageTribe").hasClass("active")) {
    Notifications.add("Connection failed", -1, undefined, "Tribe");
  }
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Connection failed");
  TribePagePreloader.showReconnectButton();
  reset();
});

TribeSocket.in.system.connectError((err) => {
  updateState(-1);
  console.error(err);
  if (!$(".pageTribe").hasClass("active")) {
    Notifications.add("Connection error", -1, undefined, "Tribe");
  }
  TribePages.change("preloader");
  TribePagePreloader.updateIcon("times");
  TribePagePreloader.updateText("Connection error");
  TribePagePreloader.showReconnectButton();
  reset();
});

TribeSocket.in.system.notification((data) => {
  Notifications.add(data.message, data.level ?? 0, undefined, "Tribe");
});

TribeSocket.in.room.joined((data) => {
  room = data.room;
  updateState(data.room.state);
  TribePageLobby.init();
  TribePages.change("lobby");
  TribeSound.play("join");
  // history.replaceState(null, "", `/tribe/${e.room.id}`);
});

TribeSocket.in.room.playerJoined((data) => {
  if (room?.users) {
    room.users[data.user.id] = data.user;
    room.size = Object.keys(room.users).length;
    TribeUserList.update();
    TribeSound.play("join");
    // TribeButtons.update("lobby")
  }
});

TribeSocket.in.room.playerLeft((data) => {
  if (room?.users) {
    delete room.users[data.userId];
    room.size = Object.keys(room.users).length;
    TribeUserList.update();
    TribeSound.play("leave");
    TribeButtons.update();
    TribeBars.fadeUser(undefined, data.userId);
    TribeResults.fadeUser("result", data.userId);
    TribeResults.update("result", data.userId);
    checkIfEveryoneIsReady();
  }
});

TribeSocket.in.room.left(() => {
  room = undefined;
  updateState(1);
  TribePageMenu.enableButtons();
  if (!$(".pageTribe").hasClass("active")) {
    navigate("/tribe");
  }
  TribeSound.play("leave");
  TribePages.change("menu").then(() => {
    reset();
  });
  name = defaultName;
});

TribeSocket.in.room.visibilityChanged((data) => {
  if (!room) return;
  room.isPrivate = data.isPrivate;
  TribePageLobby.updateVisibility();
});

TribeSocket.in.room.nameChanged((data) => {
  if (!room) return;
  room.name = data.name;
  TribePageLobby.updateRoomName();
});

TribeSocket.in.room.userIsReady((data) => {
  if (!room) return;
  room.users[data.userId].isReady = true;
  TribeUserList.update();
  TribeButtons.update();
  checkIfEveryoneIsReady();
});

TribeSocket.in.room.userAfkUpdate((data) => {
  if (!room) return;
  room.users[data.userId].isAfk = data.isAfk;
  TribeUserList.update();
  TribeButtons.update();
});

TribeSocket.in.room.leaderChanged((data) => {
  if (!room) return;
  for (const userId of Object.keys(room.users)) {
    delete room.users[userId].isLeader;
  }
  room.users[data.userId].isLeader = true;
  room.users[data.userId].isAfk = false;
  room.users[data.userId].isReady = false;
  TribeUserList.update();
  TribeButtons.update();
  TribePageLobby.updateVisibility();
  TribePageLobby.updateRoomName();
});

TribeSocket.in.room.chattingChanged((data) => {
  if (!room) return;
  room.users[data.userId].isChatting = data.isChatting;
  TribeChat.updateIsTyping();
});

TribeSocket.in.room.chatMessage((data) => {
  data.message = data.message.trim();
  const regexString = `&#64;${escapeRegExp(escapeHTML(name))}${
    data.from?.isLeader ? "|ready|&#64;everyone" : ""
  }`;
  const nameregex = new RegExp(regexString, "i");
  if (!data.isSystem && data.from.id != TribeSocket.getId()) {
    if (nameregex.test(data.message)) {
      if (ActivePage.get() !== "tribe") {
        Notifications.add(data.message, 0, 3, "Mention", "at", undefined, true); //allowing html because the message is already escaped on the server
      }
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

// socket.on("room_config_changed", (e) => {
TribeSocket.in.room.configChanged((data) => {
  if (!room) return;
  room.config = data.config;
  for (const user of Object.values(room.users)) {
    if (user.isReady) {
      user.isReady = false;
    }
  }
  TribeConfig.apply(data.config);
  TribePageLobby.updateRoomConfig();
  TribeButtons.update();
  TribeConfig.setLoadingIndicator(false);
  TribeUserList.update();
});

// socket.on("room_init_race", (e) => {
TribeSocket.in.room.initRace((data) => {
  updateState(11);
  if (getSelf()?.isTyping) {
    TribeResults.init("result");
    TribeBars.init("test");
    TribeBars.show("test");
  } else {
    //TODO update lobby bars
    TribeBars.init("tribe");
    TribeBars.show("tribe");
    if (!$(".pageTest").hasClass("hidden")) {
      navigate("/tribe");
    }
    return;
  }
  if (room) room.seed = data.seed;
  applyRandomSeed();
  navigate("/", {
    tribeOverride: true,
    force: true,
  });
  TribeCountdown.show();
  TribeSound.play("start");
});

TribeSocket.in.room.stateChanged((data) => {
  updateState(data.state);
});

TribeSocket.in.room.countdown((data) => {
  TribeCountdown.update(data.time.toString());
  if (data.time <= 3) TribeSound.play("cd");
});

TribeSocket.in.room.usersUpdate((data) => {
  if (!room) return;

  for (const [userId, user] of Object.entries(data)) {
    if (user.isTyping !== undefined) {
      room.users[userId].isTyping = user.isTyping;
    }
    if (user.isAfk !== undefined) room.users[userId].isAfk = user.isAfk;
    if (user.isReady !== undefined) room.users[userId].isReady = user.isReady;
  }
  TribeUserList.update("lobby");
  TribeUserList.update("result");
  TribeButtons.update("lobby");
});

TribeSocket.in.room.raceStarted(() => {
  updateState(12);
  if (!getSelf()?.isTyping) return;
  TribeSound.play("cd_go");
  TribeCountdown.hide();
  setTimeout(() => {
    if (!TestActive.get()) {
      TestLogic.startTest();
    }
  }, 500);
});

// socket.on("room_progress_update", (e) => {
TribeSocket.in.room.progressUpdate((data) => {
  if (!room) return;
  room.maxWpm = data.roomMaxWpm;
  room.maxRaw = data.roomMaxRaw;
  room.users[data.userId].progress = data.progress;
  if (data.userId == TribeSocket.getId()) {
    TribeDelta.update();
  }
  //todo only update one
  TribeBars.update("test", data.userId);
  TribeBars.update("tribe", data.userId);
  TribeResults.updateBar("result", data.userId);
});

// socket.on("room_user_result", (e) => {
TribeSocket.in.room.userResult((data) => {
  if (!room) return;
  room.users[data.userId].result = data.result;
  room.users[data.userId].isFinished = true;
  room.users[data.userId].isTyping = false;
  const resolve = data.result.resolve;
  if (
    resolve?.afk ||
    resolve?.repeated ||
    resolve?.valid === false ||
    resolve?.saved === false ||
    (resolve?.failed === true && room.config.isInfiniteTest === false)
  ) {
    //todo only one
    TribeBars.fadeUser("test", data.userId);
    TribeBars.fadeUser("tribe", data.userId);
    TribeResults.fadeUser("result", data.userId);
  } else {
    TribeBars.completeBar("test", data.userId);
    TribeBars.completeBar("tribe", data.userId);
    TribeResults.updateBar("result", data.userId, 100);
  }
  if (!TestActive.get()) {
    TribeResults.update("result", data.userId);
    TribeUserList.update("result");
    setTimeout(async () => {
      if (data.everybodyCompleted) {
        await TribeChartController.drawAllCharts();
      } else {
        await TribeChartController.drawChart(data.userId);
      }
      if (state === 21) {
        TribeChartController.updateChartMaxValues();
      }
    }, 250);
  }
});

TribeSocket.in.room.finishTimerCountdown((data) => {
  if (TestActive.get()) {
    TribeCountdown.update(data.time.toString());
  } else {
    TribeResults.updateTimer(data.time.toString());
  }
});

TribeSocket.in.room.finishTimerOver(() => {
  TribeCountdown.hide();
  TribeResults.hideTimer();
  if (TestActive.get()) {
    TestLogic.fail("out of time");
  }
});

TribeSocket.in.room.readyTimerCountdown((data) => {
  if (TestActive.get()) {
    TribeCountdown.update(data.time.toString());
  } else {
    TribeResults.updateTimer(data.time.toString());
  }
});

TribeSocket.in.room.readyTimerOver(() => {
  TribeCountdown.hide();
  TribeResults.hideTimer();
  if (TestActive.get()) {
    TestLogic.fail("out of time");
  }
});

TribeSocket.in.room.backToLobby(() => {
  navigate("/tribe");
});

TribeSocket.in.room.finalPositions((data) => {
  if (!room) return;
  TribeResults.updatePositions("result", data.sorted);
  TribeResults.updateMiniCrowns("result", data.miniCrowns);
  for (const user of Object.values(data.sorted)) {
    room.users[user.id].points = user.newPoints;
  }
  TribeUserList.update();

  let isGlowing = false;
  if (
    data.miniCrowns.wpm === data.miniCrowns.raw &&
    data.miniCrowns.raw === data.miniCrowns.acc &&
    data.miniCrowns.acc === data.miniCrowns.consistency
  ) {
    isGlowing = true;
  }

  if (data.sorted[0]?.id) {
    TribeResults.showCrown("result", data.sorted[0]?.id, isGlowing);
  }

  if (data?.sorted[0]?.id === TribeSocket.getId()) {
    TribeSound.play("finish_win");
    if (isGlowing) {
      TribeSound.play("glow");
    }
  } else {
    TribeSound.play("finish");
  }
});
