import Config from "../../config";
import { format as dateFormat } from "date-fns/format";
import Format from "../../utils/format";
import { Mode2, PersonalBests } from "@monkeytype/contracts/schemas/shared";
import { StringNumber } from "@monkeytype/contracts/schemas/util";

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

export function update(personalBests?: PersonalBests, isProfile = false): void {
  clearTables(isProfile);

  if (personalBests === undefined) return;
  let text = "";

  const source = isProfile ? "Profile" : "Account";

  $(`.page${source} .profile .pbsTime`).html("");
  $(`.page${source} .profile .pbsWords`).html("");

  const timeMode2s: Mode2<"time">[] = ["15", "30", "60", "120"];
  const wordMode2s: Mode2<"words">[] = ["10", "25", "50", "100"];

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
  pbs: PersonalBests,
  mode: "time" | "words",
  mode2: StringNumber
): string {
  let retval = "";
  let dateText = "";
  const modeString = `${mode2} ${mode === "time" ? "seconds" : "words"}`;
  const speedUnit = Config.typingSpeedUnit;
  try {
    const pbData = (pbs[mode][mode2] ?? []).sort((a, b) => b.wpm - a.wpm)[0];

    if (pbData === undefined) throw new Error("No PB data found");

    const date = new Date(pbData.timestamp);
    if (pbData.timestamp !== undefined && pbData.timestamp > 0) {
      dateText = dateFormat(date, "dd MMM yyyy");
    }

    retval = `<div class="quick">
      <div class="test">${modeString}</div>
      <div class="wpm">${Format.typingSpeed(pbData.wpm, {
        showDecimalPlaces: false,
      })}</div>
      <div class="acc">${Format.accuracy(pbData.acc, {
        showDecimalPlaces: false,
      })}</div>
    </div>
    <div class="fullTest">
      <div>${modeString}</div>
      <div>${Format.typingSpeed(pbData.wpm, {
        suffix: ` ${speedUnit}`,
      })}</div>
      <div>${Format.typingSpeed(pbData.raw, { suffix: " raw" })}</div>
      <div>${Format.accuracy(pbData.acc, { suffix: " acc" })}</div>
      <div>${Format.percentage(pbData.consistency, { suffix: " con" })}</div>
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
