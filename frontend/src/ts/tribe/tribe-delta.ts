import * as TribeState from "./tribe-state";
import { Config } from "../config/store";
import { mapRange } from "@monkeytype/util/numbers";
import { ElementWithUtils, qs } from "../utils/dom";
import { configEvent } from "../events/config";
import { isTestActive } from "../states/test";
// import { isConfigInfinite } from "./tribe-config";

// queried lazily - test page dom is rendered after module load
const getTextEl = (): ElementWithUtils | null =>
  qs(".pageTest #typingTest .tribeDelta");
const getBarEl = (): ElementWithUtils | null => qs(".pageTest #tribeDeltaBar");
const getAheadBarEl = (): ElementWithUtils | null =>
  getBarEl()?.qs(".ahead .bar") ?? null;
const getBehindBarEl = (): ElementWithUtils | null =>
  getBarEl()?.qs(".behind .bar") ?? null;

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
    const userProgress = user.progress?.wpm ?? 0;
    const secondUserProgress = secondUser.progress?.wpm ?? 0;
    const delta = userProgress - secondUserProgress;
    lastState = state;
    state = delta;
  } else {
    // negative state
    const leadingUserProgress = leadingUser.progress?.wpm ?? 0;
    const userProgress = user.progress?.wpm ?? 0;
    const delta = leadingUserProgress - userProgress;
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
        void getAheadBarEl()?.promiseAnimate({
          width: `${scaledPositive}%`,
          duration: animationDuaration,
          ease: "linear",
        });
      } else {
        void getBehindBarEl()?.promiseAnimate({
          width: `${Math.abs(scaledNegative)}%`,
          duration: animationDuaration,
          ease: "linear",
        });
      }
    } else {
      //different sign
      if (state > 0) {
        // negative to positive
        void getBehindBarEl()
          ?.promiseAnimate({
            width: "0%",
            duration: animationDuaration / 2,
            ease: "linear",
          })
          .then(() => {
            void getAheadBarEl()?.promiseAnimate({
              width: `${scaledPositive}%`,
              duration: animationDuaration / 2,
              ease: "linear",
            });
          });
      } else {
        // positive to negative
        void getAheadBarEl()
          ?.promiseAnimate({
            width: "0%",
            duration: animationDuaration / 2,
            ease: "linear",
          })
          .then(() => {
            void getBehindBarEl()?.promiseAnimate({
              width: `${Math.abs(scaledNegative)}%`,
              duration: animationDuaration / 2,
              ease: "linear",
            });
          });
      }
    }
  } else if (Config.tribeDelta === "text") {
    if (state > 0) {
      getTextEl()
        ?.setText(`+${Math.floor(state)}`)
        .addClass("good")
        .removeClass("bad");
    } else if (state < 0) {
      getTextEl()
        ?.setText(`${Math.floor(state)}`)
        .addClass("bad")
        .removeClass("good");
    } else {
      getTextEl()?.setText(`0`).removeClass("good").removeClass("bad");
    }
  }
}

export function reset(): void {
  getTextEl()?.setText("-");
  state = 0;
  lastState = 0;
  getAheadBarEl()?.setStyle({ width: "0%" });
  getBehindBarEl()?.setStyle({ width: "0%" });
}

export function show(): void {
  if (!isTestActive()) return;
  if (!TribeState.isInARoom()) return;
  if (Config.tribeDelta !== "text") return;

  getTextEl()?.show();
}

export function hide(): void {
  getTextEl()?.hide();
}

export function showBar(): void {
  if (!TribeState.isInARoom()) return;
  if (Config.tribeDelta !== "bar") return;

  getBarEl()?.show();
}

export function hideBar(): void {
  getBarEl()?.hide();
}

configEvent.subscribe(({ key, newValue }) => {
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
