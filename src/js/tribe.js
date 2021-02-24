let MP = {
  state: -1,
  socket: io(
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://tribe.monkeytype.com",
    {
      // socket: io("http://localhost:3000", {
      autoConnect: false,
      secure: true,
      reconnectionAttempts: 1,
    }
  ),
  reconnectionAttempts: 0,
  maxReconnectionAttempts: 1,
  activePage: "preloader",
  pageTransition: false,
  expectedVersion: "0.8.1",
};

let scrollChat = true;

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
//10 - lobby
//20 - test about to start
//21 - test active
//28 - leader finished
//29 - everybody finished

function mp_init() {
  $(".pageTribe .preloader .icon").html(
    `<i class="fas fa-fw fa-spin fa-circle-notch"></i>`
  );
  $(".pageTribe .preloader .text").text("Connecting to Tribe");
  MP.socket.connect();
}

function mp_changeActiveSubpage(newPage) {
  if (MP.pageTransition) return;
  if (newPage === MP.activePage) return;
  MP.pageTransition = true;

  swapElements(
    $(`.pageTribe .${MP.activePage}`),
    $(`.pageTribe .${newPage}`),
    250,
    () => {
      if (newPage === "prelobby") {
        MP.socket.emit("mp_get_online_stats");
      }
      if (newPage === "lobby") {
        $(".pageTribe .lobby .chat .input input").focus();
      }
      MP.pageTransition = false;
      MP.activePage = newPage;
    }
  );
}

