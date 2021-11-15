import * as Tribe from "./tribe";

let initialised = {};

export function send(result) {
  Tribe.socket.emit("room_result", { result });
}

export function reset(page) {
  if (page == "result") {
    initialised[page] = {};
    $(".pageTest #result #tribeResults").empty();
    $(".pageTest #result #tribeResults").addClass("hidden");
  }
}

export function init(page) {
  if (page === "result") {
    reset(page);

    let el = $(".pageTest #result #tribeResults");

    Object.keys(Tribe.room.users).forEach((userId) => {
      el.append(`
        <tr class="user" id="${userId}">
          <td class="name">${Tribe.room.users[userId].name}</td>
          <td class="points">-</td>
          <td class="wpm">-</td>
          <td class="raw">-</td>
          <td class="acc">-</td>
          <td class="consistency">-</td>
        </tr>
      `);
    });

    $(".pageTest #result #tribeResults").removeClass("hidden");
    initialised[page] = true;
  }
}

export function update(page, userId) {
  if (!initialised[page]) init(page);
  if (userId) {
    updateUser(page, userId);
  } else {
    Object.keys(Tribe.room.users).forEach((userId) => {
      updateUser(page, userId);
    });
  }
}

function updateUser(page, userId) {
  if (page == "result") {
    let userEl = $(`.pageTest #result #tribeResults .user[id="${userId}"]`);
    let user = Tribe.room.users[userId];
    if (user.isFinished) {
      userEl.find(`.wpm`).text(user.result.wpm);
      userEl.find(`.raw`).text(user.result.raw);
      userEl.find(`.acc`).text(user.result.acc);
      userEl.find(`.consistency`).text(user.result.consistency);
    }
  }
}
