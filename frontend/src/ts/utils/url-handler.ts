import * as Misc from "./misc";
import Config, * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import { decompressFromURI } from "lz-ts";
import * as TestState from "../test/test-state";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as CustomText from "../test/custom-text";
import Ape from "../ape";
import * as DB from "../db";
import * as Loader from "../elements/loader";
import * as AccountButton from "../elements/account-button";
import { restart as restartTest } from "../test/test-logic";
import * as ChallengeController from "../controllers/challenge-controller";
import {
  DifficultySchema,
  Mode2Schema,
  ModeSchema,
} from "@monkeytype/contracts/schemas/shared";
import {
  CustomBackgroundFilter,
  CustomBackgroundFilterSchema,
  CustomBackgroundSize,
  CustomBackgroundSizeSchema,
  CustomThemeColors,
  CustomThemeColorsSchema,
  FunboxSchema,
  FunboxName,
} from "@monkeytype/contracts/schemas/configs";
import { z } from "zod";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { tryCatchSync } from "@monkeytype/util/trycatch";
import { Language } from "@monkeytype/contracts/schemas/languages";

export async function linkDiscord(hashOverride: string): Promise<void> {
  if (!hashOverride) return;
  const fragment = new URLSearchParams(hashOverride.slice(1));
  if (fragment.has("access_token")) {
    history.replaceState(null, "", "/");
    const accessToken = fragment.get("access_token") as string;
    const tokenType = fragment.get("token_type") as string;
    const state = fragment.get("state") as string;

    Loader.show();
    const response = await Ape.users.linkDiscord({
      body: { tokenType, accessToken, state },
    });
    Loader.hide();

    if (response.status !== 200) {
      Notifications.add("Failed to link Discord: " + response.body.message, -1);
      return;
    }

    if (response.body.data === null) {
      Notifications.add("Failed to link Discord: data returned was null", -1);
      return;
    }

    Notifications.add(response.body.message, 1);

    const snapshot = DB.getSnapshot();
    if (!snapshot) return;

    const { discordId, discordAvatar } = response.body.data;
    if (discordId !== undefined) {
      snapshot.discordId = discordId;
    } else {
      snapshot.discordAvatar = discordAvatar;
    }

    DB.setSnapshot(snapshot);
    AccountButton.updateAvatar(discordId, discordAvatar);
  }
}

const customThemeUrlDataSchema = z.object({
  c: CustomThemeColorsSchema,
  i: z.string().optional(),
  s: CustomBackgroundSizeSchema.optional(),
  f: CustomBackgroundFilterSchema.optional(),
});

