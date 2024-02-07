import Config from "../config";
import format from "date-fns/format";
import * as Misc from "../utils/misc";
import { get as getTypingSpeedUnit } from "../utils/typing-speed-units";

function clearTables(isProfile: boolean): void {
  const source = isProfile ? "Profile" : "Account";

  const showAllButton = `<div class="buttonGroup"><button
  class="showAllButton"
  data-balloon-pos="left"
  aria-label="Show all personal bests"
>
  <i class="fas fa-ellipsis-v"></i>
</button></div>`;

  const htmlToShow = isProfile ? "" : showAllButton;

  $(`.page${source} .profile .pbsWords`).html(`
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
    ${htmlToShow}
  `);
  $(`.page${source} .profile .pbsTime`).html(`
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
    ${htmlToShow}
  `);
}

export function update(
  personalBests?: SharedTypes.PersonalBests,
  isProfile = false
): void {
  clearTables(isProfile);

  if (personalBests === undefined) return;
  let text = "";

  const source = isProfile ? "Profile" : "Account";

  $(`.page${source} .profile .pbsTime`).html("");
  $(`.page${source} .profile .pbsWords`).html("");

  const timeMode2s: SharedTypes.Mode2<"time">[] = ["15", "30", "60", "120"];
  const wordMode2s: SharedTypes.Mode2<"words">[] = ["10", "25", "50", "100"];

  timeMode2s.forEach((mode2) => {
    text += buildPbHtml(personalBests, "time", mode2);
  });

  const showAllButton = isProfile
    ? ""
    : `<div class="buttonGroup"><button
      class="showAllButton"
      data-balloon-pos="left"
      aria-label="Show all personal bests"
    >
      <i class="fas fa-ellipsis-v"></i>
    </button></div>`;

  $(`.page${source} .profile .pbsTime`).append(text + showAllButton);

  text = "";
  wordMode2s.forEach((mode2) => {
    text += buildPbHtml(personalBests, "words", mode2);
  });

  $(`.page${source} .profile .pbsWords`).append(text + showAllButton);
}

function buildPbHtml(
  pbs: SharedTypes.PersonalBests,
  mode: "time" | "words",
  mode2: SharedTypes.StringNumber
): string {
  let retval = "";
  let dateText = "";
  const modeString = `${mode2} ${mode === "time" ? "seconds" : "words"}`;
  const speedUnit = Config.typingSpeedUnit;
  const typingSpeedUnit = getTypingSpeedUnit(Config.typingSpeedUnit);
  try {
    const pbData = (pbs[mode][mode2] ?? []).sort((a, b) => b.wpm - a.wpm)[0];

    if (pbData === undefined) throw new Error("No PB data found");

    const date = new Date(pbData.timestamp);
    if (pbData.timestamp) {
      dateText = format(date, "dd MMM yyyy");
    }

    let speedString: number | string = typingSpeedUnit.fromWpm(pbData.wpm);
    if (Config.alwaysShowDecimalPlaces) {
      speedString = Misc.roundTo2(speedString).toFixed(2);
    } else {
      speedString = Math.round(speedString);
    }
    speedString += ` ${speedUnit}`;

    let rawString: number | string = typingSpeedUnit.fromWpm(pbData.raw);
    if (Config.alwaysShowDecimalPlaces) {
      rawString = Misc.roundTo2(rawString).toFixed(2);
    } else {
      rawString = Math.round(rawString);
    }
    rawString += ` raw`;

    let accString: number | string = pbData.acc;
    if (accString === undefined) {
      accString = "-";
    } else {
      if (Config.alwaysShowDecimalPlaces) {
        accString = Misc.roundTo2(accString).toFixed(2);
      } else {
        accString = Math.floor(accString);
      }
    }
    accString += ` acc`;

    let conString: number | string = pbData.consistency;
    if (conString === undefined) {
      conString = "-";
    } else {
      if (Config.alwaysShowDecimalPlaces) {
        conString = Misc.roundTo2(conString).toFixed(2);
      } else {
        conString = Math.round(conString);
      }
    }
    conString += ` con`;

    retval = `<div class="quick">
      <div class="test">${modeString}</div>
      <div class="wpm">${Math.round(typingSpeedUnit.fromWpm(pbData.wpm))}</div>
      <div class="acc">${
        pbData.acc === undefined ? "-" : Math.floor(pbData.acc) + "%"
      }</div>
    </div>
    <div class="fullTest">
      <div>${modeString}</div>
      <div>${speedString}</div>
      <div>${rawString}</div>
      <div>${accString}</div>
      <div>${conString}</div>
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
