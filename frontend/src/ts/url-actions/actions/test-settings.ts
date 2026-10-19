// Shared test settings links (?testSettings=): built by the share test
// settings modal, a url action (../action.ts)

import {
  Difficulty,
  FunboxName,
  FunboxSchema,
} from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";
import {
  CustomTextSettings,
  CustomTextSettingsSchema,
} from "@monkeytype/schemas/results";
import {
  DifficultySchema,
  Mode,
  Mode2,
  Mode2Schema,
  ModeSchema,
} from "@monkeytype/schemas/shared";
import { z } from "zod";

import { setConfig } from "../../config/setters";
import { Config } from "../../config/store";
import { showSuccessNotification } from "../../states/notifications";
import { setSelectedQuoteId } from "../../states/test";
import * as CustomText from "../../test/custom-text";
import { restart as restartTest } from "../../test/test-logic";
import * as Misc from "../../utils/misc";
import { defineSearchAction, urlActionLink } from "../action";

/** The settings a link shares: one left out keeps the user's. */
export type SharedTestSettings = {
  mode?: Mode;
  mode2?: Mode2<Mode>;
  customText?: SharedCustomText;
  punctuation?: boolean;
  numbers?: boolean;
  language?: string;
  difficulty?: Difficulty;
  funbox?: FunboxName[];
};

/** Old links can leave out the limit's mode or value, and the delimiter. */
type SharedCustomText = Pick<CustomTextSettings, "text" | "mode"> & {
  limit: Partial<CustomTextSettings["limit"]>;
  pipeDelimiter?: boolean;
};

// the link's format: a tuple, null for a setting left out
const TestSettingsSchema = z.tuple([
  ModeSchema.nullable(),
  Mode2Schema.nullable(),
  CustomTextSettingsSchema.partial({
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

export const testSettingsAction = defineSearchAction({
  in: "search",
  param: "testSettings",
  encoding: "lz",
  failure: "Failed to load test settings from URL",
  schema: TestSettingsSchema.transform(toSharedTestSettings),
  apply: applyTestSettings,
});

type LinkCustomText = NonNullable<z.infer<typeof TestSettingsSchema>[2]>;

/** The link sharing `settings`. */
export function testSettingsLink(
  // a link shares the whole custom text, old links can lack parts of it
  settings: Omit<SharedTestSettings, "customText"> & {
    customText?: CustomTextSettings;
  },
): string {
  return urlActionLink(testSettingsAction, [
    settings.mode ?? null,
    settings.mode2 ?? null,
    settings.customText ?? null,
    settings.punctuation ?? null,
    settings.numbers ?? null,
    settings.language ?? null,
    settings.difficulty ?? null,
    settings.funbox ?? null,
  ]);
}

// if the encoding structure or method ever changes, make sure to support the old data format
// otherwise eiko will be sad
function toSharedTestSettings([
  mode,
  mode2,
  customText,
  punctuation,
  numbers,
  language,
  difficulty,
  funbox,
]: z.infer<typeof TestSettingsSchema>): SharedTestSettings {
  return {
    mode: mode ?? undefined,
    mode2: mode2 ?? undefined,
    customText:
      customText === null ? undefined : toSharedCustomText(customText),
    punctuation: punctuation ?? undefined,
    numbers: numbers ?? undefined,
    language: language ?? undefined,
    difficulty: difficulty ?? undefined,
    //convert legacy values
    funbox:
      typeof funbox === "string"
        ? (funbox.split("#") as FunboxName[])
        : (funbox ?? undefined),
  };
}

function toSharedCustomText(customText: LinkCustomText): SharedCustomText {
  return {
    text: customText.text,
    mode: customText.mode ?? "repeat",
    //convert legacy values
    limit: customText.limit ?? {
      mode: customText.isWordRandom
        ? "word"
        : customText.isTimeRandom
          ? "time"
          : undefined,
      value: customText.word ?? customText.time,
    },
    pipeDelimiter:
      customText.pipeDelimiter ??
      (customText.delimiter === "|" ? true : undefined),
  };
}

async function applyTestSettings(settings: SharedTestSettings): Promise<void> {
  const applied: Record<string, string> = {};

  if (settings.mode !== undefined) {
    setConfig("mode", settings.mode, {
      nosave: true,
    });
    applied["mode"] = settings.mode;
  }

  const mode = settings.mode ?? Config.mode;
  if (settings.mode2 !== undefined) {
    if (mode === "time") {
      setConfig("time", parseInt(settings.mode2, 10), {
        nosave: true,
      });
    } else if (mode === "words") {
      setConfig("words", parseInt(settings.mode2, 10), {
        nosave: true,
      });
    } else if (mode === "quote") {
      setConfig("quoteLength", [-2]);
      setSelectedQuoteId(parseInt(settings.mode2, 10));
    }
    applied["mode2"] = settings.mode2;
  }

  if (settings.customText !== undefined) {
    const { text, limit, pipeDelimiter } = settings.customText;
    CustomText.setText(text);

    //make sure to set mode before the limit as mode also sets the limit
    CustomText.setMode(settings.customText.mode);

    if (limit.mode !== undefined) CustomText.setLimitMode(limit.mode);
    if (limit.value !== undefined) CustomText.setLimitValue(limit.value);

    if (pipeDelimiter) CustomText.setPipeDelimiter(true);

    applied["custom text settings"] = "";
  }

  if (settings.punctuation !== undefined) {
    setConfig("punctuation", settings.punctuation, {
      nosave: true,
    });
    applied["punctuation"] = settings.punctuation ? "on" : "off";
  }

  if (settings.numbers !== undefined) {
    setConfig("numbers", settings.numbers, {
      nosave: true,
    });
    applied["numbers"] = settings.numbers ? "on" : "off";
  }

  if (settings.language !== undefined) {
    setConfig("language", settings.language as Language, {
      nosave: true,
    });
    applied["language"] = settings.language;
  }

  if (settings.difficulty !== undefined) {
    setConfig("difficulty", settings.difficulty, {
      nosave: true,
    });
    applied["difficulty"] = settings.difficulty;
  }

  if (settings.funbox !== undefined) {
    setConfig("funbox", settings.funbox, {
      nosave: true,
    });
    applied["funbox"] = settings.funbox.join(", ");
  }

  const appliedEntries = Object.entries(applied);
  if (appliedEntries.length > 0) {
    const lines = appliedEntries
      .map(
        ([key, val]) =>
          Misc.escapeHTML(key) + (val ? ": " + Misc.escapeHTML(val) : ""),
      )
      .join("<br />");
    showSuccessNotification(`Settings applied from URL:<br /><br />${lines}`, {
      durationMs: 10000,
      useInnerHtml: true,
    });
  }

  await restartTest({
    nosave: true,
  });
}
