import InputSuggestions from "./input-suggestions";
import * as Matchmaking from "./matchmaking";
import TribeDefaultConfigs from "./tribe-default-configs";
import * as Misc from "./misc";
import * as UI from "./ui";
import Config, * as UpdateConfig from "./config";
import * as CustomText from "./custom-text";
import * as Notifications from "./notifications";
import * as Funbox from "./funbox";
import * as ThemeColors from "./theme-colors";
import Chart from "chart.js";
import * as TestLogic from "./test-logic";
import * as TestUI from "./test-ui";
import * as Commandline from "./commandline";
import * as CommandlineLists from "./commandline-lists";
import * as OnlineStats from "./tribe-online-stats";
import seedrandom from "seedrandom";
import * as SimplePopups from "./simple-popups";
import * as ChartController from "./chart-controller";

export let state = -1;
export let socket = io(
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
export let activePage = "preloader";
export let pageTransition = false;
export let expectedVersion = "0.9.12";

console.log("---------");
console.log("---------");
console.log("---------");
console.log(
  "different timer testing and no animation testing tribe stop lagging pls"
);
console.log(
  "tt() to start timer, tts() to get results, tribeSetNoAnim(true) to disable tribe animations"
);
console.log("---------");
console.log("---------");
console.log("---------");

let debugNoAnim = false;

export function setNoAnim(bool) {
  debugNoAnim = bool;
}

let test1 = null;
let test2 = null;

export function timerTest() {
  console.log("test timer started");
  test1 = performance.now();
  test2 = Date.now();
}

export function timerTestStop() {
  let t1 = performance.now() - test1;
  let t2 = Date.now() - test2;
  console.log(`timer test: ${t1}ms (${Math.round(t1)}ms) ${t2}ms`);
}

export let room = undefined;
export let name = undefined;
let autoJoin = undefined;

export function setAutoJoin(code) {
  autoJoin = code;
}

let shouldScrollChat = true;
let lastMessageTimestamp = 0;

let lobbySuggestions;
let resultSuggestions;

Misc.getEmojiList().then((list) => {
  lobbySuggestions = new InputSuggestions(
    $(".pageTribe .lobby .chat .input .emojiSuggestion"),
    list,
    ["test", "miodec", "vastus"]
  );
  resultSuggestions = new InputSuggestions(
    $(".pageTest #result .tribeResultChat .chat .input .emojiSuggestion"),
    list,
    []
  );
});

let tribeSounds = {
  join: new Audio("../sound/tribe_ui/join.wav"),
  leave: new Audio("../sound/tribe_ui/leave.wav"),
  start: new Audio("../sound/tribe_ui/start.wav"),
  chat1: new Audio("../sound/tribe_ui/chat1.wav"),
  chat2: new Audio("../sound/tribe_ui/chat2.wav"),
  chat_mention: new Audio("../sound/tribe_ui/chat_mention.wav"),
  finish: new Audio("../sound/tribe_ui/finish.wav"),
  finish_win: new Audio("../sound/tribe_ui/finish_win.wav"),
  glow: new Audio("../sound/tribe_ui/glow.wav"),
  cd: new Audio("../sound/tribe_ui/cd2.wav"),
  cd_go: new Audio("../sound/tribe_ui/cd_go2.wav"),
};

//-1 - disconnected
//1 - connected
//6 - looking for a public game
//7 - in a public lobby waiting to fill (not used anymore)
//8 - one second before public start
//10 - lobby
//20 - test about to start
//21 - test active
//28 - leader finished
//29 - everybody finished

export function init() {
  $(".pageTribe .preloader .icon").html(
    `<i class="fas fa-fw fa-spin fa-circle-notch"></i>`
  );
  $(".pageTribe .preloader .text").text("Connecting to Tribe");
  socket.connect();
}

function changeActiveSubpage(newPage) {
  if (pageTransition) return;
  if (newPage === activePage) return;
  pageTransition = true;

  UI.swapElements(
    $(`.pageTribe .${activePage}`),
    $(`.pageTribe .${newPage}`),
    250,
    () => {
      pageTransition = false;
      activePage = newPage;
      if (newPage === "prelobby") {
        OnlineStats.refresh();
      }
      if (newPage === "lobby") {
        $(".pageTribe .lobby .chat .input input").focus();
      }
    }
  );
}

function refreshUserList() {
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTest #result .tribeResultChat .userlist .list").empty();
  let usersArray = [];
  let names = [];
  Object.keys(room.users).forEach((sid) => {
    let u = room.users[sid];
    u.sid = sid;
    if (sid !== socket.id) {
      names.push(u.name);
    }
    usersArray.push(u);
  });
  lobbySuggestions.setNameList(names);
  resultSuggestions.setNameList(names);
  let sortedUsers = usersArray.sort((a, b) => b.points - a.points);
  sortedUsers.forEach((user) => {
    let icons = "";
    if (user.isLeader) {
      if (user.sid === socket.id) {
        room.isLeader = true;
      }

      icons += `<div class="icon active"><i class="fas fa-fw fa-star"></i></div>`;
    } else {
      icons += `<div class="icon ${
        user.isReady ? "active" : ""
      }"><i class="fas fa-fw fa-check"></i></div>`;
    }
    icons += `<div class="icon ${
      user.isTyping ? "active" : ""
    }"><i class="fas fa-fw fa-keyboard"></i></div>`;
    let pointsString;
    if (user.points == undefined) {
      pointsString = "";
    } else {
      pointsString = user.points + (user.points == 1 ? "pt" : "pts");
    }
    $(".pageTribe .lobby .userlist .list").append(`
    <div class='user ${user.sid === socket.id ? "me" : ""}'>
    <div class="nameAndIcons">
      <div class='icons'>
      ${icons}
      </div>
      <div class='name'>
      ${user.name}
      </div>
      ${
        room.isLeader && user.sid !== socket.id
          ? `<div class='userSettings' sid='` +
            user.sid +
            `' aria-label="User settings" data-balloon-pos="up"><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `);
    $(".pageTest #result .tribeResultChat .userlist .list").append(`
    <div class='user ${user.sid === socket.id ? "me" : ""}'>
    <div class="nameAndIcons">
      <div class='icons'>
      ${icons}
      </div>
      <div class='name'>
      ${user.name}
      </div>
      ${
        room.isLeader && user.sid !== socket.id
          ? `<div class='userSettings' sid='` +
            user.sid +
            `' aria-label="User settings" data-balloon-pos="up"><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `);
  });
}

function playSound(sound) {
  if (TestLogic.active) return;
  tribeSounds[sound].currentTime = 0;
  tribeSounds[sound].play();
}

function resetLobby() {
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTest #result .tribeResultChat .chat .messages").empty();
  $(".pageTest #result .tribeResultChat .userlist .list").empty();
  $(".pageTribe .lobby .chat .messages").empty();
  $(".pageTribe .lobby .inviteLink .code .text").text("");
  $(".pageTribe .lobby .inviteLink .link").text("");
  $(".pageTest .tribeResultChat .inviteLink .code .text").text("");
  $(".pageTest .tribeResultChat .inviteLink .link").text("");
  $("#tribeCountdownWrapper .faint").addClass("hidden");
  $("#tribeCountdownWrapper .withbg").addClass("hidden");
}

export function resetRace() {
  $(".pageTest .tribePlayers").empty().addClass("hidden");
  $(".pageTribe .lobby .tribePlayers").empty().addClass("hidden");
  hideCountdown();
  hideResultCountdown();
}

export function resetResult() {
  $(".pageTest #result .tribeResult").addClass("hidden");
  $(".pageTest #result .tribeResultChat").addClass("hidden");
  $(".pageTest #nextTestButton").removeClass("hidden");
  $(".pageTest #backToLobbyButton").addClass("hidden");
  $(".pageTest #readyButton").addClass("hidden");
  $(".pageTest #restartTestButtonWithSameWordset").removeClass("hidden");
  $(".pageTest #goBackToLobbyButton").addClass("hidden");
  $(".pageTest #practiseMissedWordsButton").removeClass("hidden");
  $(".pageTest #result .tribeResultChat").addClass("hidden");
  $(".pageTest #readyButton").addClass("hidden");
  $(".pageTest #queueAgainButton").addClass("hidden");
}

function applyRoomConfig(cfg) {
  UpdateConfig.setMode(cfg.mode, true, true);
  if (cfg.mode === "time") {
    UpdateConfig.setTimeConfig(cfg.mode2, true, true);
  } else if (cfg.mode === "words") {
    UpdateConfig.setWordCount(cfg.mode2, true, true);
  } else if (cfg.mode === "quote") {
    UpdateConfig.setQuoteLength(cfg.mode2, true, true, true);
  }
  UpdateConfig.setDifficulty(cfg.difficulty, true, true);
  UpdateConfig.setBlindMode(cfg.blindMode, true, true);
  UpdateConfig.setLanguage(cfg.language, true, true);
  Funbox.setFunbox(cfg.funbox, null, true);
  UpdateConfig.setStopOnError(cfg.stopOnError, true, true);
  UpdateConfig.setConfidenceMode(cfg.confidenceMode, true, true);
  UpdateConfig.setPunctuation(cfg.punctuation, true, true);
  UpdateConfig.setNumbers(cfg.numbers, true, true);
  if (cfg.minAcc != null) {
    UpdateConfig.setMinAccCustom(cfg.minAcc, true, true);
    UpdateConfig.setMinAcc("custom", true, true);
  } else {
    UpdateConfig.setMinAcc("off", true, true);
  }
  if (cfg.minWpm != null) {
    UpdateConfig.setMinWpmCustomSpeed(cfg.minAcc, true, true);
    UpdateConfig.setMinWpm("custom", true, true);
  } else {
    UpdateConfig.setMinWpm("off", true, true);
  }
  if (cfg.customText !== null) {
    CustomText.setText(cfg.customText.text);
    CustomText.setIsWordRandom(cfg.customText.isWordRandom);
    CustomText.setIsTimeRandom(cfg.customText.isTimeRandom);
    CustomText.setTime(cfg.customText.time);
    CustomText.setWord(cfg.customText.word);
  }
}

export function checkIfCanChangeConfig(mp) {
  if (state >= 8) {
    if (state >= 20 && state < 29) {
      if (mp) return true;
      Notifications.add("You can't change settings during the test", 0, 1);
      return false;
    } else if (room != undefined && room.isLeader) {
      return true;
    } else {
      if (mp) return true;
      if (room?.private) {
        Notifications.add("Only the leader can change this setting", 0, 1);
        return false;
      } else {
        Notifications.add("Race is about to start", 0, 1);
        return false;
      }
    }
  } else {
    return true;
  }
}

let syncConfigTimeout = null;

export function syncConfig() {
  setSettingsLoadingIndicator(true);
  if (syncConfigTimeout === null) {
    syncConfigTimeout = setTimeout(() => {
      setSettingsLoadingIndicator(false);
      let mode2;
      if (Config.mode === "time") {
        mode2 = Config.time;
      } else if (Config.mode === "words") {
        mode2 = Config.words;
      } else if (Config.mode === "quote") {
        mode2 = Config.quoteLength === undefined ? "-1" : Config.quoteLength;
      }
      socket.emit("mp_room_config_update", {
        config: {
          mode: Config.mode,
          mode2: mode2,
          difficulty: Config.difficulty,
          blindMode: Config.blindMode,
          language: Config.language,
          funbox: Funbox.active,
          stopOnError: Config.stopOnError,
          confidenceMode: Config.confidenceMode,
          customText: {
            text: CustomText.text,
            isWordRandom: CustomText.isWordRandom,
            isTimeRandom: CustomText.isTimeRandom,
            word: CustomText.word,
            time: CustomText.time,
          },
          punctuation: Config.punctuation,
          numbers: Config.numbers,
          minWpm: Config.minWpm === "custom" ? Config.minWpmCustomSpeed : null,
          minAcc: Config.minAcc === "custom" ? Config.minAccCustom : null,
        },
      });
      clearTimeout(syncConfigTimeout);
      syncConfigTimeout = null;
    }, 500);
  }
}

export function joinRoomByCode(code) {
  code = "room_" + code;
  socket.emit("mp_room_join", { roomId: code });
  $(".pageTribe .prelobby #joinByCode input").val("");

  $(".pageTribe .prelobby #joinByCode .customInput").html(`
    <span class="byte">--</span>
    /
    <span class="byte">--</span>
    /
    <span class="byte">--</span>
  `);
}

export function startTest(override = false) {
  if (syncConfigTimeout !== null) return;
  if (room.newTestCooldown) return;
  let everyoneReady = true;
  Object.keys(room.users).forEach((sid) => {
    if (
      !room.users[sid].isReady &&
      !room.users[sid].isLeader &&
      (!room.users[sid].isTyping || room.users[sid].isFinished)
    )
      everyoneReady = false;
  });
  if (!everyoneReady && !override) {
    SimplePopups.list.tribeConfirmStartTest.show();
    return;
  }
  room.isReady = true;
  socket.emit("mp_room_test_start");
}

export function sendTestProgress(wpm, raw, acc, progress) {
  if (state >= 21 && state <= 28 && TestLogic.active) {
    socket.emit("mp_room_test_progress_update", {
      stats: {
        wpm: wpm,
        raw: raw,
        acc: acc,
        progress: progress,
      },
    });
  }
}

function refreshTestUserList() {
  $(".tribePlayers").empty();
  Object.keys(room.users).forEach((sid) => {
    if (
      (room.private &&
        (room.users[sid].isTyping ||
          room.users[sid].isReady ||
          room.users[sid].isLeader)) ||
      !room.private
    ) {
      let user = room.users[sid];
      let me = "";
      if (sid === socket.id) {
        me = " me";
      }
      $(".tribePlayers").append(`
      <tr class="player ${me}" sid="${sid}">
        <td class="name">${user.name}</td>
        <td class="progress">
          <div class="barBg">
            <div class="bar" style="width: 0%;"></div>
          </div>
        </td>
        <td class="stats">
          <div class="wpm">-</div>
          <div class="acc">-</div>
        </td>
      </tr>
      `);
    }
  });
  $(".tribePlayers").removeClass("hidden");

  $(".tribeResult table tbody").empty();
  Object.keys(room.users).forEach((sid) => {
    if (
      (room.private &&
        (room.users[sid].isTyping ||
          room.users[sid].isReady ||
          room.users[sid].isLeader)) ||
      !room.private
    ) {
      let user = room.users[sid];
      let me = "";
      if (sid === socket.id) {
        me = " me";
      }
      $(".tribeResult table tbody").append(`
      <tr class="player ${me}" sid="${sid}">
        <td class="name">${user.name}</td>
        <td class="pos"><span class="num">-</span><span class="points"></span></td>
        <td class="crown"><i class="fas fa-crown" style="opacity:0"></i></td>
        <td>
          <div class="wpm">
            <div class="text">-</div>
            <div class="miniCrown"><i class="fas fa-crown"></i></div>
          </div>
          <div class="acc">
            <div class="text">-</div>
            <div class="miniCrown"><i class="fas fa-crown"></i></div>
          </div>
        </td>
        <td>
          <div class="raw">
            <div class="text">-</div>
            <div class="miniCrown"><i class="fas fa-crown"></i></div>
          </div>
          <div class="con">
            <div class="text">-</div>
            <div class="miniCrown"><i class="fas fa-crown"></i></div>
          </div>
        </td>
        <td>
          <div class="char">-</div>
          <div class="other">-</div>
        </td>
        <td class="progressAndGraph">
          <div class="progress">
            <div class="barBg">
              <div class="bar" style="width: 0%;"></div>
            </div>
          </div>
          <div class="graph hidden" style="height: 50px">
            <canvas></canvas>
          </div>
        </td>
      </tr>
      `);
    }
  });
  $(".tribeResult").removeClass("hidden");
}

function refreshConfig() {
  if (room == undefined) return;
  $(".pageTribe .lobby .currentSettings .groups").empty();

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Mode" data-balloon-pos="up" commands="commandsMode">
    <i class="fas fa-bars"></i>${room.config.mode}
    </div>
    `);

  if (room.config.mode === "time") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Time" data-balloon-pos="up" commands="commandsTimeConfig">
    <i class="fas fa-clock"></i>${room.config.mode2}
    </div>
    `);
  } else if (room.config.mode === "words") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Words" data-balloon-pos="up" commands="commandsWordCount">
    <i class="fas fa-font"></i>${room.config.mode2}
    </div>
    `);
  } else if (room.config.mode === "quote") {
    let qstring = "all";
    let num = room.config.mode2;
    if (num == 0) {
      qstring = "short";
    } else if (num == 1) {
      qstring = "medium";
    } else if (num == 2) {
      qstring = "long";
    } else if (num == 3) {
      qstring = "thicc";
    }

    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Quote length" data-balloon-pos="up" commands="commandsQuoteLengthConfig">
    <i class="fas fa-quote-right"></i>${qstring}
    </div>
    `);
  } else if (room.config.mode === "custom") {
    let t = "Custom settings:";

    t += `\ntext length: ${CustomText.text.length}`;
    if (CustomText.isTimeRandom || CustomText.isWordRandom) {
      let r = "";
      let n = "";
      if (CustomText.isTimeRandom) {
        r = "time";
        n = CustomText.time;
      } else if (CustomText.isWordRandom) {
        r = "words";
        n = CustomText.word;
      }
      t += `\nrandom: ${r} ${n}`;
    }

    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="${t}" data-balloon-pos="up" data-balloon-break commands="commandsQuoteLengthConfig">
    <i class="fas fa-tools"></i>custom
    </div>
    `);
  }

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Punctuation" data-balloon-pos="up" function="togglePunctuation()">
    <span class="punc" style="font-weight: 900;
      color: var(--main-color);
      width: 1.25rem;
      text-align: center;
      display: inline-block;
      margin-right: .5rem;
      letter-spacing: -.1rem;">!?</span>${
        room.config.punctuation ? "on" : "off"
      }
    </div>
    `);

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Numbers" data-balloon-pos="up" function="toggleNumbers()">
    <span class="numbers" style="font-weight: 900;
        color: var(--main-color);
        width: 1.25rem;
        text-align: center;
        margin-right: .1rem;
        display: inline-block;
        margin-right: .5rem;
        letter-spacing: -.1rem;">15</span>${room.config.numbers ? "on" : "off"}
    </div>
    `);

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Language" data-balloon-pos="up" commands="commandsLanguages">
    <i class="fas fa-globe-americas"></i>${room.config.language}
    </div>
    `);

  if (room.config.difficulty === "normal") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="far fa-star"></i>normal
    </div>
    `);
  } else if (room.config.difficulty === "expert") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="fas fa-star-half-alt"></i>expert
    </div>
    `);
  } else if (room.config.difficulty === "master") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="fas fa-star"></i>master
    </div>
    `);
  }

  if (room.config.blindMode) {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Blind mode" data-balloon-pos="up" function="toggleBlindMode()">
    <i class="fas fa-eye-slash"></i>blind
    </div>
    `);
  } else {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Blind mode" data-balloon-pos="up" function="toggleBlindMode()">
    <i class="fas fa-eye-slash"></i>off
    </div>
    `);
  }

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Funbox" data-balloon-pos="up" commands="commandsFunbox">
    <i class="fas fa-gamepad"></i>${room.config.funbox}
    </div>
    `);

  if (room.config.confidenceMode === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up" commands="commandsConfidenceMode">
    <i class="fas fa-backspace"></i>off
    </div>
    `);
  } else if (room.config.confidenceMode === "on") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up" commands="commandsConfidenceMode">
    <i class="fas fa-backspace"></i>confidence
    </div>
    `);
  } else if (room.config.confidenceMode === "max") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up" commands="commandsConfidenceMode">
    <i class="fas fa-backspace"></i>max
    </div>
    `);
  }

  if (room.config.stopOnError === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="commandsStopOnError">
    <i class="fas fa-hand-paper"></i>off
    </div>
    `);
  } else {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="commandsStopOnError">
    <i class="fas fa-hand-paper"></i>stop on ${room.config.stopOnError}
    </div>
    `);
  }

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Min Wpm" data-balloon-pos="up" commands="commandsMinWpm">
    <i class="fas fa-bomb"></i>${
      room.config.minWpm == null ? "off" : room.config.minWpm + "wpm"
    }
    </div>
    `);

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Min Acc" data-balloon-pos="up" commands="commandsMinAcc">
    <i class="fas fa-bomb"></i>${
      room.config.minAcc == null ? "off" : room.config.minAcc + "%"
    }
    </div>
    `);
}

export function testFinished(result) {
  if (state >= 21) {
    socket.emit("mp_room_test_finished", { result: result });
  }
}

function showCountdown(faint = false) {
  if (faint) {
    $("#tribeCountdownWrapper .faint").removeClass("hidden");
  } else {
    $("#tribeCountdownWrapper .withbg").removeClass("hidden");
  }
}

function hideCountdown() {
  $("#tribeCountdownWrapper .faint").addClass("hidden");
  $("#tribeCountdownWrapper .withbg").addClass("hidden");
}

function updateCountdown(text) {
  $("#tribeCountdownWrapper .number").text(text);
}

function fadeoutCountdown() {
  $("#tribeCountdownWrapper .faint").animate(
    {
      opacity: 0,
    },
    125,
    () => {
      $("#tribeCountdownWrapper .faint")
        .addClass("hidden")
        .css("opacity", 0.075);
    }
  );
  $("#tribeCountdownWrapper .withbg").animate(
    {
      opacity: 0,
    },
    125,
    () => {
      $("#tribeCountdownWrapper .withbg").addClass("hidden").css("opacity", 1);
    }
  );
}

function showResultCountdown() {
  $("#result .tribeResult .timer").animate({ opacity: 1 }, 125);
}

function hideResultCountdown() {
  $("#result .tribeResult .timer").animate({ opacity: 0 }, 125);
}

function updateResultCountdown(text) {
  $("#result .tribeResult .timer").text(text);
}

export function scrollChat() {
  let chatEl = $(".pageTribe .lobby .chat .messages")[0];
  let chatEl2 = $(".pageTest #result .tribeResultChat .chat .messages")[0];

  if (shouldScrollChat) {
    chatEl.scrollTop = chatEl.scrollHeight;
    chatEl2.scrollTop = chatEl2.scrollHeight;
    shouldScrollChat = true;
  }
}

function limitChatMessages() {
  let messages1 = $(".pageTribe .lobby .chat .messages .message");
  let messages2 = $(
    ".pageTest #result .tribeResultChat .chat .messages .message"
  );

  let limit = 100;

  //they should be in sync so it doesnt matter if i check one length
  if (messages1 <= limit) return;

  let del = messages1.length - limit;

  for (let i = 0; i < del; i++) {
    $(messages1[i]).remove();
    $(messages2[i]).remove();
  }
}

// function updateAllGraphs(graphs, max) {
//   try {
//     graphs.forEach((graph) => {
//       if (graph.options.scales.yAxes[0].ticks.max < Math.round(max)) {
//         graph.options.scales.yAxes[0].ticks.max = Math.round(max);
//         graph.options.scales.yAxes[1].ticks.max = Math.round(max);
//       }
//     });
//   } catch (e) {
//     console.error("Something went wrong while updating max graph values " + e);
//   }
// }

function fillGraphDataAndUpdate(graph, result, sid) {
  let labels = [];
  for (let i = 1; i <= result.chartData.wpm.length; i++) {
    labels.push(i);
  }

  let graphmaxval = Math.max(
    Math.max(...result.chartData.wpm),
    Math.max(...result.chartData.raw)
  );

  graph.data.labels = labels;
  graph.data.datasets[0].data = result.chartData.wpm;
  graph.data.datasets[1].data = result.chartData.raw;
  graph.data.datasets[2].data = result.chartData.err;

  graph.options.scales.yAxes[0].ticks.max = Math.round(graphmaxval);
  graph.options.scales.yAxes[1].ticks.max = Math.round(graphmaxval);

  if (sid == socket.id) {
    graph.data.datasets[0].borderColor = ThemeColors.main;
    graph.data.datasets[0].pointBackgroundColor = ThemeColors.main;
  } else {
    graph.data.datasets[0].borderColor = ThemeColors.text;
    graph.data.datasets[0].pointBackgroundColor = ThemeColors.text;
  }
  graph.data.datasets[1].borderColor = ThemeColors.sub;
  graph.data.datasets[1].pointBackgroundColor = ThemeColors.sub;

  graph.update({ duration: 0 });
}

function drawMinigraph(sid, result) {
  try {
    let graphelem = $(`.tribeResult .player[sid='${sid}'] .graph canvas`)[0];
    let graph = new Chart(graphelem, miniChartSettings);

    fillGraphDataAndUpdate(graph, result, sid);

    return graph;
  } catch (e) {
    Notifications.add("Error drawing mini graph: " + e.message, -1);
  }
}

function destroyAllGraphs() {
  Object.keys(room.userGraphs).forEach((sid) => {
    let userGraph = room.userGraphs[sid];
    userGraph.graph.clear();
    userGraph.graph.destroy();
    delete room.userGraphs[sid];
  });
}

function setSettingsLoadingIndicator(truefalse) {
  if (truefalse) {
    $(".pageTribe .lobby .currentSettings .loadingIndicator").removeClass(
      "hidden"
    );
  } else {
    $(".pageTribe .lobby .currentSettings .loadingIndicator").addClass(
      "hidden"
    );
  }
}

function userReady() {
  $(".pageTribe .lobby .lobbyButtons .userReadyButton").addClass("disabled");
  $(".pageTest #result .resultMpButtons .userReadyButton").addClass("disabled");
  $(".pageTest #result #readyButton").addClass("disabled");
  socket.emit("mp_user_ready");
}

function resetReadyButtons() {
  if (room.isLeader === false && room.isReady === false) {
    $(".pageTribe .lobby .lobbyButtons .userReadyButton").removeClass(
      "disabled"
    );
    $(".pageTest #result .resultMpButtons .userReadyButton").removeClass(
      "disabled"
    );
    $(".pageTest #result #readyButton").removeClass("disabled");
    $(".pageTribe .lobby .lobbyButtons .userReadyButton").removeClass("hidden");
    $(".pageTest #result .resultMpButtons .userReadyButton").removeClass(
      "hidden"
    );
    $(".pageTest #result #readyButton").removeClass("hidden");
  } else {
    let cls = "disabled";
    if (room.isLeader) {
      cls = "hidden";
    }
    $(".pageTribe .lobby .lobbyButtons .userReadyButton").addClass(cls);
    $(".pageTest #result .resultMpButtons .userReadyButton").addClass(cls);
    $(".pageTest #result #readyButton").addClass(cls);
  }
}

function resetLeaderButtons() {
  if (room.isLeader) {
    $(".pageTribe .lobby .lobbyButtons .startTestButton").removeClass("hidden");
    $(".pageTest #result #backToLobbyButton").removeClass("hidden");
  } else {
    $(".pageTribe .lobby .lobbyButtons .startTestButton").addClass("hidden");
    $(".pageTest #result #backToLobbyButton").addClass("hidden");
  }
}

function showTribeUserSettingsPopup() {
  if ($("#tribeUserSettingsPopupWrapper").hasClass("hidden")) {
    $("#tribeUserSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100);
  }
}

function hideTribeUserSettingsPopup() {
  if (!$("#tribeUserSettingsPopupWrapper").hasClass("hidden")) {
    $("#tribeUserSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#tribeUserSettingsPopup").attr("sid", "");
          $("#tribeUserSettingsPopupWrapper").addClass("hidden");
        }
      );
  }
}

function updateTribeUserSettingsPopup(sid) {
  $("#tribeUserSettingsPopup").attr("sid", sid);
  $("#tribeUserSettingsPopup .title").text(
    "User settings: " + room.users[sid].name
  );
}

export function setName(newname) {
  name = newname;
  socket.emit("mp_system_name_set", { name: newname });
}

export function sendIsTypingUpdate(truefalse) {
  socket.emit("mp_room_user_istypingupdate", {
    typing: truefalse,
  });
}

function updateWhoIsTyping() {
  let string = "";

  let names = [];
  Object.keys(room.whoIsTyping).forEach((sid) => {
    if (room.whoIsTyping[sid].truefalse && sid !== socket.id) {
      names.push(room.whoIsTyping[sid].name);
    }
  });
  if (names.length > 0) {
    for (let i = 0; i < names.length; i++) {
      if (i === 0) {
        string += `<span class="who">${names[i]}</span>`;
      } else if (i === names.length - 1) {
        string += ` and <span class="who">${names[i]}</span>`;
      } else {
        string += `, <span class="who">${names[i]}</span>`;
      }
    }
    if (names.length == 1) {
      string += " is typing...";
    } else {
      string += " are typing...";
    }
  } else {
    string = " ";
  }

  $(".pageTribe .lobby .chat .whoIsTyping").html(string);
  $(".pageTest #result .tribeResultChat .chat .whoIsTyping").html(string);
}

export function updateTribeDiff(currentSpeed) {
  if (state >= 21 && state <= 28 && TestLogic.active) {
    let elem = $("#tribeDiff");
    elem.removeClass("ahead");
    elem.removeClass("behind");

    let maxwpm = 0;
    Object.keys(room.userSpeeds).forEach((sid) => {
      if (room.userSpeeds[sid] > maxwpm) maxwpm = room.userSpeeds[sid];
    });

    let diff = Math.round(maxwpm - currentSpeed);
    if (diff == 0) {
      elem.text("--");
    } else if (diff > 0) {
      elem.text("-" + diff);
      elem.addClass("behind");
    } else {
      elem.addClass("ahead");
      elem.text("+" + Math.abs(diff));
    }
  }
}

export function showHideTribeDiff(showhide) {
  if (showhide) {
    $("#tribeDiff").removeClass("hidden");
  } else {
    $("#tribeDiff").addClass("hidden");
  }
}

function resetTribeDiff() {
  let elem = $("#tribeDiff");
  elem.removeClass("ahead");
  elem.removeClass("behind");
  elem.text("--");
}

async function insertImageEmoji(text) {
  text = text.trim().split(" ");
  let big = "";
  if (text.length === 1) big = " big";
  for (let i = 0; i < text.length; i++) {
    if (/:.+:/g.test(text[i])) {
      let emoji = await Misc.getEmojiList();
      let result = emoji.filter((e) => e.from == text[i].replace(/:/g, ""));
      if (result[0] !== undefined) {
        text[
          i
        ] = `<div class="emoji ${big}" style="background-image: url('${result[0].to}')"></div>`;
      }
    }
  }
  return text.join(" ");
}

socket.on("connect", (f) => {
  UpdateConfig.setTimerStyle("mini", true);
  state = 1;
  Notifications.add("Connected", 1, undefined, "Tribe");
  let name = "Guest";
  if (firebase.auth().currentUser !== null) {
    name = firebase.auth().currentUser.displayName;
  }
  setName(name);
  changeActiveSubpage("prelobby");
  showHideTribeDiff(true);
  setTimeout(() => {
    if (autoJoin) {
      socket.emit("mp_room_join", { roomId: autoJoin });
      autoJoin = undefined;
      // swapElements($(".pageTribe .preloader"), $(".pageTribe .lobby"), 250);
    } else {
      // swapElements($(".pageTribe .preloader"), $(".pageTribe .prelobby"), 250);
    }
  }, 500);
});

socket.on("mp_room_name_update", (data) => {
  room.users[data.sid].name = data.name;
  refreshUserList();
});

socket.on("mp_update_online_stats", (data) => {
  let ping = Math.round(performance.now() - data.pingStart);
  OnlineStats.hideLoading();
  OnlineStats.setInQueue(data.stats[2]);
  OnlineStats.updateRaces(data.stats[1]);
  $(".pageTribe .prelobby .welcome .stats").empty();
  $(".pageTribe .prelobby .welcome .stats").append(
    `<div>Online <span class="num">${data.stats[0]}</span></div>`
  );
  $(".pageTribe .prelobby .welcome .stats").append(
    `<div class="small">Version ${data.stats[3]}</div>`
  );
  $(".pageTribe .prelobby .welcome .stats").append(
    `<div class="small">Ping ${ping}ms</div>`
  );
  if (data.stats[3] !== expectedVersion) {
    socket.disconnect();
    $(".pageTribe .preloader .icon").html(
      `<i class="fas fa-exclamation-triangle"></i>`
    );
    $(".pageTribe .preloader .text").html(
      `Version mismatch.<br>Try refreshing or clearing cache.<br><br>Client version: ${expectedVersion}<br>Server version: ${data.stats[3]}`
    );
    $(".pageTribe .preloader .reconnectButton").addClass(`hidden`);
  }
});

socket.on("mp_update_name", (data) => {
  name = data.newName;
});

socket.on("disconnect", (f) => {
  state = -1;
  room = undefined;
  Notifications.add("Disconnected", 0, undefined, "Tribe");
  resetLobby();
  resetRace();
  resetResult();
  changeActiveSubpage("preloader");
  showHideTribeDiff(false);
  Matchmaking.resetBanner();
  Matchmaking.enableLobbyButtons();
  Matchmaking.hideLeaveQueueButton();
  Matchmaking.showStartQueueButton();
  Matchmaking.hideBanner();
  // $(".pageTribe .preloader div").removeClass("hidden");
  // $(".pageTribe .preloader").removeClass("hidden").css("opacity", 1);
  // $(".pageTribe .preloader .icon").html(`<i class="fas fa-fw fa-times"></i>`);
  // $(".pageTribe .preloader .text").text(`Disconnected from Tribe`);
  $(".pageTribe .preloader .icon").html(`<i class="fas fa-fw fa-times"></i>`);
  $(".pageTribe .preloader .text").text(`Disconnected`);
  $(".pageTribe .preloader .reconnectButton").removeClass(`hidden`);
});

socket.on("connect_failed", (f) => {
  state = -1;
  changeActiveSubpage("preloader");
  // $(".pageTribe .preloader div").removeClass("hidden");
  // $(".pageTribe .preloader").removeClass("hidden").css("opacity", 1);
  $(".pageTribe .preloader .icon").html(`<i class="fas fa-fw fa-times"></i>`);
  $(".pageTribe .preloader .text").text(`Connection failed`);
  $(".pageTribe .preloader .reconnectButton").removeClass(`hidden`);
});

socket.on("connect_error", (f) => {
  state = -1;
  console.error(f);
  changeActiveSubpage("preloader");
  // $(".pageTribe .preloader div").removeClass("hidden");
  // $(".pageTribe .preloader").removeClass("hidden").css("opacity", 1);
  $(".pageTribe .preloader .icon").html(`<i class="fas fa-fw fa-times"></i>`);
  $(".pageTribe .preloader .text").text(`Connection error`);
  $(".pageTribe .preloader .reconnectButton").removeClass(`hidden`);
});

socket.on("mp_room_joined", (data) => {
  if (room === undefined) {
    room = data.room;
  } else {
    room.users[data.sid] = { sid: data.sid, name: data.name };
  }
  if (data.room.private) {
    playSound("join");
    if (data.sid === socket.id) {
      let user = room.users[socket.id];
      if (user.isLeader) {
        room.isLeader = true;
      } else {
        room.isLeader = false;
      }
      room.isReady = false;
      room.isTyping = false;
    }
    resetReadyButtons();
    refreshUserList();
    if (state === 10) {
      //user is already in the room and somebody joined
    } else if (state === 1) {
      //user is in prelobby and joined a room
      applyRoomConfig(room.config);
      refreshConfig();
      let link = location.origin + "/tribe" + room.id.substring(4);
      $(".pageTribe .lobby .inviteLink .code .text").text(room.id.substring(5));
      $(".pageTribe .lobby .inviteLink .link").text(link);
      $(".pageTest .tribeResultChat .inviteLink .code .text").text(
        room.id.substring(5)
      );
      $(".pageTest .tribeResultChat .inviteLink .link").text(link);
      changeActiveSubpage("lobby");
      state = data.room.state;
      if (state >= 20 && state < 29) {
        refreshTestUserList();
      }
      // swapElements($(".pageTribe .prelobby"), $(".pageTribe .lobby"), 250, () => {
      //   state = 10;
      //   // $(".pageTribe .prelobby").addClass('hidden');
      // });
      resetReadyButtons();
      resetLeaderButtons();
    }
  } else {
    state = 7;
    Matchmaking.hideLeaveQueueButton();
  }
});

socket.on("mp_room_leave", () => {
  let privateRoom = room.private;
  state = 1;
  room = undefined;
  name.replace(/\(\d\)$/g, "");
  resetLobby();
  changeActiveSubpage("prelobby");
  resetLobby();
  resetRace();
  if (privateRoom) resetResult();
  Matchmaking.enableLobbyButtons();
  Matchmaking.hideLeaveQueueButton();
  Matchmaking.showStartQueueButton();
  Matchmaking.hideBanner();
  // swapElements($(".pageTribe .lobby"), $(".pageTribe .prelobby"), 250);
});

socket.on("mp_room_user_left", (data) => {
  if (room.private) {
    playSound("leave");
    if (room.whoIsTyping === undefined) {
      room.whoIsTyping = {};
    }
    room.whoIsTyping[data.sid] = { name: data.name, truefalse: false };
    updateWhoIsTyping();
    delete room.users[data.sid];
    if (data.newLeader !== "" && data.newLeader === socket.id) {
      room.isLeader = true;
      room.users[socket.id].isLeader = true;
    }
    refreshUserList();
    resetLeaderButtons();
    resetReadyButtons();
  } else {
    delete room.users[data.sid];
  }
  if (state >= 20 && state < 29) {
    $(`.tribePlayers .player[sid=${data.sid}]`).addClass("failed");
    $(`.tribeResult .player[sid=${data.sid}]`).addClass("failed");
    $(`.tribeResult table .player[sid=${data.sid}] .other`).text("left");
  }
});

socket.on("mp_room_new_leader", (data) => {
  room.isLeader = false;
  Object.keys(room.users).forEach((u) => {
    room.users[u].isLeader = false;
  });
  room.users[data.newLeader].isLeader = true;
  if (data.newLeader !== "" && data.newLeader === socket.id) {
    room.isLeader = true;
    room.users[socket.id].isLeader = true;
  }
  refreshUserList();
  resetLeaderButtons();
  resetReadyButtons();
});

socket.on("mp_room_config_update", (data) => {
  room.config = data.newConfig;
  if (room.private) {
    refreshConfig();
    if (!room.isLeader) {
      Notifications.add("Config changed", 0, 2);
      applyRoomConfig(room.config);
    }
    Object.keys(room.users).forEach((sid) => {
      room.users[sid].isReady = false;
    });
    room.isReady = false;
    resetReadyButtons();
    refreshUserList();
  }
});

socket.on("mp_chat_message", async (data) => {
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
  if (!data.isSystem && data.from.name != name) {
    if (nameregex.test(data.message)) {
      playSound("chat_mention");
      data.message = data.message.replace(
        nameregex,
        "<span class='mention'>$&</span>"
      );
    } else {
      playSound("chat2");
    }
  }
  let cls = "message";
  let author = "";
  if (data.isSystem) {
    cls = "systemMessage";
  } else {
    let me = "";
    if (data.from.name == name) me = " me";
    author = `<div class="author ${me}">${data.from.name}:</div>`;
  }
  data.message = await insertImageEmoji(data.message);
  $(".pageTribe .lobby .chat .messages").append(`
    <div class="${cls}">${author}<div class="text">${data.message}</div></div>
  `);
  $(".pageTest #result .tribeResultChat .chat .messages").append(`
    <div class="${cls}">${author}<div class="text">${data.message}</div></div>
  `);

  limitChatMessages();
  scrollChat();
});

socket.on("mp_update_mm_status", (data) => {
  if (data.visible) {
    Matchmaking.showBanner();
  } else {
    Matchmaking.hideBanner();
  }
  if (data.text !== undefined) Matchmaking.setBannerText(data.text);
  if (data.raceStarting === true) {
    playSound("join");
  }
});

socket.on("mp_room_user_istypingupdate", (data) => {
  if (room.whoIsTyping === undefined) {
    room.whoIsTyping = {};
  }
  room.whoIsTyping[data.sid] = { name: data.name, truefalse: data.typing };
  updateWhoIsTyping();
});

$(".pageTest #result .tribeResultChat .chat .input input").keypress(() => {
  setTimeout(() => {
    $(".pageTribe .lobby .chat .input input").val(
      $(".pageTest #result .tribeResultChat .chat .input input").val()
    );
  }, 1);
});
$(".pageTribe .lobby .chat .input input").keypress((e) => {
  setTimeout(() => {
    $(".pageTest #result .tribeResultChat .chat .input input").val(
      $(".pageTribe .lobby .chat .input input").val()
    );
  }, 1);
});

$(".pageTribe .lobby .chat .input input").keydown((e) => {
  if (e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "Tab") {
    e.preventDefault();
  }
});

$(".pageTribe .lobby .chat .input input").keyup((e) => {
  if (e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "Tab") {
    e.preventDefault();
  }

  if (e.key == "ArrowUp") {
    lobbySuggestions.moveActiveSuggestion(false);
  } else if (e.key == "ArrowDown") {
    lobbySuggestions.moveActiveSuggestion(true);
  } else if (e.key == "Tab") {
    let active = lobbySuggestions.getActive();
    if (active) {
      let split = $(".pageTribe .lobby .chat .input input").val().split(" ");
      if (active.type === "image") {
        split[split.length - 1] = `:${active.from}:`;
      } else if (active.type === "emoji") {
        split[split.length - 1] = `${active.to}`;
      } else {
        //its a name
        split[split.length - 1] = `@${active}`;
      }
      $(".pageTribe .lobby .chat .input input").val(split.join(" ") + " ");
      lobbySuggestions.hide();
    }
  } else {
    let split = $(".pageTribe .lobby .chat .input input").val().split(" ");
    split = split[split.length - 1];
    if (split.slice(-1) === ":") {
      let active = lobbySuggestions.getActive();
      if (active) {
        let split = $(".pageTribe .lobby .chat .input input").val().split(" ");
        if (active.type === "emoji") {
          split[split.length - 1] = `${active.to}`;
        }
        $(".pageTribe .lobby .chat .input input").val(split.join(" ") + " ");
        lobbySuggestions.hide();
      }
    } else if (split.slice(0, 1) === ":") {
      split = split.replace(/:/g, "");
      if (split.length >= 2) {
        lobbySuggestions.updateSuggestions("emoji", split);
        lobbySuggestions.show();
      } else {
        lobbySuggestions.hide();
      }
    } else if (split.slice(0, 1) === "@") {
      split = split.replace(/@/g, "");
      if (split.length >= 0) {
        lobbySuggestions.updateSuggestions("name", split);
        lobbySuggestions.show();
      } else {
        lobbySuggestions.hide();
      }
    } else {
      lobbySuggestions.hide();
    }
  }
});

$(".pageTest #result .tribeResultChat .chat .input input").keydown((e) => {
  if (e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "Tab") {
    e.preventDefault();
  }
});

$(".pageTest #result .tribeResultChat .chat .input input").keyup((e) => {
  if (e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "Tab") {
    e.preventDefault();
  }

  if (e.key == "ArrowUp") {
    resultSuggestions.moveActiveSuggestion(false);
  } else if (e.key == "ArrowDown") {
    resultSuggestions.moveActiveSuggestion(true);
  } else if (e.key == "Tab") {
    let emoji = resultSuggestions.getActive();
    if (emoji) {
      let split = $(".pageTest #result .tribeResultChat .chat .input input")
        .val()
        .split(" ");
      if (emoji.type === "image") {
        split[split.length - 1] = `:${emoji.from}:`;
      } else if (emoji.type === "emoji") {
        split[split.length - 1] = `${emoji.to}`;
      }
      $(".pageTest #result .tribeResultChat .chat .input input").val(
        split.join(" ") + " "
      );
      resultSuggestions.hide();
    }
  } else {
    let split = $(".pageTest #result .tribeResultChat .chat .input input")
      .val()
      .split(" ");
    split = split[split.length - 1];
    if (split.slice(-1) === ":") {
      let active = resultSuggestions.getActive();
      if (active) {
        let split = $(".pageTest #result .tribeResultChat .chat .input input")
          .val()
          .split(" ");
        if (active.type === "emoji") {
          split[split.length - 1] = `${active.to}`;
        }
        $(".pageTest #result .tribeResultChat .chat .input input").val(
          split.join(" ") + " "
        );
        resultSuggestions.hide();
      }
    } else if (split.slice(0, 1) === ":") {
      split = split.replace(/:/g, "");
      if (split.length >= 2) {
        resultSuggestions.updateSuggestions("emoji", split);
        resultSuggestions.show();
      } else {
        resultSuggestions.hide();
      }
    } else if (split.slice(0, 1) === "@") {
      split = split.replace(/@/g, "");
      if (split.length >= 0) {
        resultSuggestions.updateSuggestions("name", split);
        resultSuggestions.show();
      } else {
        resultSuggestions.hide();
      }
    } else {
      resultSuggestions.hide();
    }
  }
});

socket.on("mp_system_message", (data) => {
  Notifications.add(`${data.message}`, data.level, undefined, "Tribe");
});

socket.on("mp_room_test_start", (data) => {
  if (room.private && !room.isTyping) return;
  // UI.changePage('');
  // mp_testCountdown();
  // startTest();
  setTimeout(() => {
    if (!TestLogic.active) {
      TestLogic.startTest();
    }
  }, 500);
  // Notifications.add("test starting",0);
  updateCountdown("");
  fadeoutCountdown();
  playSound("cd_go");
});

socket.on("mp_room_test_countdown", (data) => {
  if (room.private && !room.isTyping) return;
  TestUI.focusWords();
  updateCountdown(data.val);
  if (data.val <= 3) playSound("cd");
  // if (data.val == 1) fadeoutCountdown()
  // Notifications.add(`countdown ${data.val}`,0);
});

socket.on("mp_room_finishTimer_countdown", (data) => {
  showResultCountdown();
  updateResultCountdown(`Time left for everyone to finish: ${data.val}s`);
  showCountdown(true);
  updateCountdown(data.val);
  if (data.val <= 3) playSound("cd");
});

socket.on("mp_room_finishTimer_over", (data) => {
  hideResultCountdown();
  if (TestLogic.active) TestLogic.finish(undefined, true);
});

socket.on("mp_room_readyResultTimer_countdown", (data) => {
  showResultCountdown();
  updateResultCountdown(`Waiting for everyone to get ready: ${data.val}s`);
});

socket.on("mp_room_readyResultTimer_over", (data) => {
  hideResultCountdown();
  if (room.isLeader) {
    $(".pageTest #nextTestButton").removeClass("hidden");
    $(".pageTest #backToLobbyButton").removeClass("hidden");
  }
});

socket.on("mp_room_test_init", (data) => {
  if (room.private && room.isReady !== true && room.isLeader !== true) {
    UI.changePage("tribe");
    changeActiveSubpage("lobby");
    // Notifications.add(
    //   `Not joining race. isReady: ${room.isReady}, isLeader: ${room.isLeader}`,
    //   0,
    //   0,
    //   "DEBUG"
    // );
    $(".pageTribe .lobby .lobbyButtons .userReadyButton").addClass("disabled");
    refreshTestUserList();
    return;
  }

  let delay = 0;
  if ($(".page.pageTest").hasClass("active")) {
    //test already visible, delay some stuff
    delay = 125;
  }
  if (!room.private) {
    room.config = data.newConfig;
    applyRoomConfig(room.config);
  }

  playSound("start");
  room.userSpeeds = {};
  resetTribeDiff();
  showHideTribeDiff(true);
  room.userGraphs = {};
  room.userFinished = false;
  room.isTyping = true;
  destroyAllGraphs();
  seedrandom(data.seed, { global: true });
  console.log(`seed: ${data.seed}`);
  console.log(`random: ${Math.random()}`);
  UI.changePage("", true);
  $(".pageTribe .lobby .chat .input input").val("");
  $(".pageTest #result .tribeResultChat .chat .input input").val("");
  lobbySuggestions.hide();
  resultSuggestions.hide();
  Matchmaking.resetBanner();
  sendIsTypingUpdate(false);
  hideResultCountdown();
  $(".pageTest #restartTestButton").addClass("hidden");

  setTimeout(() => {
    refreshTestUserList();
    showCountdown();
  }, delay);
});

socket.on("mp_room_state_update", (data) => {
  state = data.newState;
  // Notifications.add(`state changed to ${data.newState}`, 0);
  if (data.newState === 8) {
    Matchmaking.hideLeaveQueueButton();
  }
  if (data.newState === 19 && room.isReady) {
    Notifications.add("Race starting", 0, 1);
  }
});

socket.on("mp_room_user_test_progress_update", (data) => {
  if (room.isTyping) {
    if (data.sid !== socket.id) room.userSpeeds[data.sid] = data.stats.wpm;
  }
  $(`.tribePlayers .player[sid=${data.sid}] .wpm`).text(data.stats.wpm);
  $(`.tribePlayers .player[sid=${data.sid}] .acc`).text(
    Math.floor(data.stats.acc) + "%"
  );
  $(`.tribeResult table .player[sid=${data.sid}] .wpm .text`).text(
    data.stats.wpm
  );
  $(`.tribeResult table .player[sid=${data.sid}] .acc .text`).text(
    Math.floor(data.stats.acc) + "%"
  );
  if (debugNoAnim) {
    if (TestLogic.active) {
      $(`.tribePlayers .player[sid=${data.sid}] .bar`).css({
        width:
          Config.mode === "time"
            ? data.stats.wpmProgress + "%"
            : data.stats.progress + "%",
      });
    } else {
      $(`.tribeResult table .player[sid=${data.sid}] .bar`).css({
        width:
          Config.mode === "time"
            ? data.stats.wpmProgress + "%"
            : data.stats.progress + "%",
      });
    }
  } else {
    if (TestLogic.active) {
      $(`.tribePlayers .player[sid=${data.sid}] .bar`)
        .stop(true, false)
        .animate(
          {
            width:
              Config.mode === "time"
                ? data.stats.wpmProgress + "%"
                : data.stats.progress + "%",
          },
          1000,
          "linear"
        );
    } else {
      $(`.tribeResult table .player[sid=${data.sid}] .bar`)
        .stop(true, false)
        .animate(
          {
            width:
              Config.mode === "time"
                ? data.stats.wpmProgress + "%"
                : data.stats.progress + "%",
          },
          1000,
          "linear"
        );
    }
  }
});

let graphs = [];

socket.on("mp_room_user_finished", (data) => {
  room.users[data.sid].isFinished = true;
  $(`.tribeResult`).removeClass("hidden");
  $(`.tribeResult table .player[sid=${data.sid}] .wpm .text`).text(
    data.result.wpm
  );
  $(`.tribeResult table .player[sid=${data.sid}] .acc .text`).text(
    data.result.acc + "%"
  );
  // $(`.tribeResult table .player[sid=${data.sid}] .progress`).remove();
  // $(`.tribeResult table .player[sid=${data.sid}] .raw`).remove();
  // $(`.tribeResult table .player[sid=${data.sid}] .con`).remove();
  // $(`.tribeResult table .player[sid=${data.sid}] .char`).remove();
  // $(`.tribeResult table .player[sid=${data.sid}] .acc`).after(`
  //   <td class="raw"></div>
  //   <td class="con"></div>
  //   <td class="char"></div>
  // `);
  $(`.tribeResult table .player[sid=${data.sid}] .raw .text`).text(
    data.result.raw
  );
  let val = "-";
  if (data.result.afk) {
    val = "afk";
  } else if (data.result.invalid) {
    val = "invalid";
  } else if (data.result.failed) {
    val = "failed";
  } else if (data.result.outOfTime) {
    val = "out of time";
  }
  $(`.tribeResult table .player[sid=${data.sid}] .other`).text(val);
  $(`.tribeResult table .player[sid=${data.sid}] .char`).text(data.result.char);
  $(`.tribeResult table .player[sid=${data.sid}] .con .text`).text(
    data.result.con + "%"
  );

  if (data.result.failed || data.result.invalid || data.result.afk) {
    $(`.tribePlayers .player[sid=${data.sid}]`).addClass("failed");
    $(`.tribeResult .player[sid=${data.sid}]`).addClass("failed");
  }

  if (room.userGraphs === undefined) room.userGraphs = {};
  room.userGraphs[data.sid] = {
    data: data.result,
  };

  UI.swapElements(
    $(`.tribeResult table .player[sid=${data.sid}] .progress`),
    $(`.tribeResult table .player[sid=${data.sid}] .graph`),
    125
  );

  setTimeout(() => {
    if (data.sid === socket.id) {
      room.userFinished = true;

      Object.keys(room.userGraphs).forEachWithCallback((sid, i, next) => {
        setTimeout(() => {
          let userGraph = room.userGraphs[sid];
          userGraph.graph = drawMinigraph(sid, userGraph.data);
          next();
        }, 100);
      });
    } else if (room.userFinished) {
      room.userGraphs[data.sid].graph = drawMinigraph(data.sid, data.result);
    }
  }, 250);

  // $(`.tribeResult table .player[sid=${data.sid}] .progress`),
  //   swapElements(
  //     $(`.tribeResult table .player[sid=${data.sid}] .progress`),
  //     $(`.tribeResult table .player[sid=${data.sid}] .graph`),
  //     125,
  //     () => {
  //       drawMinigraph(data.sid, data.result);
  //       // $(`.tribeResult table .player[sid=${data.sid}] .graph`).css('opacity',0).animate({opacity:1},125);
  //     }
  //   );

  if (Config.mode !== "time" && !data.result.failed && !data.result.afk) {
    $(`.tribePlayers .player[sid=${data.sid}] .bar`).stop(true, false).animate(
      {
        width: "100%",
      },
      1000,
      "linear"
    );
    $(`.tribeResult table .player[sid=${data.sid}] .bar`)
      .stop(true, false)
      .animate(
        {
          width: "100%",
        },
        1000,
        "linear"
      );
  }
});

