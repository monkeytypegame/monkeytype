import * as TribeState from "./tribe-state";
import Config from "../config";
import * as SlowTimer from "../states/slow-timer";
import tribeSocket from "./tribe-socket";
import { isConfigInfinite } from "./tribe-config";
import { getAvatarElement } from "../utils/discord-avatar";
import { ElementWithUtils, qs } from "../utils/dom";
import { ColorName } from "../constants/themes";
import { getTheme } from "../signals/theme";

export function init(page: string): void {
  let el: ElementWithUtils | null;

  if (page === "test") {
    el = qs(".pageTest #typingTest .tribeBars");
  } else if (page === "tribe") {
    el = qs(".pageTribe .lobby .tribeBars");
  } else {
    el = null;
  }

  const room = TribeState.getRoom();

  if (!el) return;
  if (!room) return;

  let html = "";

  for (const [userId, user] of Object.entries(room.users)) {
    if (userId === tribeSocket.getId()) continue;
    let me = false;
    if (userId === tribeSocket.getId()) me = true;
    if (user.isTyping) {
      html += `
      <tr class="player ${me ? "me" : ""}" id="${userId}">
        <td class="avatarAndName">
          <div class="avatar">
            ${
              getAvatarElement({
                discordId: undefined,
                discordAvatar: undefined,
              }).innerHTML
            }
          </div>
          <div class="name">
          ${user.name}
          </div>
        </td>
        <td class="progress">
          <div class="barBg">
            <div class="bar" style="width: 0%;"></div>
          </div>
        </td>
        <td>
        <div class="wpm">-</div>
        </td>
        <td>
        <div class="acc">-</div>
        </td>
      </tr>
      `;
    }
  }
  const tribeSelf = TribeState.getSelf();
  if (tribeSelf?.isTyping) {
    html += `
      <tr class="player me" id="${tribeSelf?.id}">
        <td class="avatarAndName">
          <div class="avatar">
            ${
              getAvatarElement({
                discordId: undefined,
                discordAvatar: undefined,
              }).innerHTML
            }
          </div>
          <div class="name">
          ${tribeSelf?.name}
          </div>
        </td>
        <td class="progress">
          <div class="barBg">
            <div class="bar" style="width: 0%;"></div>
          </div>
        </td>
        <td>
        <div class="wpm">-</div>
        </td>
        <td>
        <div class="acc">-</div>
        </td>
      </tr>
      `;
  }

  el.setHtml(html);
}

export function show(page: string): void {
  if (page === "test") {
    qs(".pageTest #typingTest .tribeBars")?.removeClass("hidden");
  } else if (page === "tribe") {
    qs(".pageTribe .tribeBars")?.removeClass("hidden");
  }
}

export function hide(page?: string): void {
  if (page === undefined) {
    hide("test");
    hide("tribe");
  } else if (page === "test") {
    qs(".pageTest #typingTest .tribeBars")?.addClass("hidden");
  } else if (page === "tribe") {
    qs(".pageTribe .tribeBars")?.addClass("hidden");
  }
}

export function reset(page?: string): void {
  if (page === undefined) {
    reset("test");
    reset("tribe");
  } else if (page === "test") {
    qs(".pageTest #typingTest .tribeBars")?.empty();
  } else if (page === "tribe") {
    qs(".pageTribe .tribeBars")?.empty();
  }
}

export function update(page: string, userId: string): void {
  const room = TribeState.getRoom();
  if (!room) return;
  if (page === undefined) {
    update("test", userId);
    update("tribe", userId);
    return;
  }
  let el: ElementWithUtils | null;
  if (page === "test") {
    el = qs(".pageTest #typingTest .tribeBars");
  } else if (page === "tribe") {
    el = qs(".pageTribe .tribeBars");
  } else {
    el = null;
  }
  const user = room.users[userId];

  if (!el || !user) {
    return;
  }

  el.qs(`.player[id=${userId}] .wpm`)?.setText(
    `${Math.round(user?.progress?.wpm ?? 0)}`,
  );
  el.qs(`.player[id=${userId}] .acc`)?.setText(
    `${Math.floor(user.progress?.acc ?? 0)}%`,
  );
  el.qs(`.player[id=${userId}] .bar`)?.animate({
    width:
      Config.mode === "time" || isConfigInfinite(room.config)
        ? user.progress?.wpmProgress + "%"
        : user.progress?.progress + "%",
    duration: SlowTimer.get() ? 0 : (TribeState.getRoom()?.updateRate ?? 500),
    ease: "linear",
  });
}

export function completeBar(page: string, userId: string): void {
  if (page === undefined) {
    completeBar("test", userId);
    completeBar("tribe", userId);
    return;
  }
  let el: ElementWithUtils | null;
  if (page === "test") {
    el = qs(".pageTest #typingTest .tribeBars");
  } else if (page === "tribe") {
    el = qs(".pageTribe .tribeBars");
  } else {
    el = null;
  }
  if (!el) {
    return;
  }

  el.qs(`.player[id=${userId}] .bar`)?.animate({
    width: "100%",
    duration: SlowTimer.get() ? 0 : 500,
    ease: "linear",
  });
}

export function fadeUser(
  page: string | undefined,
  userId: string,
  changeColor?: ColorName,
): void {
  if (page === undefined) {
    fadeUser("test", userId, changeColor);
    fadeUser("tribe", userId, changeColor);
    return;
  }
  let el: ElementWithUtils | null;
  if (page === "test") {
    el = qs(".pageTest #typingTest .tribeBars");
  } else if (page === "tribe") {
    el = qs(".pageTribe .tribeBars");
  } else {
    el = null;
  }

  if (!el) {
    return;
  }

  el.qs(`.player[id=${userId}]`)?.addClass("faded");

  if (changeColor !== undefined) {
    const theme = getTheme();
    const color = theme[changeColor];
    if (color === undefined) return;
    if (el === undefined) return;
    el.qs(`.player[id=${userId}] .bar`)?.setStyle({
      backgroundColor: color,
    });
  }
}
