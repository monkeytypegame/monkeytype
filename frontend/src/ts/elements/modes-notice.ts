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
import { getActiveFunboxes, getActiveFunboxNames } from "../test/funbox/list";
import { escapeHTML, getMode2 } from "../utils/misc";
import { qsr } from "../utils/dom";

ConfigEvent.subscribe(({ key }) => {
  const configKeys: ConfigEvent.ConfigEventKey[] = [
    "difficulty",
    "blindMode",
    "stopOnError",
    "paceCaret",
    "minWpm",
    "minWpmCustomSpeed",
    "minAcc",
    "minAccCustom",
    "minBurst",
    "confidenceMode",
    "layout",
    "showAverage",
    "showPb",
    "typingSpeedUnit",
    "quickRestart",
    "customPolyglot",
    "alwaysShowDecimalPlaces",
    "resultSaving",
  ];
  if (configKeys.includes(key)) {
    void update();
  }
});

const testModesNotice = qsr(".pageTest #testModesNotice");

export async function update(): Promise<void> {
  testModesNotice.empty();

  if (TestState.isRepeated && Config.mode !== "quote") {
    testModesNotice.appendHtml(
      `<div class="textButton noInteraction" style="color:var(--error-color);"><i class="fas fa-sync-alt"></i>repeated</div>`,
    );
  }

  if (!Config.resultSaving) {
    testModesNotice.appendHtml(
      `<div class="textButton" commands="resultSaving" style="color:var(--error-color);"><i class="fas fa-save"></i>saving disabled</div>`,
    );
  }

  if (TestWords.hasTab) {
    if (Config.quickRestart === "esc") {
      testModesNotice.appendHtml(
        `<div class="textButton noInteraction"><i class="fas fa-long-arrow-alt-right"></i>shift + tab to open commandline</div>`,
      );
      testModesNotice.appendHtml(
        `<div class="textButton noInteraction"><i class="fas fa-level-down-alt fa-rotate-90"></i>shift + esc to restart</div>`,
      );
    }
    if (Config.quickRestart === "tab") {
      testModesNotice.appendHtml(
        `<div class="textButton noInteraction"><i class="fas fa-level-down-alt fa-rotate-90"></i>shift + tab to restart</div>`,
      );
    }
  }

  if (
    (TestWords.hasNewline || Config.funbox.includes("58008")) &&
    Config.quickRestart === "enter"
  ) {
    testModesNotice.appendHtml(
      `<div class="textButton noInteraction"><i class="fas fa-level-down-alt fa-rotate-90"></i>shift + enter to restart</div>`,
    );
  }

  const customTextName = CustomTextState.getCustomTextName();
  const isLong = CustomTextState.isCustomTextLong();
  if (Config.mode === "custom" && customTextName !== "" && isLong) {
    testModesNotice.appendHtml(
      `<div class="textButton noInteraction"><i class="fas fa-book"></i>${escapeHTML(
        customTextName,
      )} (shift + enter to save progress)</div>`,
    );
  }

  if (TestState.activeChallenge) {
    testModesNotice.appendHtml(
      `<div class="textButton noInteraction"><i class="fas fa-award"></i>${TestState.activeChallenge.display}</div>`,
    );
  }

  if (Config.mode === "zen") {
    testModesNotice.appendHtml(
      `<div class="textButton noInteraction"><i class="fas fa-poll"></i>shift + enter to finish zen </div>`,
    );
  }

  const usingPolyglot = getActiveFunboxNames().includes("polyglot");

  if (Config.mode !== "zen" && !usingPolyglot) {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="language"><i class="fas fa-globe-americas"></i>${getLanguageDisplayString(
        Config.language,
        Config.mode === "quote",
      )}</button>`,
    );
  }

  if (usingPolyglot) {
    const languages = Config.customPolyglot
      .map((lang) => {
        const langDisplay = getLanguageDisplayString(lang, true);
        return langDisplay;
      })
      .join(", ");

    testModesNotice.appendHtml(
      `<button class="textButton" commandId="setCustomPolyglotCustom"><i class="fas fa-globe-americas"></i>${languages}</button>`,
    );
  }

  if (Config.difficulty === "expert") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="difficulty"><i class="fas fa-star-half-alt"></i>expert</button>`,
    );
  } else if (Config.difficulty === "master") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="difficulty"><i class="fas fa-star"></i>master</button>`,
    );
  }

  if (Config.blindMode) {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="blindMode"><i class="fas fa-eye-slash"></i>blind</button>`,
    );
  }

  if (Config.lazyMode) {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="lazyMode"><i class="fas fa-couch"></i>lazy</button>`,
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

    testModesNotice.appendHtml(
      `<button class="textButton" commands="paceCaret"><i class="fas fa-tachometer-alt"></i>${
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
      } pace ${speed}</button>`,
    );
  }

  if (Config.showAverage !== "off") {
    const avgWPM = Last10Average.getWPM();
    const avgAcc = Last10Average.getAcc();

    if (isAuthenticated() && avgWPM > 0) {
      const avgWPMText = ["speed", "both"].includes(Config.showAverage)
        ? Format.typingSpeed(avgWPM, { suffix: ` ${Config.typingSpeedUnit}` })
        : "";

      const avgAccText = ["acc", "both"].includes(Config.showAverage)
        ? Format.accuracy(avgAcc, { suffix: " acc" })
        : "";

      const text = `${avgWPMText} ${avgAccText}`.trim();

      testModesNotice.appendHtml(
        `<button class="textButton" commands="showAverage"><i class="fas fa-chart-bar"></i>avg: ${text}</button>`,
      );
    }
  }

  if (Config.showPb) {
    if (!isAuthenticated()) {
      return;
    }
    const mode2 = getMode2(Config, TestWords.currentQuote);
    const pb = await DB.getLocalPB(
      Config.mode,
      mode2,
      Config.punctuation,
      Config.numbers,
      Config.language,
      Config.difficulty,
      Config.lazyMode,
      getActiveFunboxes(),
    );

    let str = "no pb";

    if (pb !== undefined) {
      str = `${Format.typingSpeed(pb.wpm, {
        showDecimalPlaces: true,
        suffix: ` ${Config.typingSpeedUnit}`,
      })} ${pb?.acc}% acc`;
    }

    testModesNotice.appendHtml(
      `<button class="textButton" commands="showPb"><i class="fas fa-crown"></i>${str}</button>`,
    );
  }

  if (Config.minWpm !== "off") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="minWpm"><i class="fas fa-bomb"></i>min ${Format.typingSpeed(
        Config.minWpmCustomSpeed,
        { showDecimalPlaces: false, suffix: ` ${Config.typingSpeedUnit}` },
      )}</button>`,
    );
  }

  if (Config.minAcc !== "off") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="minAcc"><i class="fas fa-bomb"></i>min ${Config.minAccCustom}% acc</button>`,
    );
  }

  if (Config.minBurst !== "off") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="minBurst"><i class="fas fa-bomb"></i>min ${Format.typingSpeed(
        Config.minBurstCustomSpeed,
        { showDecimalPlaces: false },
      )} ${Config.typingSpeedUnit} burst ${
        Config.minBurst === "flex" ? "(flex)" : ""
      }</button>`,
    );
  }

  if (Config.funbox.length > 0) {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="funbox"><i class="fas fa-gamepad"></i>${Config.funbox
        .map((it) => it.replace(/_/g, " "))
        .join(", ")}</button>`,
    );
  }

  if (Config.confidenceMode === "on") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="confidenceMode"><i class="fas fa-backspace"></i>confidence</button>`,
    );
  }
  if (Config.confidenceMode === "max") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="confidenceMode"><i class="fas fa-backspace"></i>max confidence</button>`,
    );
  }

  if (Config.stopOnError !== "off") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="stopOnError"><i class="fas fa-hand-paper"></i>stop on ${Config.stopOnError}</button>`,
    );
  }

  if (Config.layout !== "default") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="layout"><i class="fas fa-keyboard"></i>emulating ${Config.layout.replace(
        /_/g,
        " ",
      )}</button>`,
    );
  }

  if (Config.oppositeShiftMode !== "off") {
    testModesNotice.appendHtml(
      `<button class="textButton" commands="oppositeShiftMode"><i class="fas fa-exchange-alt"></i>opposite shift${
        Config.oppositeShiftMode === "keymap" ? " (keymap)" : ""
      }</button>`,
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
      testModesNotice.appendHtml(
        `<button class="textButton" commands="tags"><i class="fas fa-tag"></i>${tagsString.substring(
          0,
          tagsString.length - 2,
        )}</button>`,
      );
    }
  } catch {}
}