socket.on("mp_room_winner", (data) => {
  let pos = 1;
  if (data.official) {
    hideResultCountdown();
    // updateAllGraphs(graphs, data.maxRaw);
    // room.newTestCooldown = true;
    // $("#result #nextTestButton").html(
    //   `<i class="fas fa-fw fa-spin fa-circle-notch"></i>`
    // );
    // $("#result #nextTestButton").attr(
    //   "aria-label",
    //   "Please wait for all players to view their result"
    // );
    // setTimeout(() => {
    //   room.newTestCooldown = false;
    //   $("#result #nextTestButton").html(
    //     `<i class="fas fa-fw fa-chevron-right"></i>`
    //   );
    //   $("#result #nextTestButton").attr("aria-label", "Next test");
    // }, 5000);
  }
  let userwon = false;
  data.sorted.forEach((sid) => {
    $(`.tribeResult table [sid=${sid.sid}] .pos .num`).text(
      `${pos}${Misc.getNumberSuffix(pos)}`
    );
    if (data.official && pos == 1) {
      if (sid.sid === socket.id) {
        userwon = true;
      }
      $(`.tribeResult table [sid=${sid.sid}] .crown .fa-crown`).animate(
        { opacity: 1 },
        125
      );
    } else {
      $(`.tribeResult table [sid=${sid.sid}] .crown .fa-crown`).css(
        "opacity",
        0
      );
    }
    pos++;
  });
  if (userwon && data.official) {
    playSound("finish_win");
  } else if (!userwon && data.official) {
    playSound("finish");
  }
});

