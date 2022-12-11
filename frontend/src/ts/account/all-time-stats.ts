import * as DB from "../db";
import * as Misc from "../utils/misc";

export function clear(): void {
  $(".pageAccount .globalTimeTyping .val").text(`-`);
  $(".pageAccount .globalTestsStarted .val").text(`-`);
  $(".pageAccount .globalTestsCompleted .val").text(`-`);
}

export function update(): void {
  const snapshot = DB.getSnapshot();
  if (!snapshot) return;
  if (snapshot.typingStats !== undefined) {
    // let th = Math.floor(DB.getSnapshot().typingStats.time / 3600);
    // let tm = Math.floor((DB.getSnapshot().typingStats.time % 3600) / 60);
    // let ts = Math.floor((DB.getSnapshot().typingStats.time % 3600) % 60);
    const seconds = snapshot?.typingStats?.timeTyping ?? 0;
    let string = "";
    if (seconds === 0) {
      string = "-";
    } else {
      string = Misc.secondsToString(Math.round(seconds), true, true);
    }
    $(".pageAccount .globalTimeTyping .val").text(string);
  }

  if (snapshot.typingStats !== undefined) {
    $(".pageAccount .globalTestsStarted .val").text(
      snapshot.typingStats.startedTests as number
    );
  }

  if (snapshot.typingStats !== undefined) {
    $(".pageAccount .globalTestsCompleted .val").text(
      snapshot.typingStats.completedTests as number
    );
  }
}
