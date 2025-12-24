import * as TribeState from "./tribe-state";
import Config from "../config";
import * as TestState from "../test/test-state";
import * as ConfigEvent from "../observables/config-event";
import { mapRange } from "@monkeytype/util/numbers";
import { qs } from "../utils/dom";
// import { isConfigInfinite } from "./tribe-config";

const textEl = qs(".pageTest #liveStatsMini .tribeDelta");
const barEl = qs(".pageTest #tribeDeltaBar");
const aheadBarEl = barEl?.qs(".ahead .bar");
const behindBarEl = barEl?.qs(".behind .bar");

let lastState = 0;
let state = 0;

export function update(): void {
  const room = TribeState.getRoom();
  if (!room) return;

  const orderedUsers = Object.values(room.users).sort((a, b) => {
    // if (Config.mode === "time" || isConfigInfinite(room.config)) {
    return (b.progress?.wpm ?? 0) - (a.progress?.wpm ?? 0);
    // }else{
    //   return (b.progress?.progress ?? 0) - (a.progress?.progress ?? 0);
    // }
  });

  const self = TribeState.getSelf();
  const userIsLeading = orderedUsers[0]?.id === self?.id;
  const user = orderedUsers.find((u) => u.id === self?.id);
  if (!user) return;

  const secondUser = orderedUsers[1];
  const leadingUser = orderedUsers[0];

  if (!secondUser || !leadingUser) return;

  if (userIsLeading) {
    // positive state
    const delta = user.progress?.wpm ?? 0 - (secondUser.progress?.wpm ?? 0);
    lastState = state;
    state = delta;
  } else {
    // negative state
    const delta = (leadingUser.progress?.wpm ?? 0) - (user.progress?.wpm ?? 0);
    lastState = state;
    state = -delta;
  }

  if (Config.tribeDelta === "bar") {
    const scaledPositive = mapRange(
      user.progress?.wpm ?? 0,
      secondUser.progress?.wpm ?? 0,
      room.maxWpm,
      0,
      100,
    );
    const scaledNegative = mapRange(
      user.progress?.wpm ?? 0,
      room.minWpm,
      leadingUser.progress?.wpm ?? 0,
      100,
      0,
    );
    const animationDuaration = room.updateRate ?? 500;

    // check if the sign of the current state is the same as the last one
    if (Math.sign(state) === Math.sign(lastState)) {
      //same sign
      if (state > 0) {
        void aheadBarEl?.promiseAnimate({
          width: scaledPositive + "%",
          duration: animationDuaration,
          ease: "linear",
        });
      } else {
        void behindBarEl?.promiseAnimate({
          width: Math.abs(scaledNegative) + "%",
          duration: animationDuaration,
          ease: "linear",
        });
      }
    } else {
      //different sign
      if (state > 0) {
        // negative to positive
        void behindBarEl
          ?.promiseAnimate({
            width: "0%",
            duration: animationDuaration / 2,
            ease: "linear",
          })
          .then(() => {
            void aheadBarEl?.promiseAnimate({
              width: scaledPositive + "%",
              duration: animationDuaration / 2,
              ease: "linear",
            });
          });
      } else {
        // positive to negative
        void aheadBarEl
          ?.promiseAnimate({
            width: "0%",
            duration: animationDuaration / 2,
            ease: "linear",
          })
          .then(() => {
            void behindBarEl?.promiseAnimate({
              width: Math.abs(scaledNegative) + "%",
              duration: animationDuaration / 2,
              ease: "linear",
            });
          });
      }
    }
  } else if (Config.tribeDelta === "text") {
    if (state > 0) {
      textEl
        ?.setText(`+${Math.floor(state)}`)
        .addClass("good")
        .removeClass("bad");
    } else if (state < 0) {
      textEl
        ?.setText(`${Math.floor(state)}`)
        .addClass("bad")
        .removeClass("good");
    } else {
      textEl?.setText(`0`).removeClass("good").removeClass("bad");
    }
  }
}

export function reset(): void {
  textEl?.setText("-");
  state = 0;
  lastState = 0;
  aheadBarEl?.setStyle({ width: "0%" });
  behindBarEl?.setStyle({ width: "0%" });
}

export function show(): void {
  if (!TestState.isActive) return;
  if (!TribeState.isInARoom()) return;
  if (Config.tribeDelta !== "text") return;

  textEl?.show();
}

export function hide(): void {
  textEl?.hide();
}

export function showBar(): void {
  if (!TribeState.isInARoom()) return;
  if (Config.tribeDelta !== "bar") return;

  barEl?.show();
}

export function hideBar(): void {
  barEl?.hide();
}

ConfigEvent.subscribe(({ key, newValue }) => {
  if (key !== "tribeDelta") return;

  if (newValue === "text") {
    hideBar();
    show();
  } else if (newValue === "bar") {
    hide();
    showBar();
  } else {
    hide();
    hideBar();
  }
});
