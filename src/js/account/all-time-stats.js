import * as DB from "../db";
import * as Misc from "../misc";

export function clear() {
  $(".pageAccount .globalTimeTyping .val").text(`-`);
  $(".pageAccount .globalTestsStarted .val").text(`-`);
  $(".pageAccount .globalTestsCompleted .val").text(`-`);
}

export function update() {
  if (DB.getSnapshot().globalStats.time != undefined) {
    // let th = Math.floor(DB.getSnapshot().globalStats.time / 3600);
    // let tm = Math.floor((DB.getSnapshot().globalStats.time % 3600) / 60);
    // let ts = Math.floor((DB.getSnapshot().globalStats.time % 3600) % 60);
    $(".pageAccount .globalTimeTyping .val").text(
      Misc.secondsToString(
        Math.round(DB.getSnapshot().globalStats.time),
        true,
        true
      )
    );
  }
  if (DB.getSnapshot().globalStats.started != undefined) {
    $(".pageAccount .globalTestsStarted .val").text(
      DB.getSnapshot().globalStats.started
    );
  }
  if (DB.getSnapshot().globalStats.completed != undefined) {
    $(".pageAccount .globalTestsCompleted .val").text(
      DB.getSnapshot().globalStats.completed
    );
  }
}