function mp_refreshUserList() {
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTest #result .tribeResultChat .userlist .list").empty();
  let usersArray = [];
  Object.keys(MP.room.users).forEach((sid) => {
    let u = MP.room.users[sid];
    u.sid = sid;
    usersArray.push(u);
  });
  let sortedUsers = usersArray.sort((a, b) => b.points - a.points);
  sortedUsers.forEach((user) => {
    let icons = "";
    if (user.isLeader) {
      if (user.sid === MP.socket.id) {
        MP.room.isLeader = true;
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
    <div class='user ${user.sid === MP.id ? "me" : ""}'>
    <div class="nameAndIcons">
      <div class='icons'>
      ${icons}
      </div>
      <div class='name'>
      ${user.name}
      </div>
      ${
        MP.room.isLeader && user.sid !== MP.id
          ? `<div class='userSettings' sid='` +
            user.sid +
            `' aria-label="User settigns" data-balloon-pos="up"><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `);
    $(".pageTest #result .tribeResultChat .userlist .list").append(`
    <div class='user ${user.sid === MP.id ? "me" : ""}'>
    <div class="nameAndIcons">
      <div class='icons'>
      ${icons}
      </div>
      <div class='name'>
      ${user.name}
      </div>
      ${
        MP.room.isLeader && user.sid !== MP.id
          ? `<div class='userSettings' sid='` +
            user.sid +
            `' aria-label="User settigns" data-balloon-pos="up"><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `);
  });
}

function mp_playSound(sound) {
  tribeSounds[sound].currentTime = 0;
  tribeSounds[sound].play();
}

function mp_resetLobby() {
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

function mp_resetRace() {
  $(".pageTest .tribePlayers").empty().addClass("hidden");
  $(".pageTribe .lobby .tribePlayers").empty().addClass("hidden");
  hideCountdown();
  hideResultCountdown();
  $(".pageTest #result .tribeResult").addClass("hidden");
  $(".pageTest #result .tribeResultChat").addClass("hidden");
}

function mp_applyRoomConfig(cfg) {
  setMode(cfg.mode, true, true);
  if (cfg.mode === "time") {
    setTimeConfig(cfg.mode2, true, true);
  } else if (cfg.mode === "words") {
    setWordCount(cfg.mode2, true, true);
  } else if (cfg.mode === "quote") {
    setQuoteLength(cfg.mode2, true, true);
  }
  setDifficulty(cfg.difficulty, true, true);
  setBlindMode(cfg.blindMode, true, true);
  setLanguage(cfg.language, true, true);
  activateFunbox(cfg.funbox, null, true);
  setStopOnError(cfg.stopOnError, true, true);
  setConfidenceMode(cfg.confidenceMode, true, true);
  setPunctuation(cfg.punctuation, true, true);
  setNumbers(cfg.numbers, true, true);
  if (cfg.minAcc != null) {
    setMinAccCustom(cfg.minAcc, true, true);
    setMinAcc("custom", true, true);
  } else {
    setMinAcc("off", true, true);
  }
  if (cfg.minWpm != null) {
    setMinWpmCustomSpeed(cfg.minAcc, true, true);
    setMinWpm("custom", true, true);
  } else {
    setMinWpm("off", true, true);
  }
  customText = cfg.customText;
}

function mp_checkIfCanChangeConfig(mp) {
  if (MP.state >= 10) {
    if (MP.state >= 20 && MP.state < 29) {
      Notifications.add("You can't change settings during the test", 0, 1);
      return false;
    } else if (MP.room.isLeader) {
      return true;
    } else {
      if (mp) return true;
      Notifications.add("Only the leader can change this setting", 0, 1);
      return false;
    }
  } else {
    return true;
  }
}
let syncConfigTimeout = null;
function mp_syncConfig() {
  setSettingsLoadingIndicator(true);
  if (syncConfigTimeout === null) {
    syncConfigTimeout = setTimeout(() => {
      setSettingsLoadingIndicator(false);
      let mode2;
      if (config.mode === "time") {
        mode2 = config.time;
      } else if (config.mode === "words") {
        mode2 = config.words;
      } else if (config.mode === "quote") {
        mode2 = config.quoteLength === undefined ? "-1" : config.quoteLength;
      }
      MP.socket.emit("mp_room_config_update", {
        config: {
          mode: config.mode,
          mode2: mode2,
          difficulty: config.difficulty,
          blindMode: config.blindMode,
          language: config.language,
          funbox: activeFunBox,
          stopOnError: config.stopOnError,
          confidenceMode: config.confidenceMode,
          customText: customText,
          punctuation: config.punctuation,
          numbers: config.numbers,
          minWpm: config.minWpm === "custom" ? config.minWpmCustomSpeed : null,
          minAcc: config.minAcc === "custom" ? config.minAccCustom : null,
        },
      });
      clearTimeout(syncConfigTimeout);
      syncConfigTimeout = null;
    }, 500);
  }
}

function mp_joinRoomByCode(code) {
  code = "room_" + code;
  MP.socket.emit("mp_room_join", { roomId: code });
  $(".pageTribe .prelobby #joinByCode input").val("");

  $(".pageTribe .prelobby #joinByCode .customInput").html(`
    <span class="byte">--</span>
    /
    <span class="byte">--</span>
    /
    <span class="byte">--</span>
  `);
}

function mp_startTest() {
  if (syncConfigTimeout !== null) return;
  if (MP.room.newTestCooldown) return;
  MP.room.isReady = true;
  MP.socket.emit("mp_room_test_start");
}

function mp_sendTestProgress(wpm, raw, acc, progress) {
  if (MP.state >= 21 && MP.state <= 28 && testActive) {
    MP.socket.emit("mp_room_test_progress_update", {
      sid: MP.socket.id,
      roomId: MP.room.id,
      stats: {
        wpm: wpm,
        raw: raw,
        acc: acc,
        progress: progress,
      },
    });
  }
}

function mp_refreshTestUserList() {
  $(".tribePlayers").empty();
  Object.keys(MP.room.users).forEach((sid) => {
    if (
      MP.room.users[sid].isTyping ||
      MP.room.users[sid].isReady ||
      MP.room.users[sid].isLeader
    ) {
      let user = MP.room.users[sid];
      let me = "";
      if (sid === MP.socket.id) {
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
  Object.keys(MP.room.users).forEach((sid) => {
    if (
      MP.room.users[sid].isTyping ||
      MP.room.users[sid].isReady ||
      MP.room.users[sid].isLeader
    ) {
      let user = MP.room.users[sid];
      let me = "";
      if (sid === MP.socket.id) {
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

function mp_refreshConfig() {
  if (MP.room == undefined) return;
  $(".pageTribe .lobby .currentSettings .groups").empty();

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Mode" data-balloon-pos="up" commands="commandsMode">
    <i class="fas fa-bars"></i>${MP.room.config.mode}
    </div>
    `);

  if (MP.room.config.mode === "time") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Time" data-balloon-pos="up" commands="commandsTimeConfig">
    <i class="fas fa-clock"></i>${MP.room.config.mode2}
    </div>
    `);
  } else if (MP.room.config.mode === "words") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Words" data-balloon-pos="up" commands="commandsWordCount">
    <i class="fas fa-font"></i>${MP.room.config.mode2}
    </div>
    `);
  } else if (MP.room.config.mode === "quote") {
    let qstring = "all";
    let num = MP.room.config.mode2;
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
  } else if (MP.room.config.mode === "custom") {
    let t = "Custom settings:";

    t += `\ntext length: ${customText.text.length}`;
    if (customText.isTimeRandom || customText.isWordRandom) {
      let r = "";
      let n = "";
      if (customText.isTimeRandom) {
        r = "time";
        n = customText.time;
      } else if (customText.isWordRandom) {
        r = "words";
        n = customText.word;
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
        MP.room.config.punctuation ? "on" : "off"
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
        letter-spacing: -.1rem;">15</span>${
          MP.room.config.numbers ? "on" : "off"
        }
    </div>
    `);

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Language" data-balloon-pos="up" commands="commandsLanguages">
    <i class="fas fa-globe-americas"></i>${MP.room.config.language}
    </div>
    `);

  if (MP.room.config.difficulty === "normal") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="far fa-star"></i>normal
    </div>
    `);
  } else if (MP.room.config.difficulty === "expert") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="fas fa-star-half-alt"></i>expert
    </div>
    `);
  } else if (MP.room.config.difficulty === "master") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up" commands="commandsDifficulty">
    <i class="fas fa-star"></i>master
    </div>
    `);
  }

  if (MP.room.config.blindMode) {
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
    <i class="fas fa-gamepad"></i>${MP.room.config.funbox}
    </div>
    `);

  if (MP.room.config.confidenceMode === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up" commands="commandsConfidenceMode">
    <i class="fas fa-backspace"></i>off
    </div>
    `);
  } else if (MP.room.config.confidenceMode === "on") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up" commands="commandsConfidenceMode">
    <i class="fas fa-backspace"></i>confidence
    </div>
    `);
  } else if (MP.room.config.confidenceMode === "max") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up" commands="commandsConfidenceMode">
    <i class="fas fa-backspace"></i>max
    </div>
    `);
  }

  if (MP.room.config.stopOnError === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="commandsStopOnError">
    <i class="fas fa-hand-paper"></i>off
    </div>
    `);
  } else {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up" commands="commandsStopOnError">
    <i class="fas fa-hand-paper"></i>stop on ${MP.room.config.stopOnError}
    </div>
    `);
  }

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Min Wpm" data-balloon-pos="up" commands="commandsMinWpm">
    <i class="fas fa-bomb"></i>${
      MP.room.config.minWpm == null ? "off" : MP.room.config.minWpm + "wpm"
    }
    </div>
    `);

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Min Acc" data-balloon-pos="up" commands="commandsMinAcc">
    <i class="fas fa-bomb"></i>${
      MP.room.config.minAcc == null ? "off" : MP.room.config.minAcc + "%"
    }
    </div>
    `);
}

