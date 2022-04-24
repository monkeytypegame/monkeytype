import * as Misc from "./misc";
import Config, * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import { decompressFromURI } from "lz-ts";
import * as QuoteSearchPopup from "../popups/quote-search-popup";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomText from "../test/custom-text";
import { restart as restartTest } from "../test/test-logic";

export function loadCustomThemeFromUrl(): void {
  const getValue = Misc.findGetParameter("customTheme");
  if (getValue === null) return;

  const urlEncoded = getValue.split(",");
  let base64decoded = null;
  try {
    base64decoded = JSON.parse(atob(getValue) ?? "");
  } catch (e) {
    //
  }

  let colorArray = [];
  if (Array.isArray(urlEncoded) && urlEncoded.length === 9) {
    colorArray = urlEncoded;
  } else if (Array.isArray(base64decoded) && base64decoded.length === 9) {
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

export function loadTestSettingsFromUrl(): void {
  const getValue = Misc.findGetParameter("testSettings");
  if (getValue === null) return;

  let de = decompressFromURI(getValue);
  try {
    de = JSON.parse(de ?? "");
  } catch (e) {
    //
  }

  const applied: { [key: string]: string } = {};

  if (de[0]) {
    UpdateConfig.setMode(de[0] as MonkeyTypes.Mode, true);
    applied["mode"] = de[0];
  }

  if (de[1]) {
    if (Config.mode === "time") {
      UpdateConfig.setTimeConfig(parseInt(de[1], 10), true);
    } else if (Config.mode === "words") {
      UpdateConfig.setWordCount(parseInt(de[1], 10), true);
    } else if (Config.mode === "quote") {
      UpdateConfig.setQuoteLength(-2 as MonkeyTypes.QuoteLength, false);
      QuoteSearchPopup.setSelectedId(parseInt(de[1], 10));
      ManualRestart.set();
    }
    applied["mode2"] = de[1];
  }

  if (de[2]) {
    const customTextSettings = de[2] as unknown as {
      [key: string]: string | number | boolean | string[];
    };
    CustomText.setText((customTextSettings["text"] as string).split(" "));
    CustomText.setIsTimeRandom(customTextSettings["isTimeRandom"] as boolean);
    CustomText.setIsWordRandom(customTextSettings["isWordRandom"] as boolean);
    if (customTextSettings["isTimeRandom"]) {
      CustomText.setWord(customTextSettings["time"] as number);
    }
    if (customTextSettings["isWordRandom"]) {
      CustomText.setTime(customTextSettings["word"] as number);
    }
    CustomText.setDelimiter(customTextSettings["delimiter"] as string);
    applied["custom text settings"] = "";
  }

  if (de[3]) {
    UpdateConfig.setPunctuation(de[3] as unknown as boolean, true);
    applied["punctuation"] = de[3] ? "on" : "off";
  }

  if (de[4]) {
    UpdateConfig.setNumbers(de[4] as unknown as boolean, true);
    applied["numbers"] = de[4] ? "on" : "off";
  }

  if (de[5]) {
    UpdateConfig.setLanguage(de[5] as unknown as string, true);
    applied["language"] = de[5];
  }

  if (de[6]) {
    UpdateConfig.setDifficulty(
      de[6] as unknown as MonkeyTypes.Difficulty,
      true
    );
    applied["difficulty"] = de[6];
  }

  if (de[7]) {
    UpdateConfig.setFunbox(de[7] as unknown as string, true);
    applied["funbox"] = de[7];
  }

  restartTest();

  let appliedString = "";

  if (appliedString === "") {
    return;
  }

  Object.keys(applied).forEach((setKey) => {
    const set = applied[setKey];
    appliedString += `${setKey}${set ? ": " + set : ""}<br>`;
  });

  Notifications.add(
    "Settings applied from URL:<br><br>" + appliedString,
    1,
    10
  );
}