socket.on("mp_room_miniCrowns", (data) => {
  let count = {};
  Object.keys(data.crowns).forEach((c) => {
    let crown = data.crowns[c];
    crown.sidList.forEach((sid) => {
      if (count[sid] === undefined) {
        count[sid] = 1;
      } else {
        count[sid]++;
      }
      $(`.tribeResult table [sid=${sid}] .${c} .miniCrown`).animate(
        { opacity: 0.5 },
        125
      );
    });
  });
  Object.keys(count).forEach((sid) => {
    if (count[sid] === 4) {
      $(`.tribeResult table [sid=${sid}] .crown`).append(
        `<div class="glow"></div>`
      );
      $(`.tribeResult table [sid=${sid}] .crown`).attr(
        "aria-label",
        "Dominated"
      );
      $(`.tribeResult table [sid=${sid}] .crown`).attr(
        "data-balloon-pos",
        "up"
      );
      if (sid === socket.id) {
        playSound("glow");
      }
    }
  });
});

socket.on("mp_room_points", (data) => {
  data.users.forEach((user) => {
    $(`.tribeResult table [sid=${user.sid}] .pos .points`).text(
      `+${user.newPoints}${user.newPoints == 1 ? "pt" : "pts"}`
    );
    room.users[user.sid].points = user.totalPoints;
  });
  refreshUserList();
});

