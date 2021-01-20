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
      MP.pageTransition = false;
      MP.activePage = newPage;
    }
  );
}

function mp_refreshUserList() {
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTest #result .tribeResultChat .userlist .list").empty();
  let sortedUsers = MP.room.users.sort((a, b) => b.points - a.points);
  sortedUsers.forEach((user) => {
    let star = "";
    if (user.isLeader) {
      if (user.socketId === MP.socket.id) {
        MP.room.isLeader = true;
      }

      star = '<i class="fas fa-star"></i>';
    }
    let pointsString;
    if (user.points == undefined) {
      pointsString = "";
    } else {
      pointsString = user.points + (user.points == 1 ? "pt" : "pts");
    }
    $(".pageTribe .lobby .userlist .list").append(`
    <div class='user ${user.socketId === MP.id ? "me" : ""}'>
    <div class='name'>${
      user.name
    } ${star}</div><div class='points'>${pointsString}</div>
    </div>
    `);
    $(".pageTest #result .tribeResultChat .userlist .list").append(`
    <div class='user ${user.socketId === MP.id ? "me" : ""}'>
    <div class='name'>${
      user.name
    } ${star}</div><div class='points'>${pointsString}</div>
    </div>
    `);
  });
}

function mp_resetLobby() {
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTest #result .tribeResultChat .chat .messages").empty();
  $(".pageTest #result .tribeResultChat .userlist .list").empty();
  $(".pageTribe .lobby .chat .messages").empty();
  $(".pageTribe .lobby .inviteLink .code .text").text("");
  $(".pageTribe .lobby .inviteLink .link").text("");
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
}

function mp_checkIfCanChangeConfig(mp) {
  if (MP.state >= 10) {
    if (MP.state >= 20) {
      Notifications.add("You can't change settings during the test", 0);
      return false;
    } else if (MP.room.isLeader) {
      return true;
    } else {
      if (mp) return true;
      Notifications.add("Only the leader can change this setting", 0);
      return false;
    }
  } else {
    return true;
  }
}

function mp_syncConfig() {
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
    },
  });
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
  MP.socket.emit("mp_room_test_start");
}

function mp_sendTestProgress(wpm, acc, progress) {
  if (MP.state >= 21 && MP.state <= 28 && testActive) {
    MP.socket.emit("mp_room_test_progress_update", {
      socketId: MP.socket.id,
      roomId: MP.room.id,
      stats: {
        wpm: wpm,
        acc: acc,
        progress: progress,
      },
    });
  }
}

