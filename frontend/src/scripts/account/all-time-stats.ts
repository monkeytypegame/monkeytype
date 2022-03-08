import * as DB from "../db";
import * as Misc from "../misc";

export function clear(): void {
  $(".pageAccount .globalTimeTyping .val").text(`-`);
  $(".pageAccount .globalTestsStarted .val").text(`-`);
  $(".pageAccount .globalTestsCompleted .val").text(`-`);
}

export function update(): void {
  const snapshot = DB.getSnapshot();

  if (snapshot.globalStats !== undefined) {
    // let th = Math.floor(DB.getSnapshot().globalStats.time / 3600);
    // let tm = Math.floor((DB.getSnapshot().globalStats.time % 3600) / 60);
    // let ts = Math.floor((DB.getSnapshot().globalStats.time % 3600) % 60);
    const seconds = snapshot?.globalStats?.time ?? 0;
    let string = "";
    if (seconds === 0) {
      string = "-";
    } else {
      string = Misc.secondsToString(Math.round(seconds), true, true);
    }
    $(".pageAccount .globalTimeTyping .val").text(string);
  }

  if (snapshot.globalStats !== undefined) {
    $(".pageAccount .globalTestsStarted .val").text(
      snapshot.globalStats.started as number
    );
  }

  if (snapshot.globalStats !== undefined) {
    $(".pageAccount .globalTestsCompleted .val").text(
      snapshot.globalStats.completed as number
    );
  }
}
