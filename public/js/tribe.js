let MP = {
  state: -1,
  socket: io('localhost:3000', { autoConnect: false, reconnectionAttempts: 3 }),
  reconnectionAttempts: 0,
}

//-1 - disconnected
//1 - connected
//10 - lobby
//20 - test about to start
//21 - test active
//29 - test finished, result 

function mp_init() {
  $(".pageTribe .preloader .text").text('Connecting to Tribe');
  MP.socket.connect();
}

function mp_refreshUserList() {
  $(".pageTribe .lobby .userlist .list").empty();
  MP.room.users.forEach(user => {
    let crown = '';
    if (user.isLeader) {
      crown = '<i class="fas fa-star"></i>';
    }
    $(".pageTribe .lobby .userlist .list").append(`
    <div class='user'>${user.name} ${crown}</div>
    `)
  })
}

function mp_resetLobby(){
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTribe .lobby .chat .messages").empty();
  $(".pageTribe .lobby .inviteLink").text('');
}

function mp_applyRoomConfig(cfg) {
  changeMode(cfg.mode, true, true);
  if (cfg.mode === "time") {
    changeTimeConfig(cfg.mode2, true, true);
  } else if (cfg.mode === "words") {
    changeWordCount(cfg.mode2, true, true);
  } else if (cfg.mode === "quote") {
    changeQuoteLength(cfg.mode2, true, true);
  }
  setDifficulty(cfg.difficulty, true, true);
  setBlindMode(cfg.blindMode, true, true);
  changeLanguage(cfg.language, true, true);
  activateFunbox(cfg.funbox, true, true);
  setStopOnError(cfg.stopOnError, true, true);
  setConfidenceMode(cfg.confidenceMode, true, true);
}

function mp_checkIfCanChangeConfig() {
  if (MP.state >= 10) {
    if (MP.room.isLeader) {
      return true;
    } else {
      showNotification("Only the leader can change this setting", 3000);
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
      confidenceMode: config.confidenceMode
  }});
}

function mp_joinRoomByCode(code) {
  code = "room_" + code;
  MP.socket.emit("mp_room_join",{roomId:code});
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
  } else if (MP.room.config.difficulty === "master"){
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
  } else if (MP.room.config.confidenceMode === "max"){
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

MP.socket.on('connect', (f) => {
  MP.state = 1;
  MP.reconnectionAttempts = 0;
  showNotification('Connected to Tribe', 1000);
  let name = "Guest";
  if (firebase.auth().currentUser !== null) {
    name = firebase.auth().currentUser.displayName
  }
  MP.id = MP.socket.id;
  MP.name = name;
  MP.socket.emit("mp_system_name_set", { name: name });
  $(".pageTribe .lobby div").removeClass('hidden');
  $(".pageTribe .prelobby div").removeClass('hidden');
  if (MP.autoJoin) {
    MP.socket.emit("mp_room_join", { roomId: MP.autoJoin });
    MP.autoJoin = undefined;
    swapElements($(".pageTribe .preloader"), $(".pageTribe .lobby"), 250);
  } else {
    swapElements($(".pageTribe .preloader"), $(".pageTribe .prelobby"), 250);
  }
})

MP.socket.on('disconnect', (f) => {
  MP.state = -1;
  MP.room = undefined;
  showNotification('Disconnected from Tribe', 1000);
  mp_resetLobby();
  $(".pageTribe div").addClass("hidden");
  $('.pageTribe .preloader').removeClass('hidden').css('opacity',1);
  $(".pageTribe .preloader").html(`
  <i class="fas fa-fw fa-times"></i>
            <div class="text">Disconnected from tribe</div>
            `);
})

MP.socket.on('connect_failed', (f) => {
  MP.state = -1;
  MP.reconnectionAttempts++;
  if (MP.reconnectionAttempts === 4) {
    $(".pageTribe .preloader").html(`
    <i class="fas fa-fw fa-times" aria-hidden="true"></i>
    <div class="text">Connection failed.</div>
            `);
  } else {
    $(".pageTribe .preloader .text").text('Connection failed. Retrying');
  }
})

MP.socket.on('connect_error', (f) => {
  MP.state = -1;
  MP.reconnectionAttempts++;
  console.error(f);
  if (MP.reconnectionAttempts === 4) {
    $(".pageTribe .preloader").html(`
    <i class="fas fa-fw fa-times" aria-hidden="true"></i>
    <div class="text">Connection failed</div>
            `);
  } else {
    $(".pageTribe .preloader .text").text('Connection error. Retrying');
    showNotification('Tribe connection error: ' + f.message, 3000);
  }
})

MP.socket.on('mp_room_joined', data => {
  MP.room = data.room;
  if (MP.room.users.filter(user => user.socketId === MP.socket.id)[0].isLeader) {
    MP.room.isLeader = true;
  }
  mp_refreshUserList();
  if (MP.state === 10) {
    //user is already in the room and somebody joined
  } else if(MP.state === 1) {
    //user is in prelobby and joined a room
    mp_applyRoomConfig(MP.room.config);
    mp_refreshConfig();
    let link = "www.monkeytype.com/tribe" + MP.room.id.substring(4);
    $(".pageTribe .lobby .inviteLink .code .text").text(MP.room.id.substring(5));
    $(".pageTribe .lobby .inviteLink .link").text(link);
    swapElements($(".pageTribe .prelobby"), $(".pageTribe .lobby"), 250, () => {
      MP.state = 10;
      // $(".pageTribe .prelobby").addClass('hidden');
    });
  }
})

MP.socket.on('mp_room_leave', () => {
  MP.state = 1;
  MP.room = undefined;
  mp_resetLobby();
  swapElements($('.pageTribe .lobby'), $(".pageTribe .prelobby"), 250);
})

MP.socket.on('mp_room_user_left', data => {
  MP.room = data.room;
  mp_refreshUserList();
})

MP.socket.on('mp_room_config_update', data => {
  MP.room.config = data.newConfig;
  mp_refreshConfig();
})

MP.socket.on('mp_chat_message', data => {
  let cls = "message";
  let author = '';
  if (data.isSystem) {
    cls = "systemMessage";
  } else {
    author = `<div class="author">${data.from.name}</div>`;
  }
  $(".pageTribe .lobby .chat .messages").append(`
    <div class="${cls}">${author}${data.message}</div>
  `);
  let chatEl = $(".pageTribe .lobby .chat .messages");
  chatEl.animate({ scrollTop: $($(".pageTribe .lobby .chat .message")[0]).outerHeight() * 2 * $(".pageTribe .lobby .chat .messages .message").length }, 0);
})

MP.socket.on('mp_system_message', data => {
  showNotification(`Tribe: ${data.message}`,2000);
})

$(".pageTribe #createPrivateRoom").click(f => {
  activateFunbox("none");
  changeLanguage("english");
  changeMode("quote");
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
      confidenceMode: config.confidenceMode
    }
  });
})

