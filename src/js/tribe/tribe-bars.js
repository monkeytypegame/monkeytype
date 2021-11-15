import * as Tribe from "./tribe";
import Config from "./config";
import * as TestTimer from "./test-timer";

export function init(page) {
  let el;
  if (page === "test") {
    el = $(".pageTest #typingTest .tribeBars");
  }
  let room = Tribe.room;
  el.empty();
  Object.keys(room.users).forEach((userId) => {
    let user = room.users[userId];
    let me = false;
    if (userId === Tribe.socket.id) me = true;
    if (user.isTyping) {
      el.append(`
      <tr class="player ${me ? "me" : ""}" id="${userId}">
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
}

export function show(page) {
  if (page === "test") {
    $(".pageTest #typingTest .tribeBars").removeClass("hidden");
  }
}

export function hide(page) {
  if (page === "test") {
    $(".pageTest #typingTest .tribeBars").addClass("hidden");
  }
}

export function update(page, userId) {
  let el;
  if (page === "test") {
    el = $(".pageTest #typingTest .tribeBars");
  }
  let user = Tribe.room.users[userId];
  el.find(`.player[id=${userId}] .wpm`).text(user.progress.wpm);
  el.find(`.player[id=${userId}] .acc`).text(user.progress.acc);
  el.find(`.player[id=${userId}] .bar`)
    .stop(true, false)
    .animate(
      {
        width:
          Config.mode === "time"
            ? user.progress.wpmProgress + "%"
            : user.progress.progress + "%",
      },
      TestTimer.slowTimer ? 0 : 1000,
      "linear"
    );
}

export function sendUpdate(wpm, raw, acc, progress) {
  Tribe.socket.emit("room_progress_update", {
    wpm: wpm,
    raw: raw,
    acc: acc,
    progress: progress,
  });
}

// function refreshTestUserList() {
//   $(".tribePlayers").empty();
//   Object.keys(room.users).forEach((sid) => {
//     if (
//       (room.private &&
//         (room.users[sid].isTyping ||
//           room.users[sid].isReady ||
//           room.users[sid].isLeader)) ||
//       !room.private
//     ) {
//       let user = room.users[sid];
//       let me = "";
//       if (sid === socket.id) {
//         me = " me";
//       }
//       $(".tribePlayers").append(`
//       <tr class="player ${me}" sid="${sid}">
//         <td class="name">${user.name}</td>
//         <td class="progress">
//           <div class="barBg">
//             <div class="bar" style="width: 0%;"></div>
//           </div>
//         </td>
//         <td class="stats">
//           <div class="wpm">-</div>
//           <div class="acc">-</div>
//         </td>
//       </tr>
//       `);
//     }
//   });
//   $(".tribePlayers").removeClass("hidden");

//   $(".tribeResult table tbody").empty();
//   Object.keys(room.users).forEach((sid) => {
//     if (
//       (room.private &&
//         (room.users[sid].isTyping ||
//           room.users[sid].isReady ||
//           room.users[sid].isLeader)) ||
//       !room.private
//     ) {
//       let user = room.users[sid];
//       let me = "";
//       if (sid === socket.id) {
//         me = " me";
//       }
//       $(".tribeResult table tbody").append(`
//       <tr class="player ${me}" sid="${sid}">
//         <td class="name">${user.name}</td>
//         <td class="pos"><span class="num">-</span><span class="points"></span></td>
//         <td class="crown"><i class="fas fa-crown" style="opacity:0"></i></td>
//         <td>
//           <div class="wpm">
//             <div class="text">-</div>
//             <div class="miniCrown"><i class="fas fa-crown"></i></div>
//           </div>
//           <div class="acc">
//             <div class="text">-</div>
//             <div class="miniCrown"><i class="fas fa-crown"></i></div>
//           </div>
//         </td>
//         <td>
//           <div class="raw">
//             <div class="text">-</div>
//             <div class="miniCrown"><i class="fas fa-crown"></i></div>
//           </div>
//           <div class="con">
//             <div class="text">-</div>
//             <div class="miniCrown"><i class="fas fa-crown"></i></div>
//           </div>
//         </td>
//         <td>
//           <div class="char">-</div>
//           <div class="other">-</div>
//         </td>
//         <td class="progressAndGraph">
//           <div class="progress">
//             <div class="barBg">
//               <div class="bar" style="width: 0%;"></div>
//             </div>
//           </div>
//           <div class="graph hidden" style="height: 50px">
//             <canvas></canvas>
//           </div>
//         </td>
//       </tr>
//       `);
//     }
//   });
//   $(".tribeResult").removeClass("hidden");
// }
