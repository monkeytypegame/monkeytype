import * as TribeState from "./tribe-state";
import Config from "../config";
import * as TestActive from "../states/test-active";
import tribeSocket from "./tribe-socket";

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
