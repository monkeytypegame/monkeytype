import * as TribeState from "./tribe-state";
import Config from "../config";
import * as SlowTimer from "../states/slow-timer";
import tribeSocket from "./tribe-socket";
import { FinalPositions } from "./tribe-socket/routes/room";
import { getOrdinalNumberString } from "@monkeytype/util/numbers";
import * as TribeTypes from "./types";
import { isConfigInfinite } from "./tribe-config";
import { ElementWithUtils, qs } from "../utils/dom";

const initialised: Record<string, boolean | object> = {};

export async function send(result: TribeTypes.Result): Promise<void> {
  tribeSocket.out.room.result(result);
}

export function reset(page?: string): void {
  if (page === undefined) {
    reset("result");
  } else if (page === "result") {
    initialised[page] = {};
    qs(".pageTest #result #tribeResults table tbody")?.empty();
    qs(".pageTest #result #tribeResults")?.addClass("hidden");
  }
}

export function init(page: string): void {
  if (page === "result") {
    reset(page);

    const el = qs(".pageTest #result #tribeResults table tbody");

    const room = TribeState.getRoom();
    if (!room) return;

    for (const [userId, user] of Object.entries(room.users)) {
      if (user.isAfk) continue;
      el?.appendHtml(`
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

    qs(".pageTest #result #tribeResults")?.removeClass("hidden");
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
    const el = qs(
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
    el?.animate({
      width: percent,
      duration: SlowTimer.get() ? 0 : 1000,
      ease: "linear",
    });
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
    const el = qs(`.pageTest #result #tribeResults table tbody tr#${userId}`);
    const user = room.users[userId];
    if (!user) return;
    el?.qs(".wpm .text")?.setText(`${wpm}`);
    el?.qs(".acc .text")?.setText(`${acc}%`);
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
        const userEl = qs(
          `.pageTest #result #tribeResults table tbody tr.user[id="${user.id}"]`,
        );
        const string = getOrdinalNumberString(parseInt(position));
        userEl?.qs(".pos")?.setText(string);
        userEl
          ?.qs(".points")
          ?.setText(`+${user.newPoints}${user.newPoints === 1 ? "pt" : "pts"}`);
      }
    }

    //todo once i use state and redraw elements as needed instead of always keeping elements in the dom
    //reorder table rows based on the ordered list
    if (reorder) {
      const elements: Record<string, ElementWithUtils> = {};
      const el = qs(".pageTest #result #tribeResults table tbody");
      for (const user of el?.qsa("tr.user") ?? []) {
        const id = user.getAttribute("id");
        if (id !== null) {
          elements[id] = user;
        }
      }

      el?.empty();
      //add in the correct order, then add the rest

      for (const [_pos, users] of Object.entries(positions)) {
        for (const user of users) {
          const userEl = elements[user.id];
          if (userEl) {
            el?.append(userEl);
          }
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete elements[user.id];
        }
      }
      for (const id of Object.keys(elements)) {
        const userEl = elements[id];
        if (userEl) {
          el?.append(userEl);
        }
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
        const userEl = qs(
          `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
        );
        userEl?.qs(`.${crown}`)?.appendHtml(`
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
    const userEl = qs(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
    );
    userEl?.qs(`.crown .icon`)?.removeClass("invisible");
    if (isGlowing) {
      userEl?.qs(".crown")?.setAttribute("aria-label", "Dominated");
      userEl?.qs(".crown")?.setAttribute("data-balloon-pos", "up");
      userEl?.qs(`.crown .glow`)?.removeClass("invisible");
    }
  }
}

function updateUser(page: string, userId: string): void {
  const room = TribeState.getRoom();
  if (!room) return;
  if (page === "result") {
    const userEl = qs(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
    );
    const user = room.users[userId];
    if (!user) {
      userEl?.qs(`.other .text`)?.setText("left");
      return;
    }
    const userResult = user.result;
    if (!userResult) {
      userEl?.qs(`.wpm .text`)?.setText("-");
      userEl?.qs(`.raw .text`)?.setText("-");
      userEl?.qs(`.acc .text`)?.setText("-");
      userEl?.qs(`.consistency .text`)?.setText("-");
      userEl?.qs(`.other .text`)?.setText("missing result data");
      return;
    }
    if (user.isFinished) {
      userEl?.qs(`.wpm .text`)?.setText(`${userResult.wpm}`);
      userEl?.qs(`.raw .text`)?.setText(`${userResult.raw}`);
      userEl?.qs(`.acc .text`)?.setText(`${userResult.acc}%`);
      userEl?.qs(`.consistency .text`)?.setText(`${userResult.consistency}%`);
      userEl?.qs(`.char .text`)?.setText(
        `
        ${userResult.charStats[0]}/${userResult.charStats[1]}/${userResult.charStats[2]}/${userResult.charStats[3]}
        `,
      );

      const configInfinite = isConfigInfinite(room.config);

      let otherText = "-";
      const resolve = userResult.resolve;
      if ("valid" in resolve && !resolve.valid) {
        otherText = `invalid(${resolve.invalidReason})`;
      } else if ("failed" in resolve && resolve.failed) {
        otherText = `failed(${resolve.failedReason})`;
      } else if ("saved" in resolve && !resolve.saved) {
        otherText = `save failed(${resolve.saveFailedMessage})`;
      } else if (configInfinite) {
        otherText = `${Math.round(userResult.testDuration)}s`;
      } else if ("saved" in resolve && resolve.saved && resolve.isPb) {
        otherText = "new pb";
      }
      userEl?.qs(`.other .text`)?.setText(otherText);
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
    const userEl = qs(
      `.pageTest #result #tribeResults table tbody tr.user[id="${userId}"]`,
    );
    userEl?.addClass("faded");
  }
}

let timerText = "Time left for everyone to finish";
let timerVisible = false;

export function updateTimerText(text: string): void {
  timerText = text;
}

export function updateTimer(value: string): void {
  if (!timerVisible) showTimer();
  qs(".pageTest #result #tribeResults .timer")?.setText(
    timerText + ": " + value + "s",
  );
}

function showTimer(): void {
  timerVisible = true;
  qs(".pageTest #result #tribeResults .timer")
    ?.removeClass("invisible")
    .setStyle({ opacity: "0" })
    .animate({ opacity: 1, duration: 125 });
}

export function hideTimer(): void {
  timerVisible = false;
  qs(".pageTest #result #tribeResults .timer")
    ?.setStyle({ opacity: "1" })
    .animate({
      opacity: 0,
      duration: 125,
      onComplete: () => {
        qs(".pageTest #result #tribeResults .timer")?.addClass("invisible");
      },
    });
}
