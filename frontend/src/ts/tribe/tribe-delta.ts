import * as TribeState from "./tribe-state";
import Config from "../config";
import * as TestState from "../test/test-state";
import tribeSocket from "./tribe-socket";
import * as ConfigEvent from "../observables/config-event";
import { mapRange } from "@monkeytype/util/numbers";

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

  const delta = Math.round(maxWpm - (TribeState.getSelf()?.progress?.wpm ?? 0));

  el.removeClass("bad");
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

  const duration = TribeState.getRoom()?.updateRate ?? 500;
  if (Math.sign(delta) === Math.sign(lastDelta) && Math.sign(delta) !== 0) {
    behindbarel.stop(true, false).animate(
      {
        width: mapRange(myspeed, min, center, 100, 0) + "%",
      },
      duration,
      "linear",
    );
    aheadbarel.stop(true, false).animate(
      {
        width: mapRange(myspeed, center, max, 0, 100) + "%",
      },
      duration,
      "linear",
    );
  } else {
    if (delta > 0) {
      aheadbarel.stop(true, false).animate(
        {
          width: mapRange(myspeed, center, max, 0, 100) + "%",
        },
        duration / 2,
        "linear",
        () => {
          behindbarel.stop(true, false).animate(
            {
              width: mapRange(myspeed, min, center, 100, 0) + "%",
            },
            duration / 2,
            "linear",
          );
        },
      );
    } else if (delta < 0) {
      behindbarel.stop(true, false).animate(
        {
          width: mapRange(myspeed, min, center, 100, 0) + "%",
        },
        duration / 2,
        "linear",
        () => {
          aheadbarel.stop(true, false).animate(
            {
              width: mapRange(myspeed, center, max, 0, 100) + "%",
            },
            duration / 2,
            "linear",
          );
        },
      );
    } else if (delta === 0) {
      behindbarel.stop(true, false).animate(
        {
          width: "0%",
        },
        duration,
        "linear",
      );
      aheadbarel.stop(true, false).animate(
        {
          width: "0%",
        },
        duration,
        "linear",
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
  if (!TestState.isActive) return;
  if (TribeState.getState() < 5) return;
  if (Config.tribeDelta !== "text") return;

  if (!el.hasClass("hidden")) return;
  el.removeClass("hidden").css("opacity", 0).animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
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
    },
  );
}

export function showBar(): void {
  if (TribeState.getState() < 5) return;
  if (Config.tribeDelta !== "bar") return;

  if (!elBar.hasClass("hidden")) return;
  elBar.removeClass("hidden").css("opacity", 0).animate(
    {
      opacity: Config.timerOpacity,
    },
    125,
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
    },
  );
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
