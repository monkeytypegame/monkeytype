import * as Misc from "./misc";
import Config, * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import { decompressFromURI } from "lz-ts";
import * as TestState from "../test/test-state";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomText from "../test/custom-text";
import Ape from "../ape";
import * as Settings from "../pages/settings";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as AccountButton from "../elements/account-button";
import { restart as restartTest } from "../test/test-logic";
import * as ChallengeController from "../controllers/challenge-controller";

export async function linkDiscord(hashOverride: string): Promise<void> {
  if (!hashOverride) return;
  const fragment = new URLSearchParams(hashOverride.slice(1));
  if (fragment.has("access_token")) {
    history.replaceState(null, "", "/");
    const accessToken = fragment.get("access_token") as string;
    const tokenType = fragment.get("token_type") as string;
    const state = fragment.get("state") as string;

    Loader.show();
    const response = await Ape.users.linkDiscord(tokenType, accessToken, state);
    Loader.hide();

    if (response.status !== 200) {
      return Notifications.add(
        "Failed to link Discord: " + response.message,
        -1
      );
    }

    if (response.data === null) {
      return Notifications.add(
        "Failed to link Discord: data returned was null",
        -1
      );
    }

    Notifications.add(response.message, 1);

    const snapshot = DB.getSnapshot();
    if (!snapshot) return;

    const { discordId, discordAvatar } = response.data;
    if (discordId !== undefined) {
      snapshot.discordId = discordId;
    } else {
      snapshot.discordAvatar = discordAvatar;
    }

    DB.setSnapshot(snapshot);

    void AccountButton.update(undefined, discordId, discordAvatar);

    Settings.updateDiscordSection();
  }
}

export function loadCustomThemeFromUrl(getOverride?: string): void {
  const getValue = Misc.findGetParameter("customTheme", getOverride);
  if (getValue === null) return;

  let decoded = null;
  try {
    decoded = JSON.parse(atob(getValue));
  } catch (e) {
    return Notifications.add("Invalid custom theme ", 0);
  }

  let colorArray = [];
  let image, size, filter;
  if (Array.isArray(decoded.c) && decoded.c.length === 10) {
    colorArray = decoded.c;
    image = decoded.i;
    size = decoded.s;
    filter = decoded.f;
  } else if (Array.isArray(decoded) && decoded.length === 10) {
    // This is for backward compatibility with old format
    colorArray = decoded;
  }

  if (colorArray.length === 0) {
    return Notifications.add("Invalid custom theme ", 0);
  }

  const oldCustomTheme = Config.customTheme;
  const oldCustomThemeColors = Config.customThemeColors;
  try {
    UpdateConfig.setCustomThemeColors(colorArray);
    Notifications.add("Custom theme applied", 1);

    if (image !== undefined) {
      UpdateConfig.setCustomBackground(image);
      UpdateConfig.setCustomBackgroundSize(size);
      UpdateConfig.setCustomBackgroundFilter(filter);
    }

    if (!Config.customTheme) UpdateConfig.setCustomTheme(true);
  } catch (e) {
    Notifications.add("Something went wrong. Reverting to previous state.", 0);
    console.error(e);
    UpdateConfig.setCustomTheme(oldCustomTheme);
    UpdateConfig.setCustomThemeColors(oldCustomThemeColors);
  }
}

type SharedTestSettings = [
  SharedTypes.Config.Mode | null,
  SharedTypes.Config.Mode2<SharedTypes.Config.Mode> | null,
  SharedTypes.CustomTextData | null,
  boolean | null,
  boolean | null,
  string | null,
  SharedTypes.Config.Difficulty | null,
  string | null
];

export function loadTestSettingsFromUrl(getOverride?: string): void {
  const getValue = Misc.findGetParameter("testSettings", getOverride);
  if (getValue === null) return;

  const de: SharedTestSettings = JSON.parse(decompressFromURI(getValue) ?? "");

  const applied: Record<string, string> = {};

  if (de[0] !== null) {
    UpdateConfig.setMode(de[0], true);
    applied["mode"] = de[0];
  }

  if (de[1] !== null) {
    if (Config.mode === "time") {
      UpdateConfig.setTimeConfig(parseInt(de[1], 10), true);
    } else if (Config.mode === "words") {
      UpdateConfig.setWordCount(parseInt(de[1], 10), true);
    } else if (Config.mode === "quote") {
      UpdateConfig.setQuoteLength(-2, false);
      TestState.setSelectedQuoteId(parseInt(de[1], 10));
      ManualRestart.set();
    }
    applied["mode2"] = de[1];
  }

  if (de[2] !== null) {
    const customTextSettings = de[2];
    CustomText.setText(customTextSettings.text);
    CustomText.setLimitMode(customTextSettings.limit.mode);
    CustomText.setLimitValue(customTextSettings.limit.value);
    CustomText.setPipeDelimiter(customTextSettings.pipeDelimiter);

    applied["custom text settings"] = "";
  }

  if (de[3] !== null) {
    UpdateConfig.setPunctuation(de[3], true);
    applied["punctuation"] = de[3] ? "on" : "off";
  }

  if (de[4] !== null) {
    UpdateConfig.setNumbers(de[4], true);
    applied["numbers"] = de[4] ? "on" : "off";
  }

  if (de[5] !== null) {
    UpdateConfig.setLanguage(de[5], true);
    applied["language"] = de[5];
  }

  if (de[6] !== null) {
    UpdateConfig.setDifficulty(de[6], true);
    applied["difficulty"] = de[6];
  }

  if (de[7] !== null) {
    UpdateConfig.setFunbox(de[7], true);
    applied["funbox"] = de[7];
  }

  restartTest({
    nosave: true,
  });

  let appliedString = "";

  Object.keys(applied).forEach((setKey) => {
    const set = applied[setKey];
    if (set !== undefined) {
      appliedString += `${setKey}${Misc.escapeHTML(set ? ": " + set : "")}<br>`;
    }
  });

  if (appliedString !== "") {
    Notifications.add("Settings applied from URL:<br><br>" + appliedString, 1, {
      duration: 10,
      allowHTML: true,
    });
  }
}

export function loadChallengeFromUrl(getOverride?: string): void {
  const getValue = (
    Misc.findGetParameter("challenge", getOverride) ?? ""
  ).toLowerCase();
  if (getValue === "") return;

  Notifications.add("Loading challenge", 0);
  ChallengeController.setup(getValue)
    .then((result) => {
      if (result === true) {
        Notifications.add("Challenge loaded", 1);
        restartTest({
          nosave: true,
        });
      }
    })
    .catch((e) => {
      Notifications.add("Failed to load challenge", -1);
      console.error(e);
    });
}