function mp_testFinished(result) {
  MP.socket.emit("mp_room_test_finished", { result: result });
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

function mp_scrollChat() {
  let chatEl = $(".pageTribe .lobby .chat .messages")[0];
  let chatEl2 = $(".pageTest #result .tribeResultChat .chat .messages")[0];

  if (scrollChat) {
    chatEl.scrollTop = chatEl.scrollHeight;
    chatEl2.scrollTop = chatEl2.scrollHeight;
  }
}

function updateAllGraphs(graphs, max) {
  try {
    graphs.forEach((graph) => {
      if (graph.options.scales.yAxes[0].ticks.max < Math.round(max)) {
        graph.options.scales.yAxes[0].ticks.max = Math.round(max);
        graph.options.scales.yAxes[1].ticks.max = Math.round(max);
      }
    });
  } catch (e) {
    console.error("Something went wrong while updating max graph values " + e);
  }
}

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

  if (sid == MP.socket.id) {
    graph.data.datasets[0].borderColor = themeColors.main;
    graph.data.datasets[0].pointBackgroundColor = themeColors.main;
  } else {
    graph.data.datasets[0].borderColor = themeColors.text;
    graph.data.datasets[0].pointBackgroundColor = themeColors.text;
  }
  graph.data.datasets[1].borderColor = themeColors.sub;
  graph.data.datasets[1].pointBackgroundColor = themeColors.sub;

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
  Object.keys(MP.room.userGraphs).forEach((sid) => {
    let userGraph = MP.room.userGraphs[sid];
    userGraph.graph.clear();
    userGraph.graph.destroy();
    delete MP.room.userGraphs[sid];
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

function mp_userReady() {
  $(".pageTribe .lobby .lobbyButtons .userReadyButton").addClass("disabled");
  $(".pageTest #result .resultMpButtons .userReadyButton").addClass("disabled");
  $(".pageTest #result #readyButton").addClass("disabled");
  MP.socket.emit("mp_user_ready");
}

function mp_resetReadyButtons() {
  if (MP.room.isLeader === false && MP.room.isReady === false) {
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
    if (MP.room.isLeader) {
      cls = "hidden";
    }
    $(".pageTribe .lobby .lobbyButtons .userReadyButton").addClass(cls);
    $(".pageTest #result .resultMpButtons .userReadyButton").addClass(cls);
    $(".pageTest #result #readyButton").addClass(cls);
  }
}

function mp_resetLeaderButtons() {
  if (MP.room.isLeader) {
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
    "User settings: " + MP.room.users[sid].name
  );
}

function mp_setName(name) {
  MP.name = name;
  MP.socket.emit("mp_system_name_set", { name: name });
}

function mp_sendIsTypingUpdate(truefalse) {
  MP.socket.emit("mp_room_user_istypingupdate", {
    sid: MP.socket.id,
    typing: truefalse,
    name: MP.name,
  });
}

function mp_updateWhoIsTyping() {
  let string = "";

  let names = [];
  Object.keys(MP.room.whoIsTyping).forEach((sid) => {
    if (MP.room.whoIsTyping[sid].truefalse) {
      names.push(MP.room.whoIsTyping[sid].name);
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

MP.socket.on("connect", (f) => {
  setTimerStyle("mini", true);
  MP.state = 1;
  MP.reconnectionAttempts = 0;
  Notifications.add("Connected to Tribe", 1);
  let name = "Guest";
  if (firebase.auth().currentUser !== null) {
    name = firebase.auth().currentUser.displayName;
  }
  MP.id = MP.socket.id;
  mp_setName(name);
  mp_changeActiveSubpage("prelobby");
  setTimeout(() => {
    if (MP.autoJoin) {
      MP.socket.emit("mp_room_join", { roomId: MP.autoJoin });
      MP.autoJoin = undefined;
      // swapElements($(".pageTribe .preloader"), $(".pageTribe .lobby"), 250);
    } else {
      // swapElements($(".pageTribe .preloader"), $(".pageTribe .prelobby"), 250);
    }
  }, 500);
});

MP.socket.on("mp_room_name_update", (data) => {
  MP.room.users[data.sid].name = data.name;
  mp_refreshUserList();
});

MP.socket.on("mp_update_online_stats", (data) => {
  $(".pageTribe .prelobby .welcome .stats").empty();
  $(".pageTribe .prelobby .welcome .stats").append(
    `<div>Online <span class="num">${data.online}</span></div>`
  );
  $(".pageTribe .prelobby .welcome .stats").append(
    `<div>Active Races <span class="num">${data.rooms}</span></div>`
  );
  $(".pageTribe .prelobby .welcome .stats").append(
    `<div class="small">Version ${data.version}</div>`
  );
  if (data.version !== MP.expectedVersion) {
    Notifications.add(
      `Tribe version mismatch. Try refreshing or clearing cache. Client version: ${MP.expectedVersion}, server version: ${data.version}`,
      -1
    );
    MP.socket.disconnect();
  }
});

MP.socket.on("mp_update_name", (data) => {
  MP.name = data.newName;
});

MP.socket.on("disconnect", (f) => {
  MP.state = -1;
  MP.room = undefined;
  Notifications.add("Disconnected from Tribe", 0);
  mp_resetLobby();
  mp_resetRace();
  mp_changeActiveSubpage("preloader");
  // $(".pageTribe .preloader div").removeClass("hidden");
  // $(".pageTribe .preloader").removeClass("hidden").css("opacity", 1);
  // $(".pageTribe .preloader .icon").html(`<i class="fas fa-fw fa-times"></i>`);
  // $(".pageTribe .preloader .text").text(`Disconnected from Tribe`);
});

MP.socket.on("connect_failed", (f) => {
  MP.state = -1;
  mp_changeActiveSubpage("preloader");
  // $(".pageTribe .preloader div").removeClass("hidden");
  // $(".pageTribe .preloader").removeClass("hidden").css("opacity", 1);
  MP.reconnectionAttempts++;
  if (MP.reconnectionAttempts >= MP.maxReconnectionAttempts) {
    $(".pageTribe .preloader .icon").html(`<i class="fas fa-fw fa-times"></i>`);
    $(".pageTribe .preloader .text").text(
      `Could not connect to Tribe server: ${f.message}`
    );
  } else {
    $(".pageTribe .preloader .text").text("Connection failed. Retrying");
    Notifications.add("Tribe connection error: " + f.message, -1);
  }
});

MP.socket.on("connect_error", (f) => {
  MP.state = -1;
  MP.reconnectionAttempts++;
  console.error(f);
  mp_changeActiveSubpage("preloader");
  // $(".pageTribe .preloader div").removeClass("hidden");
  // $(".pageTribe .preloader").removeClass("hidden").css("opacity", 1);
  if (MP.reconnectionAttempts >= MP.maxReconnectionAttempts) {
    $(".pageTribe .preloader .icon").html(`<i class="fas fa-fw fa-times"></i>`);
    $(".pageTribe .preloader .text").text(
      `Could not connect to Tribe server: ${f.message}`
    );
  } else {
    $(".pageTribe .preloader .text").text("Connection error. Retrying");
    Notifications.add("Tribe connection error: " + f.message, -1);
  }
});

MP.socket.on("mp_room_joined", (data) => {
  mp_playSound("join");
  if (MP.room === undefined) {
    MP.room = data.room;
  } else {
    MP.room.users[data.sid] = { sid: data.sid, name: data.name };
  }
  if (data.sid === MP.socket.id) {
    let user = MP.room.users[MP.socket.id];
    if (user.isLeader) {
      MP.room.isLeader = true;
    } else {
      MP.room.isLeader = false;
    }
    MP.room.isReady = false;
    MP.room.isTyping = false;
  }
  mp_resetReadyButtons();
  mp_refreshUserList();
  if (MP.state === 10) {
    //user is already in the room and somebody joined
  } else if (MP.state === 1) {
    //user is in prelobby and joined a room
    mp_applyRoomConfig(MP.room.config);
    mp_refreshConfig();
    let link = location.origin + "/tribe" + MP.room.id.substring(4);
    $(".pageTribe .lobby .inviteLink .code .text").text(
      MP.room.id.substring(5)
    );
    $(".pageTribe .lobby .inviteLink .link").text(link);
    $(".pageTest .tribeResultChat .inviteLink .code .text").text(
      MP.room.id.substring(5)
    );
    $(".pageTest .tribeResultChat .inviteLink .link").text(link);
    mp_changeActiveSubpage("lobby");
    MP.state = data.room.state;
    if (MP.state >= 20 && MP.state < 29) {
      mp_refreshTestUserList();
    }
    // swapElements($(".pageTribe .prelobby"), $(".pageTribe .lobby"), 250, () => {
    //   MP.state = 10;
    //   // $(".pageTribe .prelobby").addClass('hidden');
    // });
    mp_resetReadyButtons();
    mp_resetLeaderButtons();
  }
});

MP.socket.on("mp_room_leave", () => {
  MP.state = 1;
  MP.room = undefined;
  MP.name.replace(/\(\d\)$/g, "");
  mp_resetLobby();
  mp_changeActiveSubpage("prelobby");
  mp_resetLobby();
  mp_resetRace();
  // swapElements($(".pageTribe .lobby"), $(".pageTribe .prelobby"), 250);
});

MP.socket.on("mp_room_user_left", (data) => {
  mp_playSound("leave");
  delete MP.room.users[data.sid];
  if (data.newLeader !== "" && data.newLeader === MP.socket.id) {
    MP.room.isLeader = true;
    MP.room.users[MP.socket.id].isLeader = true;
  }
  mp_refreshUserList();
  mp_resetLeaderButtons();
  mp_resetReadyButtons();
});

MP.socket.on("mp_room_new_leader", (data) => {
  MP.room.isLeader = false;
  Object.keys(MP.room.users).forEach((u) => {
    MP.room.users[u].isLeader = false;
  });
  MP.room.users[data.newLeader].isLeader = true;
  if (data.newLeader !== "" && data.newLeader === MP.socket.id) {
    MP.room.isLeader = true;
    MP.room.users[MP.socket.id].isLeader = true;
  }
  mp_refreshUserList();
  mp_resetLeaderButtons();
  mp_resetReadyButtons();
});

MP.socket.on("mp_room_config_update", (data) => {
  MP.room.config = data.newConfig;
  mp_refreshConfig();
  if (!MP.room.isLeader) {
    Notifications.add("Config changed", 0, 2);
    mp_applyRoomConfig(MP.room.config);
  }
  Object.keys(MP.room.users).forEach((sid) => {
    MP.room.users[sid].isReady = false;
  });
  MP.room.isReady = false;
  mp_resetReadyButtons();
  mp_refreshUserList();
});

MP.socket.on("mp_chat_message", (data) => {
  let nameregex;
  if (data.isLeader) {
    nameregex = new RegExp(MP.name + "|ready|everyone", "i");
  } else {
    nameregex = new RegExp(MP.name, "i");
  }
  if (!data.isSystem && data.from.name != MP.name) {
    if (nameregex.test(data.message)) {
      mp_playSound("chat_mention");
      data.message = data.message.replace(
        nameregex,
        "<span class='mention'>$&</span>"
      );
    } else {
      mp_playSound("chat2");
    }
  }
  let cls = "message";
  let author = "";
  if (data.isSystem) {
    cls = "systemMessage";
  } else {
    let me = "";
    if (data.from.name == MP.name) me = " me";
    author = `<div class="author ${me}">${data.from.name}:</div>`;
  }
  $(".pageTribe .lobby .chat .messages").append(`
    <div class="${cls}">${author}<div class="text">${data.message}</div></div>
  `);
  $(".pageTest #result .tribeResultChat .chat .messages").append(`
    <div class="${cls}">${author}<div class="text">${data.message}</div></div>
  `);

  mp_scrollChat();
});

MP.socket.on("mp_room_user_istypingupdate", (data) => {
  if (MP.room.whoIsTyping === undefined) {
    MP.room.whoIsTyping = {};
  }
  MP.room.whoIsTyping[data.sid] = { name: data.name, truefalse: data.typing };
  mp_updateWhoIsTyping();
});
$(".pageTest #result .tribeResultChat .chat .input input").keypress(() => {
  setTimeout(() => {
    $(".pageTribe .lobby .chat .input input").val(
      $(".pageTest #result .tribeResultChat .chat .input input").val()
    );
  }, 1);
});
$(".pageTribe .lobby .chat .input input").keypress(() => {
  setTimeout(() => {
    $(".pageTest #result .tribeResultChat .chat .input input").val(
      $(".pageTribe .lobby .chat .input input").val()
    );
  }, 1);
});

MP.socket.on("mp_system_message", (data) => {
  Notifications.add(`${data.message}`, data.level, undefined, "Tribe");
});

MP.socket.on("mp_room_test_start", (data) => {
  if (!MP.room.isTyping) return;
  // changePage('');
  // mp_testCountdown();
  // startTest();
  setTimeout(() => {
    if (!testActive) {
      startTest();
    }
  }, 500);
  // Notifications.add("test starting",0);
  updateCountdown("");
  fadeoutCountdown();
  mp_playSound("cd_go");
});

MP.socket.on("mp_room_test_countdown", (data) => {
  if (!MP.room.isTyping) return;
  focusWords();
  updateCountdown(data.val);
  if (data.val <= 3) mp_playSound("cd");
  // if (data.val == 1) fadeoutCountdown()
  // Notifications.add(`countdown ${data.val}`,0);
});

MP.socket.on("mp_room_finishTimer_countdown", (data) => {
  showResultCountdown();
  updateResultCountdown(`Time left for everyone to finish: ${data.val}s`);
  showCountdown(true);
  updateCountdown(data.val);
  if (data.val <= 3) mp_playSound("cd");
});

MP.socket.on("mp_room_finishTimer_over", (data) => {
  hideResultCountdown();
  if (testActive) showResult(undefined, true);
});

MP.socket.on("mp_room_readyResultTimer_countdown", (data) => {
  showResultCountdown();
  updateResultCountdown(`Waiting for everyone to get ready: ${data.val}s`);
});

MP.socket.on("mp_room_readyResultTimer_over", (data) => {
  hideResultCountdown();
  if (MP.room.isLeader) {
    $(".pageTest #nextTestButton").removeClass("hidden");
    $(".pageTest #backToLobbyButton").removeClass("hidden");
  }
});

MP.socket.on("mp_room_test_init", (data) => {
  mp_refreshTestUserList();
  if (MP.room.isReady !== true && MP.room.isLeader !== true) {
    changePage("tribe");
    mp_changeActiveSubpage("lobby");
    Notifications.add(
      `Not joining race. isReady: ${MP.room.isReady}, isLeader: ${MP.room.isLeader}`,
      0,
      0,
      "DEBUG"
    );
    return;
  }
  mp_playSound("start");
  MP.room.userGraphs = {};
  MP.room.userFinished = false;
  destroyAllGraphs();
  seedrandom(data.seed, { global: true });
  console.log(`seed: ${data.seed}`);
  console.log(`random: ${Math.random()}`);
  changePage("");
  restartTest(false, true, true);
  showCountdown();
  hideResultCountdown();
  $(".pageTest #restartTestButton").addClass("hidden");
});

MP.socket.on("mp_room_state_update", (data) => {
  MP.state = data.newState;
  // Notifications.add(`state changed to ${data.newState}`, 0);
});

MP.socket.on("mp_room_user_test_progress_update", (data) => {
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
  $(`.tribePlayers .player[sid=${data.sid}] .bar`)
    .stop(true, false)
    .animate(
      {
        width:
          config.mode === "time"
            ? data.stats.wpmProgress + "%"
            : data.stats.progress + "%",
      },
      1000,
      "linear"
    );
  $(`.tribeResult table .player[sid=${data.sid}] .bar`)
    .stop(true, false)
    .animate(
      {
        width:
          config.mode === "time"
            ? data.stats.wpmProgress + "%"
            : data.stats.progress + "%",
      },
      1000,
      "linear"
    );
});

let graphs = [];

MP.socket.on("mp_room_user_finished", (data) => {
  MP.room.users[data.sid].isFinished = true;
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

  if (MP.room.userGraphs === undefined) MP.room.userGraphs = {};
  MP.room.userGraphs[data.sid] = {
    data: data.result,
  };

  swapElements(
    $(`.tribeResult table .player[sid=${data.sid}] .progress`),
    $(`.tribeResult table .player[sid=${data.sid}] .graph`),
    125
  );

  setTimeout(() => {
    if (data.sid === MP.socket.id) {
      MP.room.userFinished = true;

      Object.keys(MP.room.userGraphs).forEachWithCallback((sid, i, next) => {
        setTimeout(() => {
          let userGraph = MP.room.userGraphs[sid];
          userGraph.graph = drawMinigraph(sid, userGraph.data);
          next();
        }, 100);
      });
    } else if (MP.room.userFinished) {
      MP.room.userGraphs[data.sid].graph = drawMinigraph(data.sid, data.result);
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

  if (config.mode !== "time" && !data.result.failed && !data.result.afk) {
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

MP.socket.on("mp_room_winner", (data) => {
  let pos = 1;
  if (data.official) {
    hideResultCountdown();
    // updateAllGraphs(graphs, data.maxRaw);
    // MP.room.newTestCooldown = true;
    // $("#result #nextTestButton").html(
    //   `<i class="fas fa-fw fa-spin fa-circle-notch"></i>`
    // );
    // $("#result #nextTestButton").attr(
    //   "aria-label",
    //   "Please wait for all players to view their result"
    // );
    // setTimeout(() => {
    //   MP.room.newTestCooldown = false;
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
      if (sid.sid === MP.socket.id) {
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
    mp_playSound("finish_win");
  } else if (!userwon && data.official) {
    mp_playSound("finish");
  }
});

MP.socket.on("mp_room_miniCrowns", (data) => {
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
      if (sid === MP.socket.id) {
        mp_playSound("glow");
      }
    }
  });
});

MP.socket.on("mp_room_points", (data) => {
  data.users.forEach((user) => {
    $(`.tribeResult table [sid=${user.sid}] .pos .points`).text(
      `+${user.newPoints}${user.newPoints == 1 ? "pt" : "pts"}`
    );
    MP.room.users[user.sid].points = user.totalPoints;
  });
  mp_refreshUserList();
});

MP.socket.on("mp_room_back_to_lobby", (data) => {
  Object.keys(MP.room.users).forEach((sid) => {
    MP.room.users[sid].isTyping = false;
  });
  $(".tribePlayers").addClass("hidden");
  changePage("tribe");
  mp_refreshUserList();
});

MP.socket.on("mp_room_user_info_update", (data) => {
  let checkReady = false;
  Object.keys(data.values).forEach((bool) => {
    MP.room.users[data.sid][bool] = data.values[bool];
    if (bool === "isReady" && data.values[bool]) checkReady = true;
    if (data.sid === MP.socket.id) {
      MP.room[bool] = data.values[bool];
      if (bool === "isReady" && !data.values[bool] && !MP.room.isLeader) {
        mp_resetReadyButtons();
      }
    }
  });
  if (MP.room.isLeader && checkReady) {
    let everyoneReady = true;
    Object.keys(MP.room.users).forEach((sid) => {
      if (
        !MP.room.users[sid].isReady &&
        !MP.room.users[sid].isLeader &&
        (!MP.room.users[sid].isTyping || MP.room.users[sid].isFinished)
      )
        everyoneReady = false;
    });
    if (everyoneReady) {
      mp_playSound("chat_mention");
      Notifications.add("Everyone is ready", 1, 3, "Tribe");
    }
  }
  mp_refreshUserList();
});

$(".pageTribe #createPrivateRoom").click((f) => {
  // activateFunbox("none");
  // setLanguage("english");
  // setMode("quote");
  let mode2;
  if (config.mode === "time") {
    mode2 = config.time;
  } else if (config.mode === "words") {
    mode2 = config.words;
  } else if (config.mode === "quote") {
    mode2 = config.quoteLength === undefined ? "-1" : config.quoteLength;
  }
  MP.socket.emit("mp_room_create", {
    config: {
      mode: config.mode,
      mode2: mode2,
      difficulty: config.difficulty,
      blindMode: config.blindMode,
      language: config.language,
      funbox: activeFunBox,
      stopOnError: config.stopOnError,
      confidenceMode: config.confidenceMode,
      customText: customText,
      punctuation: config.punctuation,
      numbers: config.numbers,
      minWpm: config.minWpm === "custom" ? config.minWpmCustomSpeed : null,
      minAcc: config.minAcc === "custom" ? config.minAccCustom : null,
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
    MP.socket.emit("mp_chat_message", {
      isSystem: false,
      isLeader: MP.room.isLeader,
      message: msg,
      from: {
        id: MP.socket.id,
        name: MP.name,
      },
    });
    $(".pageTest #result .tribeResultChat .chat .input input").val("");
    $(".pageTribe .lobby .chat .input input").val("");
  }
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
    mp_sendIsTypingUpdate(false);
    MP.socket.emit("mp_chat_message", {
      isSystem: false,
      isLeader: MP.room.isLeader,
      message: msg,
      from: {
        id: MP.socket.id,
        name: MP.name,
      },
    });
    $(".pageTribe .lobby .chat .input input").val("");
    $(".pageTest #result .tribeResultChat .chat .input input").val("");
  }
});

$(
  ".pageTribe .lobby .chat .input input, .pageTest #result .tribeResultChat .chat .input input"
).on("input", (e) => {
  if (e.currentTarget.value.length === 1) {
    //typing update
    mp_sendIsTypingUpdate(true);
  } else if (e.currentTarget.value == "") {
    //not typing update
    mp_sendIsTypingUpdate(false);
  }
});

$(
  ".pageTribe .lobby .chat .messages, .pageTest #result .tribeResultChat .chat .messages"
).on("scroll", (e) => {
  let chatEl = $(".pageTribe .lobby .chat .messages")[0];
  scrollChat = chatEl.scrollHeight - chatEl.scrollTop === chatEl.clientHeight;
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

$(".pageTribe .prelobby #joinByCode .button").click((e) => {
  let code = $(".pageTribe .prelobby #joinByCode input").val().toLowerCase();
  if (code.length !== 6) {
    Notifications.add("Code required", 0);
  } else {
    mp_joinRoomByCode(code);
  }
});

$(".pageTribe .prelobby #joinByCode input").keyup((e) => {
  if (e.key === "Enter") {
    let code = $(".pageTribe .prelobby #joinByCode input").val().toLowerCase();
    if (code.length !== 6) {
      Notifications.add("Code required", 0);
    } else {
      mp_joinRoomByCode(code);
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
  MP.socket.emit("mp_room_leave");
});

$(".pageTribe .lobby .lobbyButtons .startTestButton").click((e) => {
  mp_startTest();
});

$(
  `.pageTribe .lobby .lobbyButtons .userReadyButton,
  .pageTest #result #readyButton,
  .pageTest #result .resultMpButtons .userReadyButton`
).click((e) => {
  mp_userReady();
});

$(
  `.pageTribe .lobby .lobbyButtons .userReadyButton,
  .pageTest #result #readyButton,
  .pageTest #result .resultMpButtons .userReadyButton`
).on("keypress", (event) => {
  if (event.keyCode == 13) {
    mp_userReady();
  }
});

$(document).on("keypress", (e) => {
  if ((MP.state === 10 || MP.state === 29) && e.key === "Enter" && e.shiftKey) {
    if (MP.room.isLeader) {
      mp_startTest();
    } else {
      mp_userReady();
    }
  }
});

$(".pageTest #result #backToLobbyButton").click((e) => {
  MP.socket.emit("mp_room_back_to_lobby");
});

$(document).on(
  "click",
  ".pageTribe .lobby .currentSettings .groups .group",
  (e) => {
    if (MP.room.isLeader) {
      let commands = eval($(e.currentTarget).attr("commands"));
      let func = $(e.currentTarget).attr("function");
      if (commands != undefined) {
        currentCommands.push(commands);
        showCommandLine();
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
  MP.socket.emit("mp_room_new_leader", { sid: sid });
  hideTribeUserSettingsPopup();
});

$(document).on("click", "#tribeUserSettingsPopup .buttons .ban", (e) => {
  let sid = $("#tribeUserSettingsPopup").attr("sid");
  MP.socket.emit("mp_room_ban_user", { sid: sid });
  hideTribeUserSettingsPopup();
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
      callbacks: {
        afterLabel: function (ti, data) {
          try {
            $(".wordInputAfter").remove();

            let wordsToHighlight =
              keypressPerSecond[parseInt(ti.xLabel) - 1].words;

            let unique = [...new Set(wordsToHighlight)];
            unique.forEach((wordIndex) => {
              let wordEl = $($("#resultWordsHistory .words .word")[wordIndex]);
              let input = wordEl.attr("input");
              if (input != undefined)
                wordEl.append(`<div class="wordInputAfter">${input}</div>`);
            });
          } catch (e) {}
        },
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