socket.on("mp_room_back_to_lobby", (data) => {
  Object.keys(room.users).forEach((sid) => {
    room.users[sid].isTyping = false;
  });
  $(".tribePlayers").addClass("hidden");
  UI.changePage("tribe");
  refreshUserList();
});

socket.on("mp_room_user_info_update", (data) => {
  let checkReady = false;
  Object.keys(data.values).forEach((bool) => {
    room.users[data.sid][bool] = data.values[bool];
    if (bool === "isReady" && data.values[bool]) checkReady = true;
    if (data.sid === socket.id) {
      room[bool] = data.values[bool];
      if (bool === "isReady" && !data.values[bool] && !room.isLeader) {
        resetReadyButtons();
      }
    }
  });
  if (room.isLeader && checkReady) {
    let everyoneReady = true;
    Object.keys(room.users).forEach((sid) => {
      if (
        !room.users[sid].isReady &&
        !room.users[sid].isLeader &&
        (!room.users[sid].isTyping || room.users[sid].isFinished)
      )
        everyoneReady = false;
    });
    if (everyoneReady) {
      playSound("chat_mention");
      Notifications.add("Everyone is ready", 1, 3, "Tribe");
    }
  }
  refreshUserList();
});

$(".pageTribe #createPrivateRoom").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  // activateFunbox("none");
  // setLanguage("english");
  // setMode("quote");
  let mode2;
  if (Config.mode === "time") {
    mode2 = Config.time;
  } else if (Config.mode === "words") {
    mode2 = Config.words;
  } else if (Config.mode === "quote") {
    mode2 = Config.quoteLength === undefined ? "-1" : Config.quoteLength;
  }
  socket.emit("mp_room_create", {
    config: {
      mode: Config.mode,
      mode2: mode2,
      difficulty: Config.difficulty,
      blindMode: Config.blindMode,
      language: Config.language,
      funbox: Funbox.active,
      stopOnError: Config.stopOnError,
      confidenceMode: Config.confidenceMode,
      customText: {
        text: CustomText.text,
        isWordRandom: CustomText.isWordRandom,
        isTimeRandom: CustomText.isTimeRandom,
        word: CustomText.word,
        time: CustomText.time,
      },
      punctuation: Config.punctuation,
      numbers: Config.numbers,
      minWpm: Config.minWpm === "custom" ? Config.minWpmCustomSpeed : null,
      minAcc: Config.minAcc === "custom" ? Config.minAccCustom : null,
    },
  });
});