$(".pageTribe .lobby .chat .input input").keyup(e => {
  if (e.keyCode === 13) {
    let msg = $(".pageTribe .lobby .chat .input input").val();
    MP.socket.emit('mp_chat_message',
      {
        isSystem: false,
        message: msg,
        from: {
          id: MP.socket.id,
          name: MP.name
        }
      });
    $(".pageTribe .lobby .chat .input input").val('');
  }
})

$(".pageTribe .lobby .inviteLink .text").click(async e => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .lobby .inviteLink .text").text()
    );
    showNotification("Code copied", 1000);
  } catch (e) {
    showNotification("Could not copy to clipboard: " + e, 5000);
  }
})

$(".pageTribe .lobby .inviteLink .link").click(async e => {
  try {
    await navigator.clipboard.writeText(
      $(".pageTribe .lobby .inviteLink .link").text()
    );
    showNotification("Link copied", 1000);
  } catch (e) {
    showNotification("Could not copy to clipboard: " + e, 5000);
  }
})

$(".pageTribe .prelobby #joinByCode .customInput").click(e => {
  $(".pageTribe .prelobby #joinByCode input").focus();
})

$(".pageTribe .prelobby #joinByCode input").focus(e => {
  $(".pageTribe .prelobby #joinByCode .customInput .byte").addClass('focused');
})

$(".pageTribe .prelobby #joinByCode input").focusout(e => {
  $(".pageTribe .prelobby #joinByCode .customInput .byte").removeClass('focused');
})

$(".pageTribe .prelobby #joinByCode .button").click(e => {
  let code = $(".pageTribe .prelobby #joinByCode input").val();
  if (code.length !== 6) {
    showNotification("Code required", 2000);
  } else {
    mp_joinRoomByCode(code);
  }
})

$(".pageTribe .prelobby #joinByCode input").keyup(e => {
  setTimeout(t => {
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
      let char = v[i] == undefined ? '-' : v[i];
      code.push(char);
    }
    let text = code.join('');
    $($(".pageTribe .prelobby #joinByCode .customInput .byte")[0]).text(text.substring(0,2));
    $($(".pageTribe .prelobby #joinByCode .customInput .byte")[1]).text(text.substring(2,4));
    $($(".pageTribe .prelobby #joinByCode .customInput .byte")[2]).text(text.substring(4,6));
  },0)
})

$(".pageTribe .lobby .lobbyButtons .leaveRoomButton").click(e => {
  MP.socket.emit('mp_room_leave');
})