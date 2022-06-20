import Config from "../config";
import format from "date-fns/format";

function clearTables(isProfile: boolean): void {
  const source = isProfile ? "Profile" : "Account";

  const showAllButton = `<div  
  class="showAllButton button"
  data-balloon-pos="left"
  aria-label="Show all personal bests"
>
  <i class="fas fa-ellipsis-v"></i>
</div>`;

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
  personalBests?: MonkeyTypes.PersonalBests,
  isProfile = false
): void {
  clearTables(isProfile);

  if (personalBests === undefined) return;
  let text = "";

  const source = isProfile ? "Profile" : "Account";

  $(`.page${source} .profile .pbsTime`).html("");
  $(`.page${source} .profile .pbsWords`).html("");

  text = "";
  [15, 30, 60, 120].forEach((mode2) => {
    text += buildPbHtml(personalBests, "time", mode2);
  });

  const showAllButton = isProfile
    ? ""
    : `<div class="buttonGroup"><div
      class="showAllButton button"
      data-balloon-pos="left"
      aria-label="Show all personal bests"
    >
      <i class="fas fa-ellipsis-v"></i>
    </div></div>`;

  $(`.page${source} .profile .pbsTime`).append(text + showAllButton);

  text = "";
  [10, 25, 50, 100].forEach((mode2) => {
    text += buildPbHtml(personalBests, "words", mode2);
  });

  $(`.page${source} .profile .pbsWords`).append(text + showAllButton);
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