$(".pageTest #result .tribeResultChat .chat .input input").keyup((e) => {
  if (e.keyCode === 13) {
    let msg = $(".pageTest #result .tribeResultChat .chat .input input").val();
    msg = Misc.encodeHTML(msg);
    if (msg === "") return;
    if (msg.length > 512) {
      Notifications.add("Message cannot be longer than 512 characters.", 0);
      return;
    }
    if (performance.now() < lastMessageTimestamp + 500) return;
    lastMessageTimestamp = performance.now();
    sendIsTypingUpdate(false);
    socket.emit("mp_chat_message", {
      message: msg,
    });
    resultSuggestions.hide();
    $(".pageTest #result .tribeResultChat .chat .input input").val("");
    $(".pageTribe .lobby .chat .input input").val("");
  }
});

$(".pageTribe .preloader .reconnectButton").click((e) => {
  $(".pageTribe .preloader .reconnectButton").addClass(`hidden`);
  init();
});

$(".pageTribe .lobby .chat .input input").keyup((e) => {
  if (e.keyCode === 13) {
    let msg = $(".pageTribe .lobby .chat .input input").val();
    msg = Misc.encodeHTML(msg);
    if (msg === "") return;
    if (msg.length > 512) {
      Notifications.add("Message cannot be longer than 512 characters.", 0);
      return;
    }
    if (performance.now() < lastMessageTimestamp + 500) return;
    lastMessageTimestamp = performance.now();
    sendIsTypingUpdate(false);
    socket.emit("mp_chat_message", {
      message: msg,
    });
    lobbySuggestions.hide();
    $(".pageTribe .lobby .chat .input input").val("");
    $(".pageTest #result .tribeResultChat .chat .input input").val("");
  }
});

