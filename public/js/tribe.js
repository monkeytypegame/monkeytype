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

function resetLobby(){
  $(".pageTribe .lobby .userlist .list").empty();
  $(".pageTribe .lobby .chat .messages").empty();
  $(".pageTribe .lobby .inviteLink").text('');
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
  if (MP.autoJoin) {
    MP.socket.emit("mp_room_join", { roomId: MP.autoJoin });
    MP.autoJoin = undefined;
  }
  swapElements($(".pageTribe .preloader"), $(".pageTribe .prelobby"), 250);
})

MP.socket.on('disconnect', (f) => {
  MP.state = -1;
  MP.room = undefined;
  showNotification('Disconnected from Tribe', 1000);
  resetLobby();
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

  mp_refreshUserList();
  if (MP.state === 10) {
    //user is already in the room and somebody joined
  } else if(MP.state === 1) {
    //user is in prelobby and joined a room
    let link = "www.monkey-type.com/tribe" + MP.room.id.substring(4);
    $(".pageTribe .lobby .inviteLink").text(link);
    swapElements($(".pageTribe .prelobby"), $(".pageTribe .lobby"), 250, () => {MP.state = 10});
  }
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
  MP.socket.emit("mp_room_create");
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