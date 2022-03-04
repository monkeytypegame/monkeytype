import * as DB from "../db";
import Config from "../config";
import * as Misc from "../misc";

export function update(): void {
  $(".pageAccount .timePbTable tbody").html(`
  <tr>
    <td>15</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>30</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>60</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>120</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  `);
  $(".pageAccount .wordsPbTable tbody").html(`
  <tr>
    <td>10</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>25</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>50</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  <tr>
    <td>100</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
    <td>-</td>
  </tr>
  `);

  if (Config.alwaysShowCPM) {
    $(
      ".pageAccount .timePbTable thead tr td:nth-child(2), .pageAccount .wordsPbTable thead tr td:nth-child(2)"
    ).html('cpm<br><span class="sub">accuracy</span>');
  } else {
    $(
      ".pageAccount .timePbTable thead tr td:nth-child(2), .pageAccount .wordsPbTable thead tr td:nth-child(2)"
    ).html('wpm<br><span class="sub">accuracy</span>');
  }

  const pb = DB.getSnapshot().personalBests;
  if (pb === undefined) return;
  let pbData;
  let text;
  let dateText = `-<br><span class="sub">-</span>`;
  const multiplier = Config.alwaysShowCPM ? 5 : 1;

  text = "";
  try {
    pbData = pb.time[15].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
      <td>15</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>15</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  try {
    pbData = pb.time[30].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
    <td>30</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>30</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  try {
    pbData = pb.time[60].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
      <td>60</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>60</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  try {
    pbData = pb.time[120].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
      <td>120</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>120</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  $(".pageAccount .timePbTable tbody").html(text);

  text = "";
  try {
    pbData = pb.words[10].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
      <td>10</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>10</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  try {
    pbData = pb.words[25].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
      <td>25</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>25</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  try {
    pbData = pb.words[50].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
      <td>50</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>50</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  try {
    pbData = pb.words[100].sort((a, b) => b.wpm - a.wpm)[0];
    dateText = `-<br><span class="sub">-</span>`;
    if (pbData.timestamp) {
      dateText =
        moment(pbData.timestamp).format("DD MMM YYYY") +
        "<br><div class='sub'>" +
        moment(pbData.timestamp).format("HH:mm") +
        "</div>";
    }
    text += `<tr>
      <td>100</td>
      <td>${Misc.roundTo2(pbData.wpm * multiplier)}<br><span class="sub">${
      pbData.acc === undefined ? "-" : pbData.acc + "%"
    }</span></td>
      <td>${Misc.roundTo2(pbData.raw * multiplier)}<br><span class="sub">${
      pbData.consistency === undefined ? "-" : pbData.consistency + "%"
    }</span></td>
      <td>${dateText}</td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>100</td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
      <td>-<br><span class="sub">-</span></td>
    </tr>`;
  }
  $(".pageAccount .wordsPbTable tbody").html(text);
}
