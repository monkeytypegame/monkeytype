import * as DB from "./db";

export function clear() {
  $(".pageAccount .globalTimeTyping .val").text(`-`);
  $(".pageAccount .globalTestsStarted .val").text(`-`);
  $(".pageAccount .globalTestsCompleted .val").text(`-`);
}

export function update() {
  if (DB.getSnapshot().globalStats.time != undefined) {
    let th = Math.floor(DB.getSnapshot().globalStats.time / 3600);
    let tm = Math.floor((DB.getSnapshot().globalStats.time % 3600) / 60);
    let ts = Math.floor((DB.getSnapshot().globalStats.time % 3600) % 60);
    $(".pageAccount .globalTimeTyping .val").text(`

      ${th < 10 ? "0" + th : th}:${tm < 10 ? "0" + tm : tm}:${
      ts < 10 ? "0" + ts : ts
    }
  `);
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