$(
  ".pageTribe .lobby .chat .input input, .pageTest #result .tribeResultChat .chat .input input"
).on("input", (e) => {
  // e.currentTarget.value = emoji.emojify(e.currentTarget.value);
  if (e.currentTarget.value.length === 1) {
    //typing update
    sendIsTypingUpdate(true);
  } else if (e.currentTarget.value == "") {
    //not typing update
    sendIsTypingUpdate(false);
  }
});

$(".pageTest #result .tribeResultChat .chat .messages").on("scroll", (e) => {
  let chatEl = $(".pageTest #result .tribeResultChat .chat .messages")[0];
  shouldScrollChat =
    chatEl.scrollHeight - chatEl.scrollTop <= chatEl.clientHeight + 10;
});

$(".pageTribe .lobby .chat .messages").on("scroll", (e) => {
  let chatEl = $(".pageTribe .lobby .chat .messages")[0];
  shouldScrollChat =
    chatEl.scrollHeight - chatEl.scrollTop <= chatEl.clientHeight + 10;
});

$(
  ".pageTribe .lobby .inviteLink .text, .pageTest .tribeResultChat .inviteLink .code .text"
).click(async (e) => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .lobby .inviteLink .text").text()
    );
    Notifications.add("Code copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

$(".pageTribe .lobby .inviteLink .text").hover(async (e) => {
  $(".pageTribe .lobby .inviteLink .text").css(
    "color",
    "#" + $(".pageTribe .lobby .inviteLink .text").text()
  );
});

$(".pageTest .tribeResultChat .inviteLink .code .text").hover(async (e) => {
  $(".pageTest .tribeResultChat .inviteLink .code .text").css(
    "color",
    "#" + $(".pageTest .tribeResultChat .inviteLink .code .text").text()
  );
});

$(".pageTest .tribeResultChat .inviteLink .code .text").hover(
  function () {
    $(this).css("color", "#" + $(".pageTribe .lobby .inviteLink .text").text());
  },
  function () {
    $(this).css("color", "");
  }
);

$(".pageTribe .lobby .inviteLink .text").hover(
  function () {
    $(this).css("color", "#" + $(".pageTribe .lobby .inviteLink .text").text());
  },
  function () {
    $(this).css("color", "");
  }
);

$(
  ".pageTribe .lobby .inviteLink .link, .pageTest .tribeResultChat .inviteLink .link"
).click(async (e) => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .lobby .inviteLink .link").text()
    );
    Notifications.add("Link copied", 1);
  } catch (e) {
    Notifications.add("Could not copy to clipboard: " + e, -1);
  }
});