function mp_refreshTestUserList() {
  $(".tribePlayers").empty();
  MP.room.users.forEach((user) => {
    let me = "";
    if (user.socketId === MP.socket.id) {
      me = " me";
    }
    $(".tribePlayers").append(`
    <tr class="player ${me}" socketId="${user.socketId}">
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
  });
  $(".tribePlayers").removeClass("hidden");

  $(".tribeResult table tbody").empty();
  MP.room.users.forEach((user) => {
    let me = "";
    if (user.socketId === MP.socket.id) {
      me = " me";
    }
    $(".tribeResult table tbody").append(`
    <tr class="player ${me}" socketId="${user.socketId}">
      <td class="name">${user.name}</td>
      <td class="wpm">-</td>
      <td class="acc">-</td>
      <td class="progress" colspan="3">
        <div class="barBg">
          <div class="bar" style="width: 0%;"></div>
        </div>
      </td>
      <td class="pos"><span class="num">-</span><span class="points"></span></td>
      <td class="crown"><i class="fas fa-crown" style="opacity:0"></i></td>
    </tr>
    `);
  });
  $(".tribeResult").removeClass("hidden");
}

function mp_refreshConfig() {
  if (MP.room == undefined) return;
  $(".pageTribe .lobby .currentSettings .groups").empty();

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Mode" data-balloon-pos="up">
    <i class="fas fa-bars"></i>${MP.room.config.mode}
    </div>
    `);

  if (MP.room.config.mode === "time") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Time" data-balloon-pos="up">
    <i class="fas fa-clock"></i>${MP.room.config.mode2}
    </div>
    `);
  } else if (MP.room.config.mode === "words") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Words" data-balloon-pos="up">
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
    <div class='group' aria-label="Quote length" data-balloon-pos="up">
    <i class="fas fa-quote-right"></i>${qstring}
    </div>
    `);
  }

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Language" data-balloon-pos="up">
    <i class="fas fa-globe-americas"></i>${MP.room.config.language}
    </div>
    `);

  if (MP.room.config.difficulty === "normal") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up">
    <i class="far fa-star"></i>normal
    </div>
    `);
  } else if (MP.room.config.difficulty === "expert") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up">
    <i class="fas fa-star-half-alt"></i>expert
    </div>
    `);
  } else if (MP.room.config.difficulty === "master") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Difficulty" data-balloon-pos="up">
    <i class="fas fa-star"></i>master
    </div>
    `);
  }

  if (MP.room.config.blindMode) {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Blind mode" data-balloon-pos="up">
    <i class="fas fa-eye-slash"></i>blind
    </div>
    `);
  } else {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Blind mode" data-balloon-pos="up">
    <i class="fas fa-eye-slash"></i>off
    </div>
    `);
  }

  $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Funbox" data-balloon-pos="up">
    <i class="fas fa-gamepad"></i>${MP.room.config.funbox}
    </div>
    `);

  if (MP.room.config.confidenceMode === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up">
    <i class="fas fa-backspace"></i>off
    </div>
    `);
  } else if (MP.room.config.confidenceMode === "on") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up">
    <i class="fas fa-backspace"></i>confidence
    </div>
    `);
  } else if (MP.room.config.confidenceMode === "max") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Confidence mode" data-balloon-pos="up">
    <i class="fas fa-backspace"></i>max
    </div>
    `);
  }

  if (MP.room.config.stopOnError === "off") {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up">
    <i class="fas fa-hand-paper"></i>off
    </div>
    `);
  } else {
    $(".pageTribe .lobby .currentSettings .groups").append(`
    <div class='group' aria-label="Stop on error" data-balloon-pos="up">
    <i class="fas fa-hand-paper"></i>stop on ${MP.room.config.stopOnError}
    </div>
    `);
  }
}

function mp_testFinished(result) {
  MP.socket.emit("mp_room_test_finished", { result: result });
}

function showCountdown() {
  $("#tribeCountdownWrapper").removeClass("hidden");
}

function hideCountdown() {
  $("#tribeCountdownWrapper").addClass("hidden");
}

function updateCountdown(text) {
  $("#tribeCountdownWrapper #tribeCountdown").text(text);
}

function fadeoutCountdown() {
  $("#tribeCountdownWrapper")
    .css("opacity", 1)
    .animate(
      {
        opacity: 0,
      },
      1000,
      () => {
        $("#tribeCountdownWrapper").addClass("hidden").css("opacity", 1);
      }
    );
}

MP.socket.on("connect", (f) => {
  MP.state = 1;
  MP.reconnectionAttempts = 0;
  Notifications.add("Connected to Tribe", 1);
  let name = "Guest";
  if (firebase.auth().currentUser !== null) {
    name = firebase.auth().currentUser.displayName;
  }
  MP.id = MP.socket.id;
  MP.name = name;
  MP.socket.emit("mp_system_name_set", { name: name });
  setTimeout(() => {
    if (MP.autoJoin) {
      MP.socket.emit("mp_room_join", { roomId: MP.autoJoin });
      MP.autoJoin = undefined;
      mp_changeActiveSubpage("lobby");
      // swapElements($(".pageTribe .preloader"), $(".pageTribe .lobby"), 250);
    } else {
      // swapElements($(".pageTribe .preloader"), $(".pageTribe .prelobby"), 250);
      mp_changeActiveSubpage("prelobby");
    }
  }, 250);
});

MP.socket.on("mp_update_name", (data) => {
  MP.name = data.newName;
});

MP.socket.on("disconnect", (f) => {
  MP.state = -1;
  MP.room = undefined;
  Notifications.add("Disconnected from Tribe", 0);
  mp_resetLobby();
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
    $(".pageTribe .preloader .text").text(`Disconnected from Tribe`);
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
    $(".pageTribe .preloader .text").text(`Disconnected from Tribe`);
  } else {
    $(".pageTribe .preloader .text").text("Connection error. Retrying");
    Notifications.add("Tribe connection error: " + f.message, -1);
  }
});

MP.socket.on("mp_room_joined", (data) => {
  MP.room = data.room;
  if (
    MP.room.users.filter((user) => user.socketId === MP.socket.id)[0].isLeader
  ) {
    MP.room.isLeader = true;
  }
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
    mp_changeActiveSubpage("lobby");
    MP.state = 10;
    // swapElements($(".pageTribe .prelobby"), $(".pageTribe .lobby"), 250, () => {
    //   MP.state = 10;
    //   // $(".pageTribe .prelobby").addClass('hidden');
    // });
    if (MP.room.isLeader) {
      $(".pageTribe .lobby .startTestButton").removeClass("hidden");
    } else {
      $(".pageTribe .lobby .startTestButton").addClass("hidden");
    }
  }
});

MP.socket.on("mp_room_leave", () => {
  MP.state = 1;
  MP.room = undefined;
  MP.name.replace(/\(\d\)$/g, "");
  mp_resetLobby();
  mp_changeActiveSubpage("prelobby");
  // swapElements($(".pageTribe .lobby"), $(".pageTribe .prelobby"), 250);
});

MP.socket.on("mp_room_user_left", (data) => {
  MP.room = data.room;
  if (data.newLeader !== "" && data.newLeader === MP.id) {
    MP.room.isLeader = true;
    $(".pageTribe .lobby .lobbyButtons .startTestButton").removeClass("hidden");
    $(".pageTest #result #backToLobbyButton").removeClass("hidden");
    $(".pageTest #result #nextTestButton").removeClass("hidden");
  }
  mp_refreshUserList();
});

MP.socket.on("mp_room_config_update", (data) => {
  MP.room.config = data.newConfig;
  mp_refreshConfig();
  if (!MP.room.isLeader) mp_applyRoomConfig(MP.room.config);
});

MP.socket.on("mp_chat_message", (data) => {
  let cls = "message";
  let author = "";
  if (data.isSystem) {
    cls = "systemMessage";
  } else {
    author = `<div class="author">${data.from.name}</div>`;
  }
  $(".pageTribe .lobby .chat .messages").append(`
    <div class="${cls}">${author}${data.message}</div>
  `);
  $(".pageTest #result .tribeResultChat .chat .messages").append(`
    <div class="${cls}">${author}${data.message}</div>
  `);

  let chatEl = $(".pageTribe .lobby .chat .messages");
  chatEl.animate(
    {
      scrollTop:
        $($(".pageTribe .lobby .chat .message")[0]).outerHeight() *
        2 *
        $(".pageTribe .lobby .chat .messages .message").length,
    },
    0
  );

  let chatEl2 = $(".pageTest #result .tribeResultChat .chat .messages");
  chatEl2.animate(
    {
      scrollTop:
        $(
          $(".pageTest #result .tribeResultChat .chat .messages .message")[0]
        ).outerHeight() *
        2 *
        $(".pageTest #result .tribeResultChat .chat .messages .message").length,
    },
    0
  );
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
  // changePage('');
  // mp_testCountdown();
  // startTest();
  setTimeout(() => {
    if (!testActive) {
      startTest();
    }
  }, 500);
  // Notifications.add("test starting",0);
  updateCountdown("Go");
  fadeoutCountdown();
});

MP.socket.on("mp_room_test_countdown", (data) => {
  updateCountdown(data.val);
  // Notifications.add(`countdown ${data.val}`,0);
});

MP.socket.on("mp_room_finishTimer_countdown", (data) => {
  showCountdown();
  updateCountdown(data.val);
});

MP.socket.on("mp_room_finishTimer_over", (data) => {
  if (testActive) showResult(undefined, true);
});

MP.socket.on("mp_room_test_init", (data) => {
  MP.room.testStats = {};
  seedrandom(data.seed, { global: true });
  mp_refreshTestUserList();
  changePage("");
  restartTest(false, true, true);
  showCountdown();
});

MP.socket.on("mp_room_state_update", (data) => {
  MP.state = data.newState;
  // Notifications.add(`state changed to ${data.newState}`, 0);
});

MP.socket.on("mp_room_user_test_progress_update", (data) => {
  $(`.tribePlayers .player[socketId=${data.socketId}] .wpm`).text(
    data.stats.wpm
  );
  $(`.tribePlayers .player[socketId=${data.socketId}] .acc`).text(
    Math.floor(data.stats.acc) + "%"
  );
  $(`.tribeResult table .player[socketId=${data.socketId}] .wpm`).text(
    data.stats.wpm
  );
  $(`.tribeResult table .player[socketId=${data.socketId}] .acc`).text(
    Math.floor(data.stats.acc) + "%"
  );
  $(`.tribePlayers .player[socketId=${data.socketId}] .bar`)
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
  $(`.tribeResult table .player[socketId=${data.socketId}] .bar`)
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

MP.socket.on("mp_room_user_finished", (data) => {
  $(`.tribeResult table .player[socketId=${data.socketId}] .wpm`).text(
    data.result.wpm
  );
  $(`.tribeResult table .player[socketId=${data.socketId}] .acc`).text(
    data.result.acc + "%"
  );
  $(`.tribeResult table .player[socketId=${data.socketId}] .progress`).remove();
  $(`.tribeResult table .player[socketId=${data.socketId}] .acc`).after(`
    <td class="raw"></div>
    <td class="con"></div>
    <td class="char"></div>
  `);
  $(`.tribeResult table .player[socketId=${data.socketId}] .raw`).text(
    data.result.raw
  );
  let val = "";
  if (!data.result.invalid && !data.result.failed && !data.result.outOfTime) {
    val = data.result.char;
  } else if (data.result.invalid) {
    val = "invalid";
  } else if (data.result.failed) {
    val = "failed";
  } else if (data.result.outOfTime) {
    val = "out of time";
  }
  $(`.tribeResult table .player[socketId=${data.socketId}] .char`).text(val);
  $(`.tribeResult table .player[socketId=${data.socketId}] .con`).text(
    data.result.con + "%"
  );

  if (config.mode !== "time") {
    $(`.tribePlayers .player[socketId=${data.socketId}] .bar`)
      .stop(true, false)
      .animate(
        {
          width: "100%",
        },
        1000,
        "linear"
      );
    $(`.tribeResult table .player[socketId=${data.socketId}] .bar`)
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
  data.sorted.forEach((sid) => {
    $(`.tribeResult table [socketId=${sid.sid}] .pos .num`).text(
      `${pos}${Misc.getNumberSuffix(pos)}`
    );
    if (data.official && pos == 1) {
      $(`.tribeResult table [socketId=${sid.sid}] .crown .fa-crown`).animate(
        { opacity: 1 },
        125
      );
    } else {
      $(`.tribeResult table [socketId=${sid.sid}] .crown .fa-crown`).css(
        "opacity",
        0
      );
    }
    pos++;
  });
});

MP.socket.on("mp_room_points", (data) => {
  data.users.forEach((user) => {
    $(`.tribeResult table [socketId=${user.sid}] .pos .points`).text(
      `+${user.newPoints}${user.newPoints == 1 ? "pt" : "pts"}`
    );
    MP.room.users.filter((u) => u.socketId == user.sid)[0].points =
      user.totalPoints;
  });
  mp_refreshUserList();
});

MP.socket.on("mp_room_back_to_lobby", (data) => {
  changePage("tribe");
});

$(".pageTribe #createPrivateRoom").click((f) => {
  activateFunbox("none");
  setLanguage("english");
  setMode("quote");
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
    },
  });
});

$(".pageTest #result .tribeResultChat .chat .input input").keyup((e) => {
  if (e.keyCode === 13) {
    let msg = $(".pageTest #result .tribeResultChat .chat .input input").val();
    if (msg === "") return;
    MP.socket.emit("mp_chat_message", {
      isSystem: false,
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
    if (msg === "") return;
    MP.socket.emit("mp_chat_message", {
      isSystem: false,
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

$(".pageTribe .lobby .inviteLink .text").click(async (e) => {
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

$(".pageTribe .lobby .inviteLink .text").hover(
  function () {
    $(this).css("color", "#" + $(".pageTribe .lobby .inviteLink .text").text());
  },
  function () {
    $(this).css("color", "");
  }
);

$(".pageTribe .lobby .inviteLink .link").click(async (e) => {
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
});

$(".pageTribe .lobby .lobbyButtons .leaveRoomButton").click((e) => {
  MP.socket.emit("mp_room_leave");
});

$(".pageTribe .lobby .lobbyButtons .startTestButton").click((e) => {
  mp_startTest();
});

$(".pageTest #result #backToLobbyButton").click((e) => {
  MP.socket.emit("mp_room_back_to_lobby");
});
