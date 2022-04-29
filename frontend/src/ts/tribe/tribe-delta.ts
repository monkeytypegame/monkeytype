// Rizwan TODO: This should work as soon as the tribe is converted to typescript
import * as Tribe from "./tribe";
import Config from "../config";
import * as TestActive from "../states/test-active";

const el = $(".pageTest #miniTimerAndLiveWpm .tribeDelta");

export function update(): void {
  let maxWpm = 0;
  Object.keys(Tribe.room.users).forEach((userId) => {
    if (userId === Tribe.socket.id) return;
    const user = Tribe.room.users[userId];
    if (user?.progress?.wpm > maxWpm) maxWpm = user.progress.wpm;
  });

  el.removeClass("bad");
  const delta = Math.round(maxWpm - Tribe.getSelf().progress.wpm);
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
  if (Tribe.state < 5) return;

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
