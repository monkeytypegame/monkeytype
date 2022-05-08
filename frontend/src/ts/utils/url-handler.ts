import * as Misc from "./misc";
import Config, * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import { decompressFromURI } from "lz-ts";
import * as QuoteSearchPopup from "../popups/quote-search-popup";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomText from "../test/custom-text";
import { restart as restartTest } from "../test/test-logic";

export function loadCustomThemeFromUrl(getOverride?: string): void {
  const getValue = Misc.findGetParameter("customTheme", getOverride);
  if (getValue === null) return;

  const urlEncoded = getValue.split(",");
  const base64decoded = JSON.parse(atob(getValue) ?? "");

  let colorArray = [];
  if (Array.isArray(urlEncoded) && urlEncoded.length === 10) {
    colorArray = urlEncoded;
  } else if (Array.isArray(base64decoded) && base64decoded.length === 10) {
    colorArray = base64decoded;
  }

  if (colorArray.length === 0) {
    return Notifications.add("Invalid custom theme ", 0);
  }

  const oldCustomTheme = Config.customTheme;
  const oldCustomThemeColors = Config.customThemeColors;
  try {
    UpdateConfig.setCustomThemeColors(colorArray);
    Notifications.add("Custom theme applied", 1);

    if (!Config.customTheme) UpdateConfig.setCustomTheme(true);
  } catch (e) {
    Notifications.add("Something went wrong. Reverting to previous state.", 0);
    console.error(e);
    UpdateConfig.setCustomTheme(oldCustomTheme);
    UpdateConfig.setCustomThemeColors(oldCustomThemeColors);
  }
}

type SharedTestSettings = [
  MonkeyTypes.Mode | null,
  MonkeyTypes.Mode2<MonkeyTypes.Mode> | null,
  MonkeyTypes.CustomText | null,
  boolean | null,
  boolean | null,
  string | null,
  MonkeyTypes.Difficulty | null,
  string | null
];

export function loadTestSettingsFromUrl(getOverride?: string): void {
  const getValue = Misc.findGetParameter("testSettings", getOverride);
  if (getValue === null) return;

  const de: SharedTestSettings = JSON.parse(decompressFromURI(getValue) ?? "");

  const applied: { [key: string]: string } = {};

  if (de[0]) {
    UpdateConfig.setMode(de[0], true);
    applied["mode"] = de[0];
  }

  if (de[1]) {
    if (Config.mode === "time") {
      UpdateConfig.setTimeConfig(parseInt(de[1], 10), true);
    } else if (Config.mode === "words") {
      UpdateConfig.setWordCount(parseInt(de[1], 10), true);
    } else if (Config.mode === "quote") {
      UpdateConfig.setQuoteLength(-2, false);
      QuoteSearchPopup.setSelectedId(parseInt(de[1], 10));
      ManualRestart.set();
    }
    applied["mode2"] = de[1];
  }

  if (de[2]) {
    const customTextSettings = de[2];
    CustomText.setText(customTextSettings["text"]);
    CustomText.setIsTimeRandom(customTextSettings["isTimeRandom"]);
    CustomText.setIsWordRandom(customTextSettings["isWordRandom"]);
    if (customTextSettings["isTimeRandom"]) {
      CustomText.setWord(customTextSettings["time"]);
    }
    if (customTextSettings["isWordRandom"]) {
      CustomText.setTime(customTextSettings["word"]);
    }
    CustomText.setDelimiter(customTextSettings["delimiter"]);
    applied["custom text settings"] = "";
  }

  if (de[3]) {
    UpdateConfig.setPunctuation(de[3], true);
    applied["punctuation"] = de[3] ? "on" : "off";
  }

  if (de[4]) {
    UpdateConfig.setNumbers(de[4], true);
    applied["numbers"] = de[4] ? "on" : "off";
  }

  if (de[5]) {
    UpdateConfig.setLanguage(de[5], true);
    applied["language"] = de[5];
  }

  if (de[6]) {
    UpdateConfig.setDifficulty(de[6], true);
    applied["difficulty"] = de[6];
  }

  if (de[7]) {
    UpdateConfig.setFunbox(de[7], true);
    applied["funbox"] = de[7];
  }

  restartTest();

  let appliedString = "";

  Object.keys(applied).forEach((setKey) => {
    const set = applied[setKey];
    appliedString += `${setKey}${set ? ": " + set : ""}<br>`;
  });

  if (appliedString !== "") {
    Notifications.add(
      "Settings applied from URL:<br><br>" + appliedString,
      1,
      10
    );
  }
}