$(".pageTribe .prelobby #joinByCode .customInput").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  $(".pageTribe .prelobby #joinByCode input").focus();
});

$(".pageTribe .prelobby #joinByCode input").focus((e) => {
  $(".pageTribe .prelobby #joinByCode .customInput .byte").addClass("focused");
});

$(".pageTribe .prelobby #joinByCode input").focusout((e) => {
  $(".pageTribe .prelobby #joinByCode .customInput .byte").removeClass(
    "focused"
  );
});

$(".pageTribe .prelobby .matchmaking .startMatchmakingButton").click((e) => {
  if (state >= 6 && state <= 8) return;
  if ($(e.currentTarget).hasClass("disabled")) return;
  let queue = Matchmaking.getQ();
  if (queue.length == 0) return;
  Matchmaking.setBannerText("Waiting for more players...");
  Matchmaking.showBanner();
  state = 6;
  // lastQueue = queue;
  // applyRoomConfig(TribeDefaultConfigs[queue]);
  Matchmaking.disableLobbyButtons();
  Matchmaking.hideStartQueueButton();
  OnlineStats.incrementQueues(queue);
  setTimeout(() => {
    socket.emit("mp_queue_join", { queues: queue });
    Matchmaking.showLeaveQueueButton();
  }, 1000);
});

$(".pageTest #result #queueAgainButton").click((e) => {
  queueAgain(e);
});

$(".pageTest #result #queueAgainButton").keypress((e) => {
  if (e.key === "Enter" && !e.shiftKey) queueAgain(e);
});

function queueAgain(e) {
  if (state >= 6 && state <= 8) return;
  if ($(e.currentTarget).hasClass("disabled")) return;
  let queue = Matchmaking.getQ();
  if (queue.length == 0) return;
  Matchmaking.setBannerText("Waiting for more players...");
  Matchmaking.showBanner();
  showHideTribeDiff(false);
  state = 6;
  // applyRoomConfig(TribeDefaultConfigs[lastQueue]);
  TestLogic.restart();
  Matchmaking.disableLobbyButtons();
  Matchmaking.hideStartQueueButton();
  OnlineStats.incrementQueues(queue);
  setTimeout(() => {
    socket.emit("mp_queue_join", { queues: queue });
    Matchmaking.showLeaveQueueButton();
    resetResult();
  }, 1000);
}

$(".pageTribe .prelobby .matchmaking .leaveMatchmakingButton").click((e) => {
  if (state === 6) {
    socket.emit("mp_queue_leave");
    Matchmaking.enableLobbyButtons();
    Matchmaking.hideLeaveQueueButton();
    Matchmaking.showStartQueueButton();
    Matchmaking.hideBanner();
    OnlineStats.decrementQueues(Matchmaking.getQ());
    setTimeout(() => {
      state = 1;
    }, 1000);
  }
});

$(".pageTribe .prelobby #joinByCode .button").click((e) => {
  if ($(e.currentTarget).hasClass("disabled")) return;
  let code = $(".pageTribe .prelobby #joinByCode input").val().toLowerCase();
  if (code.length !== 6) {
    Notifications.add("Code required", 0);
  } else {
    joinRoomByCode(code);
  }
});