export function loadCustomThemeFromUrl(getOverride?: string): void {
  const getValue = Misc.findGetParameter("customTheme", getOverride);
  if (getValue === null) return;

  const { data: decoded, error } = tryCatchSync(() =>
    parseJsonWithSchema(atob(getValue), customThemeUrlDataSchema)
  );
  if (error) {
    console.log("Custom theme URL decoding failed", error);
    Notifications.add("Failed to load theme from URL: " + error.message, 0);
    return;
  }

  let colorArray: CustomThemeColors | undefined;
  let image: string | undefined;
  let size: CustomBackgroundSize | undefined;
  let filter: CustomBackgroundFilter | undefined;
  if (Array.isArray(decoded.c) && decoded.c.length === 10) {
    colorArray = decoded.c;
    image = decoded.i;
    size = decoded.s;
    filter = decoded.f;
  } else if (Array.isArray(decoded) && decoded.length === 10) {
    // This is for backward compatibility with old format
    colorArray = decoded as unknown as CustomThemeColors;
  }

  if (colorArray === undefined || colorArray.length !== 10) {
    Notifications.add("Failed to load theme from URL: no colors found", 0);
    return;
  }

  const oldCustomTheme = Config.customTheme;
  const oldCustomThemeColors = Config.customThemeColors;
  try {
    UpdateConfig.setCustomThemeColors(colorArray);
    Notifications.add("Custom theme applied", 1);

    if (image !== undefined && size !== undefined && filter !== undefined) {
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

const TestSettingsSchema = z.tuple([
  ModeSchema.nullable(),
  Mode2Schema.nullable(),
  CustomText.CustomTextSettingsSchema.partial({
    pipeDelimiter: true,
    limit: true,
    mode: true,
  })
    //legacy values
    .extend({
      isTimeRandom: z.boolean().optional(),
      isWordRandom: z.boolean().optional(),
      word: z.number().int().optional(),
      time: z.number().int().optional(),
      delimiter: z.string().optional(),
    })
    .nullable(),
  z.boolean().nullable(), //punctuation
  z.boolean().nullable(), //numbers
  z.string().nullable(), //language
  DifficultySchema.nullable(),
  FunboxSchema.or(z.string().nullable()), //funbox as array or legacy string as hash separated values
]);

export function loadTestSettingsFromUrl(getOverride?: string): void {
  const getValue = Misc.findGetParameter("testSettings", getOverride);
  if (getValue === null) return;

  const { data: de, error } = tryCatchSync(() =>
    parseJsonWithSchema(decompressFromURI(getValue) ?? "", TestSettingsSchema)
  );
  if (error) {
    console.error("Failed to parse test settings:", error);
    Notifications.add(
      "Failed to load test settings from URL: " + error.message,
      0
    );
    return;
  }

  const applied: Record<string, string> = {};

  if (de[0] !== null) {
    UpdateConfig.setMode(de[0], true);
    applied["mode"] = de[0];
  }

  const mode = de[0] ?? Config.mode;
  if (de[1] !== null) {
    if (mode === "time") {
      UpdateConfig.setTimeConfig(parseInt(de[1], 10), true);
    } else if (mode === "words") {
      UpdateConfig.setWordCount(parseInt(de[1], 10), true);
    } else if (mode === "quote") {
      UpdateConfig.setQuoteLength(-2, false);
      TestState.setSelectedQuoteId(parseInt(de[1], 10));
      ManualRestart.set();
    }
    applied["mode2"] = de[1];
  }

  if (de[2] !== null) {
    const customTextSettings = de[2];
    CustomText.setText(customTextSettings.text);

    if (customTextSettings.limit !== undefined) {
      CustomText.setLimitMode(customTextSettings.limit.mode);
      CustomText.setLimitValue(customTextSettings.limit.value);
    }
    //convert legacy values
    else {
      if (customTextSettings.isWordRandom) {
        CustomText.setLimitMode("word");
      } else if (customTextSettings.isTimeRandom) {
        CustomText.setLimitMode("time");
      }
      if (customTextSettings.word !== undefined) {
        CustomText.setLimitValue(customTextSettings.word);
      } else if (customTextSettings.time !== undefined) {
        CustomText.setLimitValue(customTextSettings.time);
      }
    }

    if (customTextSettings.pipeDelimiter) {
      CustomText.setPipeDelimiter(customTextSettings.pipeDelimiter);
    }
    //convert legacy values
    else if (customTextSettings.delimiter === "|") {
      CustomText.setPipeDelimiter(true);
    }

    CustomText.setMode(customTextSettings.mode ?? "repeat");

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
    UpdateConfig.setLanguage(de[5] as Language, true);
    applied["language"] = de[5];
  }

  if (de[6] !== null) {
    UpdateConfig.setDifficulty(de[6], true);
    applied["difficulty"] = de[6];
  }

  if (de[7] !== null) {
    let val: FunboxName[] = [];
    //convert legacy values
    if (typeof de[7] === "string") {
      val = de[7].split("#") as FunboxName[];
    } else {
      val = de[7];
    }
    UpdateConfig.setFunbox(val, true);
    applied["funbox"] = val.join(", ");
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
      if (result) {
        Notifications.add("Challenge loaded", 1);
        restartTest({
          nosave: true,
        });
      }
    })
    .catch((e: unknown) => {
      Notifications.add("Failed to load challenge", -1);
      console.error(e);
    });
}
