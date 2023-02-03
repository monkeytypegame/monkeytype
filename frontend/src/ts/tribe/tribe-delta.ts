import * as TribeState from "./tribe-state";
import Config from "../config";
import * as TestActive from "../states/test-active";
import tribeSocket from "./tribe-socket";
import { mapRange } from "../utils/misc";

const el = $(".pageTest #miniTimerAndLiveWpm .tribeDelta");

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
  let min = center - (max - center);
  if (min < 0) min = 0;

  // const deltaPercent = mapRange(delta, min, max, -100, 100);

  const myspeed = TribeState.getSelf()?.progress?.wpm ?? center;

  const behindbarel = $("#tribeDeltaBar .behind .bar");
  const aheadbarel = $("#tribeDeltaBar .ahead .bar");

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
      opacity: Config.timerOpacity,
    },
    125,
    () => {
      el.addClass("hidden");
    }
  );
}
