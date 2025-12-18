import * as TribeState from "./tribe-state";
import Config from "../config";
import * as SlowTimer from "../states/slow-timer";
import tribeSocket from "./tribe-socket";
import { FinalPositions } from "./tribe-socket/routes/room";
import { getOrdinalNumberString } from "@monkeytype/util/numbers";
import * as TribeTypes from "./types";
import { isConfigInfinite } from "./tribe-config";

const initialised: Record<string, boolean | object> = {};

export async function send(result: TribeTypes.Result): Promise<void> {
  tribeSocket.out.room.result(result);
}

export function reset(page?: string): void {
  if (page === undefined) {
    reset("result");
  } else if (page === "result") {
    initialised[page] = {};
    $(".pageTest #result #tribeResults table tbody").empty();
    $(".pageTest #result #tribeResults").addClass("hidden");
  }
}

export function init(page: string): void {
  if (page === "result") {
    reset(page);

    const el = $(".pageTest #result #tribeResults table tbody");

    const room = TribeState.getRoom();
    if (!room) return;

    for (const [userId, user] of Object.entries(room.users)) {
      if (user.isAfk) continue;
      el.append(`
        <tr class="user ${
          userId === tribeSocket.getId() ? "me" : ""
        }" id="${userId}">
          <td class="name">${user.name}</td>
          <td>
            <div class="pos">-</div>
            <div class="points">-</div>
          </td>
          <td>
            <div class="crown">
              <div class="icon invisible"><i class="fas fa-fw fa-crown"></i></div>
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
            <div class="consistency">
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
          <td>
            <div class="progress">
              <div class="barBg">
                <div class="bar" style="width: 0%;"></div>
              </div>
            </div>
            <div class="minichart hidden">
              <canvas>
              </canvas>
            </div>
          </td>
        </tr>
      `);
    }

    $(".pageTest #result #tribeResults").removeClass("hidden");
    initialised[page] = true;
  }
}

export function updateBar(
  page: string,
  userId: string,
  percentOverride?: number,
): void {
  const room = TribeState.getRoom();
  if (!room) return;
  if (page === "result") {
    const el = $(
      `.pageTest #result #tribeResults table tbody tr#${userId} .progress .bar`,
    );
    const user = room.users[userId];
    if (!user) return;
    let percent =
      Config.mode === "time"
        ? user.progress?.wpmProgress + "%"
        : user.progress?.progress + "%";
    if (percentOverride !== undefined && percentOverride !== 0) {
      percent = percentOverride + "%";
    }
    el.stop(true, false).animate(
      {
        width: percent,
      },
      SlowTimer.get() ? 0 : 1000,
      "linear",
    );
  }
}

export function updateWpmAndAcc(
  page: string,
  userId: string,
  wpm: number,
  acc: number,
): void {
  const room = TribeState.getRoom();
  if (!room) return;
  if (page === "result") {
    const el = $(`.pageTest #result #tribeResults table tbody tr#${userId}`);
    const user = room.users[userId];
    if (!user) return;
    el.find(".wpm .text").text(wpm);
    el.find(".acc .text").text(`${acc}%`);
  }
}

export function updatePositions(
  page: string,
  positions: FinalPositions,
  reorder = false,
): void {
  if (page === "result") {
    for (const [position, users] of Object.entries(positions)) {
      for (const user of users) {
        const userEl = $(
          `.pageTest #result #tribeResults table tbody tr.user[id="${user.id}"]`,
        );
        const string = getOrdinalNumberString(parseInt(position));
        userEl.find(".pos").text(string);
        userEl
          .find(".points")
          .text(`+${user.newPoints}${user.newPoints === 1 ? "pt" : "pts"}`);
      }
    }

    //todo once i use state and redraw elements as needed instead of always keeping elements in the dom
    //reorder table rows based on the ordered list
    if (reorder) {
      const elements: Record<string, JQuery> = {};
      const el = $(".pageTest #result #tribeResults table tbody");
      el.find("tr.user").each((_, userEl) => {
        const id = $(userEl).attr("id");
        if (id !== undefined) {
          elements[id] = $(userEl);
        }
      });

      el.empty();
      //add in the correct order, then add the rest

      for (const [_pos, users] of Object.entries(positions)) {
        for (const user of users) {
          el.append(elements[user.id] as JQuery);
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete elements[user.id];
        }
      }
      for (const id of Object.keys(elements)) {
        el.append(elements[id] as JQuery);
      }
    }
  }
}

