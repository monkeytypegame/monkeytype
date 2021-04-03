import * as DB from "./db";

export function update() {
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

  const pb = DB.getSnapshot().personalBests;
  let pbData;
  let text;

  text = "";
  try {
    pbData = pb.time[15].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>15</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>15</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.time[30].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>30</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>30</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.time[60].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>60</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>60</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.time[120].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>120</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>120</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  $(".pageAccount .timePbTable tbody").html(text);

  text = "";
  try {
    pbData = pb.words[10].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>10</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>10</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.words[25].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>25</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>25</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.words[50].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>50</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>50</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  try {
    pbData = pb.words[100].sort((a, b) => b.wpm - a.wpm)[0];
    text += `<tr>
      <td>100</td>
      <td>${pbData.wpm}</td>
      <td>${pbData.raw === undefined ? "-" : pbData.raw}</td>
      <td>${pbData.acc === undefined ? "-" : pbData.acc + "%"}</td>
      <td>
      ${pbData.consistency === undefined ? "-" : pbData.consistency + "%"}
      </td>
    </tr>`;
  } catch (e) {
    text += `<tr>
      <td>100</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    </tr>`;
  }
  $(".pageAccount .wordsPbTable tbody").html(text);
}
