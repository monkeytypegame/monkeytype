import * as TribeState from "./tribe-state";
import Config from "../config";
import * as TestActive from "../states/test-active";
import tribeSocket from "./tribe-socket";
import { mapRange } from "../utils/misc";

const el = $(".pageTest #miniTimerAndLiveWpm .tribeDelta");
const elBar = $(".pageTest #tribeDeltaBar");

let lastDelta = 0;

export function update(): void {
  const room = TribeState.getRoom();
  if (!room) return;

  let maxWpm = 0;

  for (const [userId, user] of Object.entries(room.users)) {
    if (userId === tribeSocket.getId()) continue;
    if (user.result?.resolve.afk || user.result?.resolve.failed) continue;
    if ((user?.progress?.wpm ?? 0) > maxWpm) maxWpm = user?.progress?.wpm ?? 0;
  }

  el.removeClass("bad");
  const delta = Math.round(maxWpm - (TribeState.getSelf()?.progress?.wpm ?? 0));
  if (delta === 0) {
    el.text("-");
  } else if (delta > 0) {
    el.text("-" + delta);
    el.addClass("bad");
  } else if (delta < 0) {
    el.text("+" + Math.abs(delta));
  }

  //bar test

  const max = room.maxWpm;
  const center = maxWpm;
  let min = room.minWpm;
  if (min < 0) min = 0;
  if (min > center) min = center - (max - center);

  // $("#tribeDeltaBar .text").text(`${min}\t${center}\t${max}`);

  // const deltaPercent = mapRange(delta, min, max, -100, 100);

  const myspeed = TribeState.getSelf()?.progress?.wpm ?? center;

  const behindbarel = $("#tribeDeltaBar .behind .bar");
  const aheadbarel = $("#tribeDeltaBar .ahead .bar");

  //check if the sign of the current delta is the same as the last one

  if (Math.sign(delta) === Math.sign(lastDelta)) {
    behindbarel.stop(true, true).animate(
      {
        width: mapRange(myspeed, min, center, 100, 0) + "%",
      },
      1000,
      "linear"
    );
    aheadbarel.stop(true, true).animate(
      {
        width: mapRange(myspeed, center, max, 0, 100) + "%",
      },
      1000,
      "linear"
    );
  } else {
    if (delta > 0) {
      aheadbarel.stop(true, true).animate(
        {
          width: mapRange(myspeed, center, max, 0, 100) + "%",
        },
        500,
        "linear",
        () => {
          behindbarel.stop(true, true).animate(
            {
              width: mapRange(myspeed, min, center, 100, 0) + "%",
            },
            500,
            "linear"
          );
        }
      );
    } else if (delta < 0) {
      behindbarel.stop(true, true).animate(
        {
          width: mapRange(myspeed, min, center, 100, 0) + "%",
        },
        500,
        "linear",
        () => {
          aheadbarel.stop(true, true).animate(
            {
              width: mapRange(myspeed, center, max, 0, 100) + "%",
            },
            500,
            "linear"
          );
        }
      );
    }
  }

  lastDelta = delta;

  // if (myspeed < center) {

  //   behindbarel.stop(true, true).animate(
  //     {
  //       width: mapRange(myspeed, min, center, 100, 0) + "%",
  //     },
  //     1000,
  //     "linear"
  //   );
  //   aheadbarel.css("width", 0);
  // } else if (myspeed > center) {

  //   aheadbarel.stop(true, true).animate(
  //     {
  //       width: mapRange(myspeed, center, max, 0, 100) + "%",
  //     },
  //     1000,
  //     "linear"
  //   );
  //   behindbarel.css("width", 0);
  // } else {
  //   aheadbarel.stop(true, true).animate(
  //     {
  //       width: 0,
  //     },
  //     1000,
  //     "linear"
  //   );
  //   behindbarel.stop(true, true).animate(
  //     {
  //       width: 0,
  //     },
  //     1000,
  //     "linear"
  //   );
  // }
}

export function reset(): void {
  el.text("-");
  lastDelta = 0;
  const behindbarel = $("#tribeDeltaBar .behind .bar");
  const aheadbarel = $("#tribeDeltaBar .ahead .bar");
  behindbarel.stop(true, true).css("width", 0);
  aheadbarel.stop(true, true).css("width", 0);
}

export function show(): void {
  if (!TestActive.get()) return;
  if (TribeState.getState() < 5) return;

  if (!el.hasClass("hidden")) return;
  el.removeClass("hidden").css("opacity", 0).animate(
    {
      opacity: Config.timerOpacity,
    },
    125
  );
}

export function hide(): void {
  el.animate(
    {
      opacity: 0,
    },
    125,
    () => {
      el.addClass("hidden");
    }
  );
}

export function showBar(): void {
  console.log("show delta bar");
  if (TribeState.getState() < 5) return;

  console.log("actually showing delta");

  if (!elBar.hasClass("hidden")) return;
  elBar.removeClass("hidden").css("opacity", 0).animate(
    {
      opacity: Config.timerOpacity,
    },
    125
  );
}

export function hideBar(): void {
  console.log("hide delta bar");
  elBar.animate(
    {
      opacity: 0,
    },
    125,
    () => {
      elBar.addClass("hidden");
    }
  );
}
