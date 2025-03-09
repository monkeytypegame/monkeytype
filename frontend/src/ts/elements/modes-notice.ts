import * as PaceCaret from "../test/pace-caret";
import * as TestState from "../test/test-state";
import * as DB from "../db";
import * as Last10Average from "../elements/last-10-average";
import Config from "../config";
import * as TestWords from "../test/test-words";
import * as ConfigEvent from "../observables/config-event";
import { isAuthenticated } from "../firebase";
import * as CustomTextState from "../states/custom-text-name";
import { getLanguageDisplayString } from "../utils/strings";
import Format from "../utils/format";

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
      "typingSpeedUnit",
      "quickRestart",
    ].includes(eventKey)
  ) {
    void update();
  }
});

export async function update(): Promise<void> {
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
      $(".pageTest #testModesNotice").append(
        `<div class="textButton noInteraction"><i class="fas fa-level-down-alt fa-rotate-90"></i>shift + esc to restart</div>`
      );
    }
    if (Config.quickRestart === "tab") {
      $(".pageTest #testModesNotice").append(
        `<div class="textButton noInteraction"><i class="fas fa-level-down-alt fa-rotate-90"></i>shift + tab to restart</div>`
      );
    }
  }

  if (
    (TestWords.hasNewline || Config.funbox.includes("58008")) &&
    Config.quickRestart === "enter"
  ) {
    $(".pageTest #testModesNotice").append(
      `<div class="textButton noInteraction"><i class="fas fa-level-down-alt fa-rotate-90"></i>shift + enter to restart</div>`
    );
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
      `<button class="textButton" commands="languages"><i class="fas fa-globe-americas"></i>${getLanguageDisplayString(
        Config.language,
        Config.mode === "quote"
      )}</button>`
    );
  }

  if (Config.difficulty === "expert") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="difficulty"><i class="fas fa-star-half-alt"></i>expert</button>`
    );
  } else if (Config.difficulty === "master") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="difficulty"><i class="fas fa-star"></i>master</button>`
    );
  }

  if (Config.blindMode) {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="blindMode"><i class="fas fa-eye-slash"></i>blind</button>`
    );
  }

  if (Config.lazyMode) {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="lazyMode"><i class="fas fa-couch"></i>lazy</button>`
    );
  }

  if (
    Config.paceCaret !== "off" ||
    (Config.repeatedPace && TestState.isPaceRepeat)
  ) {
    const speed = Format.typingSpeed(PaceCaret.settings?.wpm ?? 0, {
      showDecimalPlaces: false,
      suffix: ` ${Config.typingSpeedUnit}`,
    });

    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="paceCaretMode"><i class="fas fa-tachometer-alt"></i>${
        Config.paceCaret === "average"
          ? "average"
          : Config.paceCaret === "pb"
          ? "pb"
          : Config.paceCaret === "tagPb"
          ? "tag pb"
          : Config.paceCaret === "last"
          ? "last"
          : Config.paceCaret === "daily"
          ? "daily"
          : "custom"
      } pace ${speed}</button>`
    );
  }

  if (Config.showAverage !== "off") {
    const avgWPM = Last10Average.getWPM();
    const avgAcc = Last10Average.getAcc();

    if (isAuthenticated() && avgWPM > 0) {
      const avgWPMText = ["speed", "both"].includes(Config.showAverage)
        ? Format.typingSpeed(avgWPM, {
            suffix: ` ${Config.typingSpeedUnit}`,
            showDecimalPlaces: false,
          })
        : "";

      const avgAccText = ["acc", "both"].includes(Config.showAverage)
        ? Format.accuracy(avgAcc, { suffix: " acc", showDecimalPlaces: false })
        : "";

      const text = `${avgWPMText} ${avgAccText}`.trim();

      $(".pageTest #testModesNotice").append(
        `<button class="textButton" commands="showAverage"><i class="fas fa-chart-bar"></i>avg: ${text}</button>`
      );
    }
  }

  if (Config.minWpm !== "off") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="minWpm"><i class="fas fa-bomb"></i>min ${Format.typingSpeed(
        Config.minWpmCustomSpeed,
        { showDecimalPlaces: false, suffix: ` ${Config.typingSpeedUnit}` }
      )}</button>`
    );
  }

  if (Config.minAcc !== "off") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="minAcc"><i class="fas fa-bomb"></i>min ${Config.minAccCustom}% acc</button>`
    );
  }

  if (Config.minBurst !== "off") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="minBurst"><i class="fas fa-bomb"></i>min ${Format.typingSpeed(
        Config.minBurstCustomSpeed,
        { showDecimalPlaces: false }
      )} ${Config.typingSpeedUnit} burst ${
        Config.minBurst === "flex" ? "(flex)" : ""
      }</button>`
    );
  }

  if (Config.funbox !== "none") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="funbox"><i class="fas fa-gamepad"></i>${Config.funbox
        .replace(/_/g, " ")
        .replace(/#/g, ", ")}</button>`
    );
  }

  if (Config.confidenceMode === "on") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="confidenceMode"><i class="fas fa-backspace"></i>confidence</button>`
    );
  }
  if (Config.confidenceMode === "max") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="confidenceMode"><i class="fas fa-backspace"></i>max confidence</button>`
    );
  }

  if (Config.stopOnError !== "off") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="stopOnError"><i class="fas fa-hand-paper"></i>stop on ${Config.stopOnError}</button>`
    );
  }

  if (Config.layout !== "default") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="layouts"><i class="fas fa-keyboard"></i>emulating ${Config.layout.replace(
        /_/g,
        " "
      )}</button>`
    );
  }

  if (Config.oppositeShiftMode !== "off") {
    $(".pageTest #testModesNotice").append(
      `<button class="textButton" commands="oppositeShiftMode"><i class="fas fa-exchange-alt"></i>opposite shift${
        Config.oppositeShiftMode === "keymap" ? " (keymap)" : ""
      }</button>`
    );
  }

  let tagsString = "";
  try {
    DB.getSnapshot()?.tags?.forEach((tag) => {
      if (tag.active === true) {
        tagsString += tag.display + ", ";
      }
    });

    if (tagsString !== "") {
      $(".pageTest #testModesNotice").append(
        `<button class="textButton" commands="tags"><i class="fas fa-tag"></i>${tagsString.substring(
          0,
          tagsString.length - 2
        )}</button>`
      );
    }
  } catch {}
}

if (import.meta.hot !== undefined) {
  import.meta.hot.dispose(() => {
    //
  });
  import.meta.hot.accept(() => {
    //
  });
  import.meta.hot.on("vite:afterUpdate", () => {
    void update();
  });
}
