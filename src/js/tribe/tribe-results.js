import * as Tribe from "./tribe";
import * as Misc from "./misc";

let initialised = {};

export async function send(result) {
  Tribe.socket.emit("room_result", { result });
}

export function reset(page) {
  if (page === undefined) {
    reset("result");
  } else if (page == "result") {
    initialised[page] = {};
    $(".pageTest #result #tribeResults table tbody").empty();
    $(".pageTest #result #tribeResults").addClass("hidden");
  }
}

export function init(page) {
  if (page === "result") {
    reset(page);

    let el = $(".pageTest #result #tribeResults table tbody");

    Object.keys(Tribe.room.users).forEach((userId) => {
      let user = Tribe.room.users[userId];
      if (user.isAfk) return;
      el.append(`
        <tr class="user ${
          userId === Tribe.socket.id ? "me" : ""
        }" id="${userId}">
          <td class="name">${user.name}</td>
          <td>
            <div class="pos">-</div>
            <div class="points">-</div>
          </td>
          <td>
            <div class="crown">
              <div class="icon invisible"><i class="fas fa-crown"></i></div>
              <div class="glow invisible"></div>
            </div>
          </td>
          <td>
            <div class="wpm">
              <div class="text">-</div>
            </div>
            <div class="acc">
              <div class="text">-</div>
            </div>
          </td>
          <td>
            <div class="raw">
              <div class="text">-</div>
            </div>
            <div class="con">
              <div class="text">-</div>
            </div>
          </td>
          <td>
            <div class="char">
              <div class="text">-</div>
            </div>
            <div class="other">
              <div class="text">-</div>
            </div>
          </td>
        </tr>
      `);
    });

    $(".pageTest #result #tribeResults").removeClass("hidden");
    initialised[page] = true;
  }
}

export function updatePositions(page, orderedList) {
  let points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  if (page === "result") {
    orderedList.forEach((user, index) => {
      let userEl = $(
        `.pageTest #result #tribeResults table tbody tr.user[id="${user.id}"]`
      );
      let string = Misc.getPositionString(index + 1);
      userEl.find(".pos").text(string);
      userEl
        .find(".points")
        .text(
          points[index]
            ? `+${points[index]}${points[index] === 1 ? "pt" : "pts"}`
            : ""
        );
    });
  }
}

function updateUser(page, userId) {
  if (page == "result") {
    let userEl = $(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`
    );
    let user = Tribe.room.users[userId];
    if (user.isFinished) {
      userEl.find(`.wpm .text`).text(user.result.wpm);
      userEl.find(`.raw .text`).text(user.result.raw);
      userEl.find(`.acc .text`).text(user.result.acc + "%");
      userEl.find(`.con .text`).text(user.result.consistency + "%");
      userEl.find(`.char .text`).text(
        `
        ${user.result.charStats[0]}/${user.result.charStats[1]}/${user.result.charStats[2]}/${user.result.charStats[3]}
        `
      );
      let otherText = "";
      let faded = false;
      let resolve = user.result.resolve;
      if (resolve.afk) {
        otherText = "afk";
        faded = true;
      } else if (resolve.repeated) {
        otherText = "repeated";
        faded = true;
      } else if (resolve.failed) {
        otherText = `failed(${resolve.failedReason})`;
        faded = true;
      } else if (resolve.saved === false) {
        otherText = `save failed(${resolve.saveFailedMessage})`;
        faded = true;
      } else if (resolve.valid === false) {
        otherText = `invalid`;
        faded = true;
      } else if (resolve.saved && resolve.isPb) {
        otherText = "new pb";
      }
      userEl.find(`.other .text`).text(otherText);
      if (faded) {
        userEl.addClass("faded");
      }
    }
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

export function fadeUser(page, userId) {
  if (page == "result") {
    let userEl = $(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`
    );
    userEl.addClass("faded");
  }
}

let timerText = "Time left for everyone to finish";
let timerVisible = false;

export function updateTimerText(text) {
  timerText = text;
}

export function updateTimer(value) {
  if (!timerVisible) showTimer();
  $(".pageTest #result #tribeResults .top").text(
    timerText + ": " + value + "s"
  );
}

function showTimer() {
  timerVisible = true;
  $(".pageTest #result #tribeResults .top")
    .removeClass("invisible")
    .css({ opacity: 0 })
    .animate({ opacity: 1 }, 125);
}

export function hideTimer() {
  timerVisible = false;
  $(".pageTest #result #tribeResults .top")
    .css({ opacity: 1 })
    .animate({ opacity: 0 }, 125, () => {
      $(".pageTest #result #tribeResults .top").addClass("invisible");
    });
}
