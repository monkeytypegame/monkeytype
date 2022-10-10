import * as PaceCaret from "../test/pace-caret";
import * as TestState from "../test/test-state";
import * as DB from "../db";
import * as Last10Average from "../elements/last-10-average";
import Config from "../config";
import * as TestWords from "../test/test-words";
import * as ConfigEvent from "../observables/config-event";
import { Auth } from "../firebase";
import * as CustomTextState from "../states/custom-text-name";

ConfigEvent.subscribe((eventKey) => {
  if (
    [
      "difficulty",
      "blindMode",
      "stopOnError",
      "paceCaret",
      "minWpm",
      "minAcc",
      "minBurst",
      "confidenceMode",
      "layout",
      "showAverage",
      "alwaysShowCPM",
    ].includes(eventKey)
  ) {
    update();
  }
});

export async function update(): Promise<void> {
  let anim = false;
  if ($(".pageTest #testModesNotice").text() === "") anim = true;

  $(".pageTest #testModesNotice").empty();

  if (TestState.isRepeated && Config.mode !== "quote") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton noInteraction" style="color:var(--error-color);"><i class="fas fa-sync-alt"></i>repeated</div>`
    );
  }

  if (!TestState.savingEnabled) {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="resultSaving" style="color:var(--error-color);"><i class="fas fa-save"></i>saving disabled</div>`
    );
  }

  if (TestWords.hasTab) {
    if (Config.quickRestart === "esc") {
      $(".pageTest #testModesNotice").append(
        `<div class="textButton noInteraction"><i class="fas fa-long-arrow-alt-right"></i>shift + tab to open commandline</div>`
      );
    } else {
      $(".pageTest #testModesNotice").append(
        `<div class="textButton noInteraction"><i class="fas fa-long-arrow-alt-right"></i>shift + tab to restart</div>`
      );
    }
  }

  const customTextName = CustomTextState.getCustomTextName();
  const isLong = CustomTextState.isCustomTextLong();
  if (Config.mode === "custom" && customTextName !== "" && isLong) {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton noInteraction"><i class="fas fa-book"></i>${customTextName} (shift + enter to save progress)</div>`
    );
  }

  if (TestState.activeChallenge) {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton noInteraction"><i class="fas fa-award"></i>${TestState.activeChallenge.display}</div>`
    );
  }

  if (Config.mode === "zen") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton noInteraction"><i class="fas fa-poll"></i>shift + enter to finish zen </div>`
    );
  }

  if (Config.mode !== "zen") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="languages"><i class="fas fa-globe-americas"></i>${Config.language.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (Config.difficulty === "expert") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="difficulty"><i class="fas fa-star-half-alt"></i>expert</div>`
    );
  } else if (Config.difficulty === "master") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="difficulty"><i class="fas fa-star"></i>master</div>`
    );
  }

  if (Config.blindMode) {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="blindMode"><i class="fas fa-eye-slash"></i>blind</div>`
    );
  }

  if (Config.lazyMode) {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="lazyMode"><i class="fas fa-couch"></i>lazy</div>`
    );
  }

  if (
    Config.paceCaret !== "off" ||
    (Config.repeatedPace && TestState.isPaceRepeat)
  ) {
    let speed = "";
    try {
      speed = ` (${Math.round(PaceCaret.settings?.wpm ?? 0)} wpm)`;
    } catch {}
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="paceCaretMode"><i class="fas fa-tachometer-alt"></i>${
        Config.paceCaret === "average"
          ? "average"
          : Config.paceCaret === "pb"
          ? "pb"
          : Config.paceCaret === "last"
          ? "last"
          : Config.paceCaret === "daily"
          ? "daily"
          : "custom"
      } pace${speed}</div>`
    );
  }

  if (Config.showAverage !== "off") {
    let avgWPM = Last10Average.getWPM();
    let avgAcc = Last10Average.getAcc();

    if (!Config.alwaysShowDecimalPlaces) {
      avgWPM = Math.round(avgWPM);
      avgAcc = Math.round(avgAcc);
    }

    if (Auth?.currentUser && avgWPM > 0) {
      const avgWPMText = ["wpm", "both"].includes(Config.showAverage)
        ? Config.alwaysShowCPM
          ? `${Math.round(avgWPM * 5)} cpm`
          : `${avgWPM} wpm`
        : "";

      const avgAccText = ["acc", "both"].includes(Config.showAverage)
        ? `${avgAcc}% acc`
        : "";

      const text = `${avgWPMText} ${avgAccText}`.trim();

      $(".pageTest #testModesNotice").append(
        `<div class="textButton" commands="showAverage"><i class="fas fa-chart-bar"></i>avg: ${text}</div>`
      );
    }
  }

  if (Config.minWpm !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="minWpm"><i class="fas fa-bomb"></i>min ${Config.minWpmCustomSpeed} wpm</div>`
    );
  }

  if (Config.minAcc !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="minAcc"><i class="fas fa-bomb"></i>min ${Config.minAccCustom}% acc</div>`
    );
  }

  if (Config.minBurst !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="minBurst"><i class="fas fa-bomb"></i>min ${
        Config.minBurstCustomSpeed
      } burst ${Config.minBurst === "flex" ? "(flex)" : ""}</div>`
    );
  }

  if (Config.funbox !== "none") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="funbox"><i class="fas fa-gamepad"></i>${Config.funbox.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (Config.confidenceMode === "on") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="confidenceMode"><i class="fas fa-backspace"></i>confidence</div>`
    );
  }
  if (Config.confidenceMode === "max") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="confidenceMode"><i class="fas fa-backspace"></i>max confidence</div>`
    );
  }

  if (Config.stopOnError != "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="stopOnError"><i class="fas fa-hand-paper"></i>stop on ${Config.stopOnError}</div>`
    );
  }

  if (Config.layout !== "default") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="layouts"><i class="fas fa-keyboard"></i>emulating ${Config.layout.replace(
        /_/g,
        " "
      )}</div>`
    );
  }

  if (Config.oppositeShiftMode !== "off") {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton" commands="oppositeShiftMode"><i class="fas fa-exchange-alt"></i>opposite shift${
        Config.oppositeShiftMode === "keymap" ? " (keymap)" : ""
      }</div>`
    );
  }

  let tagsString = "";
  try {
    DB.getSnapshot().tags?.forEach((tag) => {
      if (tag.active === true) {
        tagsString += tag.display + ", ";
      }
    });

    if (tagsString !== "") {
      $(".pageTest #testModesNotice").append(
        `<div class="textButton" commands="tags"><i class="fas fa-tag"></i>${tagsString.substring(
          0,
          tagsString.length - 2
        )}</div>`
      );
    }
  } catch {}

  if (anim) {
    $(".pageTest #testModesNotice")
      .css("transition", "none")
      .css("opacity", 0)
      .animate(
        {
          opacity: 1,
        },
        125,
        () => {
          $(".pageTest #testModesNotice").css("transition", ".125s");
        }
      );
  }
}
