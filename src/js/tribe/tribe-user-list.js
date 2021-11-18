import * as Tribe from "./tribe";

export function reset(page) {
  if (page === undefined) {
    $(".pageTribe .tribePage.lobby .userlist .list").empty();
    $(".pageTest #result #tribeResultBottom .userlist .list").empty();
  } else if (page === "lobby") {
    $(".pageTribe .tribePage.lobby .userlist .list").empty();
  } else if (page === "result") {
    $(".pageTest #result #tribeResultBottom .userlist .list").empty();
  }
}

export function update(page) {
  reset(page);
  let usersArray = [];
  Object.keys(Tribe.room.users).forEach((userId) => {
    usersArray.push(Tribe.room.users[userId]);
  });
  let sortedUsers = usersArray.sort((a, b) => b.points - a.points);
  sortedUsers.forEach((user) => {
    let icons = "";
    if (user.isTyping && !user.isFinished) {
      icons += `<div class="icon active"><i class="fas fa-fw fa-keyboard"></i></div>`;
    } else if (user.isAfk) {
      icons += `<div class="icon active"><i class="fas fa-fw fa-mug-hot"></i></div>`;
    } else if (user.isLeader) {
      icons += `<div class="icon active"><i class="fas fa-fw fa-star"></i></div>`;
    } else {
      icons += `<div class="icon ${
        user.isReady ? "active" : ""
      }"><i class="fas fa-fw fa-check"></i></div>`;
    }
    let pointsString;
    if (user.points == undefined) {
      pointsString = "";
    } else {
      pointsString = user.points + (user.points == 1 ? "pt" : "pts");
    }
    let appendData = `
    <div class='user ${user.id === Tribe.socket.id ? "me" : ""} ${
      user.isAfk ? "afk" : ""
    }'>
    <div class="nameAndIcons">
      <div class='icons'>
      ${icons}
      </div>
      <div class='name'>
      ${user.name}
      </div>
      ${
        Tribe.room.isLeader && user.id !== Tribe.socket.id
          ? `<div class='userSettings' id='` +
            user.id +
            `' aria-label="User settings" data-balloon-pos="up"><div class="icon"><i class="fas fa-fw fa-cog"></i></div></div>`
          : ``
      }
    </div>
    <div class='points'>${pointsString}</div>
    </div>
    `;
    if (page === "lobby") {
      $(".pageTribe .lobby .userlist .list").append(appendData);
    } else if (page === "result") {
      $(".pageTest #result #tribeResultBottom .userlist .list").append(
        appendData
      );
    }
  });
}
