import * as DB from "../db";
import Config from "../config";
import format from "date-fns/format";

function clearTables(): void {
  $(".pageAccount .profile .pbsWords").html(`
      <div class="group">
      <div class="quick">
        <div class="test">10 words</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div class="group">
      <div class="quick">
        <div class="test">25 words</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div class="group">
      <div class="quick">
        <div class="test">50 words</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div class="group">
      <div class="quick">
        <div class="test">100 words</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div
      class="showAllButton button"
      data-balloon-pos="left"
      aria-label="Show all personal bests"
    >
      <i class="fas fa-ellipsis-v"></i>
    </div>
  `);
  $(".pageAccount .profile .pbsTime").html(`
      <div class="group">
      <div class="quick">
        <div class="test">15 seconds</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div class="group">
      <div class="quick">
        <div class="test">30 seconds</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div class="group">
      <div class="quick">
        <div class="test">60 seconds</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div class="group">
      <div class="quick">
        <div class="test">120 seconds</div>
        <div class="wpm">-</div>
        <div class="acc">-</div>
      </div>
    </div>
    <div
      class="showAllButton button"
      data-balloon-pos="left"
      aria-label="Show all personal bests"
    >
      <i class="fas fa-ellipsis-v"></i>
    </div>
  `);
}

export function update(): void {
  clearTables();

  const pb = DB.getSnapshot().personalBests;
  if (pb === undefined) return;
  let text = "";

  // try {
  //   pbData = pb.time[15].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = ``;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText = format(date, "dd MMM yyyy");
  //   }
  //   text += `<tr>
  //     <td>15</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>15</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  // try {
  //   pbData = pb.time[30].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = `-<br><span class="sub">-</span>`;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText =
  //       format(date, "dd MMM yyyy") +
  //       "<br><div class='sub'>" +
  //       format(date, "HH:mm") +
  //       "</div>";
  //   }
  //   text += `<tr>
  //   <td>30</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>30</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  // try {
  //   pbData = pb.time[60].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = `-<br><span class="sub">-</span>`;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText =
  //       format(date, "dd MMM yyyy") +
  //       "<br><div class='sub'>" +
  //       format(date, "HH:mm") +
  //       "</div>";
  //   }
  //   text += `<tr>
  //     <td>60</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>60</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  // try {
  //   pbData = pb.time[120].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = `-<br><span class="sub">-</span>`;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText =
  //       format(date, "dd MMM yyyy") +
  //       "<br><div class='sub'>" +
  //       format(date, "HH:mm") +
  //       "</div>";
  //   }
  //   text += `<tr>
  //     <td>120</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>120</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  // $(".pageAccount .timePbTable tbody").html(text);

  // try {
  //   pbData = pb.words[10].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = `-<br><span class="sub">-</span>`;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText =
  //       format(date, "dd MMM yyyy") +
  //       "<br><div class='sub'>" +
  //       format(date, "HH:mm") +
  //       "</div>";
  //   }
  //   text += `<tr>
  //     <td>10</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>10</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  // try {
  //   pbData = pb.words[25].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = `-<br><span class="sub">-</span>`;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText =
  //       format(date, "dd MMM yyyy") +
  //       "<br><div class='sub'>" +
  //       format(date, "HH:mm") +
  //       "</div>";
  //   }
  //   text += `<tr>
  //     <td>25</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>25</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  // try {
  //   pbData = pb.words[50].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = `-<br><span class="sub">-</span>`;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText =
  //       format(date, "dd MMM yyyy") +
  //       "<br><div class='sub'>" +
  //       format(date, "HH:mm") +
  //       "</div>";
  //   }
  //   text += `<tr>
  //     <td>50</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>50</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  // try {
  //   pbData = pb.words[100].sort((a, b) => b.wpm - a.wpm)[0];
  //   dateText = `-<br><span class="sub">-</span>`;
  //   const date = new Date(pbData.timestamp);
  //   if (pbData.timestamp) {
  //     dateText =
  //       format(date, "dd MMM yyyy") +
  //       "<br><div class='sub'>" +
  //       format(date, "HH:mm") +
  //       "</div>";
  //   }
  //   text += `<tr>
  //     <td>100</td>
  //     <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
  //     pbData.acc === undefined ? "-" : pbData.acc + "%"
  //   }</span></td>
  //     <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
  //     pbData.consistency === undefined ? "-" : pbData.consistency + "%"
  //   }</span></td>
  //     <td>${dateText}</td>
  //   </tr>`;
  // } catch (e) {
  //   text += `<tr>
  //     <td>100</td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //     <td>-<br><span class="sub">-</span></td>
  //   </tr>`;
  // }
  $(".pageAccount .wordsPbTable tbody").html(text);

  text = "";
  [15, 30, 60, 120].forEach((mode2) => {
    text += buildPbHtml(pb, "time", mode2);
  });
  $(".pageAccount .profile .pbsTime").html(
    text +
      `<div
  class="showAllButton button"
  data-balloon-pos="left"
  aria-label="Show all personal bests"
>
  <i class="fas fa-ellipsis-v"></i>
</div>`
  );

  text = "";
  [10, 25, 50, 100].forEach((mode2) => {
    text += buildPbHtml(pb, "words", mode2);
  });
  $(".pageAccount .profile .pbsWords").html(
    text +
      `<div
  class="showAllButton button"
  data-balloon-pos="left"
  aria-label="Show all personal bests"
>
  <i class="fas fa-ellipsis-v"></i>
</div>`
  );
}

function buildPbHtml(
  pbs: MonkeyTypes.PersonalBests,
  mode: "time" | "words",
  mode2: number
): string {
  let retval = "";
  let pbData;
  let dateText = "";
  const multiplier = Config.alwaysShowCPM ? 5 : 1;
  const modeString = `${mode2} ${mode === "time" ? "seconds" : "words"}`;
  try {
    pbData = pbs[mode][mode2].sort((a, b) => b.wpm - a.wpm)[0];
    const date = new Date(pbData.timestamp);
    if (pbData.timestamp) {
      dateText = format(date, "dd MMM yyyy");
    }

    retval = `<div class="quick">
      <div class="test">${modeString}</div>
      <div class="wpm">${Math.round(pbData.wpm * multiplier)}</div>
      <div class="acc">${
        pbData.acc === undefined ? "-" : Math.round(pbData.acc) + "%"
      }</div>
    </div>
    <div class="fullTest">
      <div>${modeString}</div>
      <div>${Math.round(pbData.wpm * multiplier)} wpm</div>
      <div>${Math.round(pbData.raw * multiplier)} raw</div>
      <div>${pbData.acc === undefined ? "-" : Math.round(pbData.acc)} acc</div>
      <div>${
        pbData.consistency === undefined ? "-" : Math.round(pbData.acc)
      } con</div>
      <div>${dateText}</div>
    </div>`;
  } catch (e) {
    retval = `<div class="quick">
    <div class="test">${modeString}</div>
    <div class="wpm">-</div>
    <div class="acc">-</div>
  </div>`;
  }
  return `
  <div class="group">
  ${retval}
  </div>
  `;
}
