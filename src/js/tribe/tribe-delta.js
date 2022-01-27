import * as Tribe from "./tribe";
import Config from "./config";
import * as TestLogic from "./test-logic";

let el = $(".pageTest #miniTimerAndLiveWpm .tribeDelta");

export function update() {
  let maxWpm = 0;
  Object.keys(Tribe.room.users).forEach((userId) => {
    if (userId === Tribe.socket.id) return;
    let user = Tribe.room.users[userId];
    if (user?.progress?.wpm > maxWpm) maxWpm = user.progress.wpm;
  });

  el.removeClass("bad");
  let delta = Math.round(maxWpm - Tribe.getSelf().progress.wpm);
  if (delta === 0) {
    el.text("-");
  } else if (delta > 0) {
    el.text("-" + delta);
    el.addClass("bad");
  } else if (delta < 0) {
    el.text("+" + Math.abs(delta));
  }
}

export function show() {
  if (!TestLogic.active) return;
  if (Tribe.state < 5) return;

  if (!el.hasClass("hidden")) return;
  el.removeClass("hidden").css("opacity", 0).animate(
    {
      opacity: Config.timerOpacity,
    },
    125
  );
}

export function hide() {
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