export function updateMiniCrowns(
  page: string,
  miniCrowns: TribeTypes.MiniCrowns,
): void {
  if (page === "result") {
    for (const crown of Object.keys(miniCrowns)) {
      const userIds = miniCrowns[crown as keyof typeof miniCrowns];
      for (const userId of userIds) {
        const userEl = $(
          `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
        );
        userEl.find(`.${crown}`).append(`
        <div class="miniCrown">
        <i class="fas fa-fw fa-crown"></i>
        </div>
      `);
      }
    }
  }
}

export function showCrown(
  page: string,
  userId: string,
  isGlowing: boolean,
): void {
  if (page === "result") {
    const userEl = $(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
    );
    userEl.find(`.crown .icon`).removeClass("invisible");
    if (isGlowing) {
      userEl.find(".crown").attr("aria-label", "Dominated");
      userEl.find(".crown").attr("data-balloon-pos", "up");
      userEl.find(`.crown .glow`).removeClass("invisible");
    }
  }
}

function updateUser(page: string, userId: string): void {
  const room = TribeState.getRoom();
  if (!room) return;
  if (page === "result") {
    const userEl = $(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
    );
    const user = room.users[userId];
    if (!user) {
      userEl.find(`.other .text`).text("left");
      return;
    }
    const userResult = user.result;
    if (!userResult) {
      userEl.find(`.wpm .text`).text("-");
      userEl.find(`.raw .text`).text("-");
      userEl.find(`.acc .text`).text("-");
      userEl.find(`.consistency .text`).text("-");
      userEl.find(`.other .text`).text("missing result data");
      return;
    }
    if (user.isFinished) {
      userEl.find(`.wpm .text`).text(userResult.wpm);
      userEl.find(`.raw .text`).text(userResult.raw);
      userEl.find(`.acc .text`).text(userResult.acc + "%");
      userEl.find(`.consistency .text`).text(userResult.consistency + "%");
      userEl.find(`.char .text`).text(
        `
        ${userResult.charStats[0]}/${userResult.charStats[1]}/${userResult.charStats[2]}/${userResult.charStats[3]}
        `,
      );

      const configInfinite = isConfigInfinite(room.config);

      let otherText = "-";
      const resolve = userResult.resolve;
      if (resolve.afk) {
        otherText = "afk";
      } else if (resolve.repeated) {
        otherText = "repeated";
      } else if (resolve.failed && !configInfinite) {
        otherText = `failed(${resolve.failedReason})`;
      } else if (resolve.saved === false) {
        otherText = `save failed(${resolve.saveFailedMessage})`;
      } else if (resolve.valid === false) {
        otherText = `invalid`;
      } else if (configInfinite) {
        otherText = `${Math.round(userResult.testDuration)}s`;
      } else if (resolve.saved && resolve.isPb) {
        otherText = "new pb";
      }
      userEl.find(`.other .text`).text(otherText);
    }
  }
}

export function update(page: string, userId?: string): void {
  const room = TribeState.getRoom();
  if (!room) return;
  if (initialised[page] === undefined) init(page);
  if (userId !== undefined) {
    updateUser(page, userId);
  } else {
    for (const [userId, user] of Object.entries(room.users)) {
      if (user.isFinished) updateUser(page, userId);
    }
  }
}

export function fadeUser(page: string, userId: string): void {
  if (page === "result") {
    const userEl = $(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
    );
    userEl.addClass("faded");
  }
}

let timerText = "Time left for everyone to finish";
let timerVisible = false;

export function updateTimerText(text: string): void {
  timerText = text;
}

export function updateTimer(value: string): void {
  if (!timerVisible) showTimer();
  $(".pageTest #result #tribeResults .top").text(
    timerText + ": " + value + "s",
  );
}

function showTimer(): void {
  timerVisible = true;
  $(".pageTest #result #tribeResults .top")
    .removeClass("invisible")
    .css({ opacity: 0 })
    .animate({ opacity: 1 }, 125);
}

export function hideTimer(): void {
  timerVisible = false;
  $(".pageTest #result #tribeResults .top")
    .css({ opacity: 1 })
    .animate({ opacity: 0 }, 125, () => {
      $(".pageTest #result #tribeResults .top").addClass("invisible");
    });
}