$(".pageTribe .prelobby #joinByCode input").keyup((e) => {
  if (e.key === "Enter") {
    let code = $(".pageTribe .prelobby #joinByCode input").val().toLowerCase();
    if (code.length !== 6) {
      Notifications.add("Code required", 0);
    } else {
      joinRoomByCode(code);
    }
  } else {
    setTimeout((t) => {
      // let t1 = "xx";
      // let t2 = "xx";
      // let t2 = "xx";
      let v = $(".pageTribe .prelobby #joinByCode input").val();
      // let text = `${v[0] == undefined ? 'x' : v[0]}`;
      // let iv = 0;
      // for (let i = 0; i < 8; i++){
      //   text[i] = v[iv] == undefined ? 'x' : v[iv];
      //   if(![2,5].includes(i)) iv++;
      // }
      let code = [];
      for (let i = 0; i < 6; i++) {
        let char = v[i] == undefined ? "-" : v[i];
        code.push(char);
      }
      let text = code.join("");
      $($(".pageTribe .prelobby #joinByCode .customInput .byte")[0]).text(
        text.substring(0, 2)
      );
      $($(".pageTribe .prelobby #joinByCode .customInput .byte")[1]).text(
        text.substring(2, 4)
      );
      $($(".pageTribe .prelobby #joinByCode .customInput .byte")[2]).text(
        text.substring(4, 6)
      );
    }, 0);
  }
});

$(
  ".pageTribe .lobby .lobbyButtons .leaveRoomButton, .pageTest #result .resultMpButtons .leaveRoomButton"
).click((e) => {
  socket.emit("mp_room_leave");
});

$(".pageTribe .lobby .lobbyButtons .startTestButton").click((e) => {
  startTest();
});

$(
  `.pageTribe .lobby .lobbyButtons .userReadyButton,
  .pageTest #result #readyButton,
  .pageTest #result .resultMpButtons .userReadyButton`
).click((e) => {
  userReady();
});

$(
  `.pageTribe .lobby .lobbyButtons .userReadyButton,
  .pageTest #result #readyButton,
  .pageTest #result .resultMpButtons .userReadyButton`
).on("keypress", (event) => {
  if (event.keyCode == 13) {
    userReady();
  }
});

$(document).on("keypress", (e) => {
  if ((state === 10 || state === 29) && e.key === "Enter" && e.shiftKey) {
    if (room.isLeader) {
      startTest();
    } else {
      userReady();
    }
  }
});

$(".pageTest #result #backToLobbyButton").click((e) => {
  socket.emit("mp_room_back_to_lobby");
});

$(document).on(
  "click",
  ".pageTribe .lobby .currentSettings .groups .group",
  (e) => {
    if (room.isLeader) {
      // let commands = eval($(e.currentTarget).attr("commands"));
      let commands = CommandlineLists.getList(
        $(e.currentTarget).attr("commands")
      );
      let func = $(e.currentTarget).attr("function");
      if (commands != undefined) {
        if ($(e.currentTarget).attr("commands") === "commandsTags") {
          CommandlineLists.updateTagCommands();
        }
        CommandlineLists.pushCurrent(commands);
        Commandline.show();
      } else if (func != undefined) {
        eval(func);
      }
    }
  }
);

$("#tribeUserSettingsPopupWrapper").click((e) => {
  if ($(e.target).attr("id") === "tribeUserSettingsPopupWrapper") {
    hideTribeUserSettingsPopup();
  }
});

$(document).on(
  "click",
  ".pageTribe .lobby .userlist .user .userSettings",
  (e) => {
    updateTribeUserSettingsPopup($(e.currentTarget).attr("sid"));
    showTribeUserSettingsPopup();
  }
);

$(document).on("click", "#tribeUserSettingsPopup .buttons .leader", (e) => {
  let sid = $("#tribeUserSettingsPopup").attr("sid");
  socket.emit("mp_room_new_leader", { sid: sid });
  hideTribeUserSettingsPopup();
});

$(document).on("click", "#tribeUserSettingsPopup .buttons .ban", (e) => {
  let sid = $("#tribeUserSettingsPopup").attr("sid");
  socket.emit("mp_room_ban_user", { sid: sid });
  hideTribeUserSettingsPopup();
});

$(document).on("keypress", (e) => {
  if (
    state === 10 &&
    !$(".pageTribe .lobby .chat .input input").is(":focus") &&
    e.key === "/"
  ) {
    $(".pageTribe .lobby .chat .input input").focus();
    e.preventDefault();
  }
  if (
    state >= 28 &&
    !$(".pageTest #result .tribeResultChat .chat .input input").is(":focus") &&
    e.key === "/"
  ) {
    $(".pageTest #result .tribeResultChat .chat .input input").focus();
    e.preventDefault();
  }
});

let miniChartSettings = {
  type: "line",
  data: {
    labels: [1, 2, 3],
    datasets: [
      {
        label: "wpm",
        data: [100, 100, 100],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 1,
        yAxisID: "wpm",
        order: 2,
        radius: 1,
      },
      {
        label: "raw",
        data: [110, 110, 110],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 1,
        yAxisID: "raw",
        order: 3,
        radius: 1,
      },
      {
        label: "errors",
        data: [1, 0, 1],
        borderColor: "rgba(255, 125, 125, 1)",
        pointBackgroundColor: "rgba(255, 125, 125, 1)",
        borderWidth: 1,
        order: 1,
        yAxisID: "error",
        maxBarThickness: 10,
        type: "scatter",
        pointStyle: "crossRot",
        radius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 2;
        },
        pointHoverRadius: function (context) {
          var index = context.dataIndex;
          var value = context.dataset.data[index];
          return value <= 0 ? 0 : 3;
        },
      },
    ],
  },
  options: {
    layout: {
      padding: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5,
      },
    },
    tooltips: {
      titleFontFamily: "Roboto Mono",
      bodyFontFamily: "Roboto Mono",
      mode: "index",
      intersect: false,
      enabled: false,
      custom: function (tooltipModel) {
        // Tooltip Element
        var tooltipEl = document.getElementById("tribeMiniChartCustomTooltip");

        // Create element on first render
        if (!tooltipEl) {
          tooltipEl = document.createElement("div");
          tooltipEl.id = "tribeMiniChartCustomTooltip";
          tooltipEl.innerHTML = "<div></div>";
          document.body.appendChild(tooltipEl);
        }

        // Hide if no tooltip
        if (tooltipModel.opacity === 0) {
          tooltipEl.style.opacity = 0;
          return;
        }

        // Set caret Position
        tooltipEl.classList.remove("above", "below", "no-transform");
        if (tooltipModel.yAlign) {
          tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
          tooltipEl.classList.add("no-transform");
        }

        function getBody(bodyItem) {
          return bodyItem.lines;
        }

        // Set Text
        if (tooltipModel.body) {
          var titleLines = tooltipModel.title || [];
          var bodyLines = tooltipModel.body.map(getBody);

          var innerHtml = "";

          titleLines.forEach(function (title) {
            innerHtml += "<div>" + title + "</div>";
          });
          // innerHtml += '</thead><tbody>';

          bodyLines.forEach(function (body, i) {
            // var colors = tooltipModel.labelColors[i];
            // var style = 'background:' + colors.backgroundColor;
            // style += '; border-color:' + colors.borderColor;
            // style += '; border-width: 2px';
            // var span = '<span style="' + style + '"></span>';
            innerHtml += "<div>" + body + "</div>";
            // innerHtml += '<tr><td>' + span + body + '</td></tr>';
          });
          // innerHtml += '</tbody>';

          var tableRoot = tooltipEl.querySelector("div");
          tableRoot.innerHTML = innerHtml;
        }

        // `this` will be the overall tooltip
        var position = this._chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.position = "absolute";
        tooltipEl.style.left =
          position.left + window.pageXOffset + tooltipModel.caretX + "px";
        tooltipEl.style.top =
          position.top + window.pageYOffset + tooltipModel.caretY + "px";
        // tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
        tooltipEl.style.fontSize = "0.75rem";
        tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
        tooltipEl.style.padding =
          tooltipModel.yPadding + "px " + tooltipModel.xPadding + "px";
        tooltipEl.style.pointerEvents = "none";
        tooltipEl.style.background = "rgba(0,0,0,.75)";
        tooltipEl.style.borderRadius = "0.5rem";
        tooltipEl.style.color = "white";
        tooltipEl.style.zIndex = "999";
        tooltipEl.style.transition = "left 0.25s, top 0.25s, opacity 0.25s";
      },
    },
    legend: {
      display: false,
      labels: {
        defaultFontFamily: "Roboto Mono",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          ticks: {
            fontFamily: "Roboto Mono",
            autoSkip: true,
            autoSkipPadding: 40,
          },
          display: false,
          scaleLabel: {
            display: false,
            labelString: "Seconds",
            fontFamily: "Roboto Mono",
          },
        },
      ],
      yAxes: [
        {
          id: "wpm",
          display: false,
          scaleLabel: {
            display: true,
            labelString: "Words per Minute",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: true,
          },
        },
        {
          id: "raw",
          display: false,
          scaleLabel: {
            display: true,
            labelString: "Raw Words per Minute",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            min: 0,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
        {
          id: "error",
          display: false,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: "Errors",
            fontFamily: "Roboto Mono",
          },
          ticks: {
            precision: 0,
            fontFamily: "Roboto Mono",
            beginAtZero: true,
            autoSkip: true,
            autoSkipPadding: 40,
          },
          gridLines: {
            display: false,
          },
        },
      ],
    },
    annotation: {
      annotations: [],
    },
  },
};
