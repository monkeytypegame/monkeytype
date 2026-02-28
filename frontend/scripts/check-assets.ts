/**
 * Example usage in root or frontend:
 * pnpm check-assets (npm run check-assets)
 * pnpm vaildate-json quotes others(npm run vaildate-json quotes others)
 * pnpm check-assets challenges fonts -p (npm run check-assets challenges fonts -- -p)
 */

import * as fs from "fs";
import { LanguageGroups, LanguageList } from "../src/ts/constants/languages";
import {
  Language,
  LanguageObject,
  LanguageObjectSchema,
  LanguageSchema,
} from "@monkeytype/schemas/languages";
import { Layout, ThemeName } from "@monkeytype/schemas/configs";
import { LayoutsList } from "../src/ts/constants/layouts";
import { KnownFontName } from "@monkeytype/schemas/fonts";
import { Fonts } from "../src/ts/constants/fonts";
import { themes, ThemeSchema, ThemesList } from "../src/ts/constants/themes";
import { z } from "zod";
import { ChallengeSchema, Challenge } from "@monkeytype/schemas/challenges";
import { LayoutObject, LayoutObjectSchema } from "@monkeytype/schemas/layouts";
import { QuoteDataSchema, QuoteData } from "@monkeytype/schemas/quotes";

class Problems<K extends string, T extends string> {
  private type: string;
  private labels: Record<T, string>;
  private problems: Partial<Record<K | T, string[]>> = {};

  constructor(type: string, labels: Record<T, string>) {
    this.type = type;
    this.labels = labels;
  }

  public add(key: K | T, problem: string): void {
    this.problems[key] = [...(this.problems[key] ?? []), problem];
  }

  public addValidation(
    key: K | T,
    validationResult: z.SafeParseReturnType<unknown, unknown>,
  ): void {
    if (validationResult.success) return;
    validationResult.error.errors.forEach((e) =>
      this.add(key, `${e.path.join(".")}: ${e.message}`),
    );
  }

  public hasError(): boolean {
    return Object.keys(this.problems).length !== 0;
  }
  public toString(): string {
    if (!this.hasError()) {
      return `${this.type} are all \u001b[32mvalid\u001b[0m`;
    }

    return (
      `${this.type} are \u001b[31minvalid\u001b[0m\n` +
      Object.entries(this.problems)
        .map(([key, problems]) => {
          let label: string = this.labels[key as T] ?? `${key}`;

          return `${label}:\n ${(problems as string[])
            .map((error) => "\t- " + error)
            .join("\n")}`;
        })
        .join("\n")
    );
  }
}

function findDuplicates<T>(items: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();

  for (const item of items) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }

  return Array.from(duplicates);
}

async function validateChallenges(): Promise<void> {
  const problems = new Problems<"_list.json", never>("Challenges", {});

  const challengesData = JSON.parse(
    fs.readFileSync("./static/challenges/_list.json", {
      encoding: "utf8",
      flag: "r",
    }),
  ) as Challenge;
  const validationResult = z.array(ChallengeSchema).safeParse(challengesData);
  problems.addValidation("_list.json", validationResult);

  console.log(problems.toString());
  if (problems.hasError()) {
    throw new Error("challenges with errors");
  }
}

async function validateLayouts(): Promise<void> {
  const problems = new Problems<Layout, "_additional">("Layouts", {
    _additional:
      "Layout files present but missing in packages/schemas/src/layouts.ts",
  });

  for (let layoutName of LayoutsList) {
    let layoutData = undefined;
    if (!fs.existsSync(`./static/layouts/${layoutName}.json`)) {
      problems.add(
        layoutName,
        `missing json file frontend/static/layouts/${layoutName}.json`,
      );
      continue;
    }
    try {
      layoutData = JSON.parse(
        fs.readFileSync(`./static/layouts/${layoutName}.json`, "utf-8"),
      ) as LayoutObject;
    } catch (e) {
      problems.add(
        layoutName,
        `Unable to parse ${e instanceof Error ? e.message : e}`,
      );
      continue;
    }

    const validationResult = LayoutObjectSchema.safeParse(layoutData);
    problems.addValidation(layoutName, validationResult);
  }

  //no files not defined in LayoutsList
  const additionalLayoutFiles = fs
    .readdirSync("./static/layouts")
    .filter((it) => !LayoutsList.some((layout) => layout + ".json" === it));
  if (additionalLayoutFiles.length !== 0) {
    additionalLayoutFiles.forEach((it) => problems.add("_additional", it));
  }

  console.log(problems.toString());

  if (problems.hasError()) {
    throw new Error("layouts with errors");
  }
}

async function validateQuotes(): Promise<void> {
  const problems = new Problems<string, never>("Quotes", {});

  const quotesFiles = fs.readdirSync("./static/quotes/");
  for (let quotefilename of quotesFiles) {
    quotefilename = quotefilename.split(".")[0] as string;
    let quoteData;

    try {
      quoteData = JSON.parse(
        fs.readFileSync(`./static/quotes/${quotefilename}.json`, {
          encoding: "utf8",
          flag: "r",
        }),
      ) as QuoteData;
    } catch (e) {
      problems.add(
        quotefilename,
        `Unable to parse ${e instanceof Error ? e.message : e}`,
      );
      continue;
    }

    //check filename matching language
    if (quoteData.language !== quotefilename) {
      problems.add(
        quotefilename,
        `Name not matching language ${quoteData.language}`,
      );
    }

    //check schema
    const schema = QuoteDataSchema.extend({
      language: LanguageSchema
        //icelandic only exists as icelandic_1k, language in quote file is stripped of its size
        .or(z.literal("icelandic")),
    });
    problems.addValidation(quotefilename, schema.safeParse(quoteData));

    //check for duplicate ids
    const duplicates = findDuplicates(quoteData.quotes.map((it) => it.id));
    if (duplicates.length !== 0) {
      problems.add(
        quotefilename,
        `contains ${duplicates.length} duplicates:\n ${duplicates.join(",")}`,
      );
    }

    //check quote length
    quoteData.quotes.forEach((quote) => {
      if (quote.text.length !== quote.length) {
        problems.add(
          quotefilename,
          `ID ${quote.id}: expected length ${quote.text.length}`,
        );
      }

      if (quote.text.length < 60) {
        problems.add(
          quotefilename,
          `ID ${quote.id}: length too short (under 60 characters)`,
        );
      }
    });

    //check groups
    let last = -1;
    for (const group of quoteData.groups) {
      if (group[0] !== last + 1) {
        problems.add(
          quotefilename,
          `error in  group ${group}: expect to start at ${last + 1}`,
        );
      } else if (group[0] >= group[1]) {
        problems.add(
          quotefilename,
          `error in  group ${group}: second number to be greater than first number`,
        );
      }
      last = group[1];
    }
  }

  console.log(problems.toString());

  if (problems.hasError()) {
    throw new Error("quotes with errors");
  }
}

async function validateLanguages(): Promise<void> {
  const problems = new Problems<Language, "_additional" | "_groups">(
    "Languages",
    {
      _additional:
        "Language files present but missing in packages/schemas/src/languages.ts",
      _groups:
        "Problems in LanguageGroups in frontend/src/ts/constants/languages.ts",
    },
  );

  const duplicatePercentageThreshold = 0.0001;
  for (const language of LanguageList) {
    let languageFileData: LanguageObject;
    try {
      languageFileData = JSON.parse(
        fs.readFileSync(`./static/languages/${language}.json`, {
          encoding: "utf8",
          flag: "r",
        }),
      ) as LanguageObject;
    } catch (e) {
      problems.add(
        language,
        `missing json file frontend/static/languages/${language}.json`,
      );

      continue;
    }
    problems.addValidation(
      language,
      LanguageObjectSchema.extend({
        _comment: z.string().optional(),
      }).safeParse(languageFileData),
    );

    if (languageFileData.name !== language) {
      problems.add(language, "Name is not " + language);
    }
    const duplicates = findDuplicates(languageFileData.words);
    const duplicatePercentage =
      (duplicates.length / languageFileData.words.length) * 100;
    if (duplicatePercentage >= duplicatePercentageThreshold) {
      problems.add(
        language,
        `contains ${duplicates.length} (${Math.round(
          duplicatePercentage,
        )}%) duplicates:\n ${duplicates.join(",")}`,
      );
    }
  }

  //no files not defined in LanguageList
  fs.readdirSync("./static/languages")
    .filter((it) => !LanguageList.some((language) => language + ".json" === it))
    .forEach((it) => problems.add("_additional", it));

  //check groups
  const languagesWithMultipleGroups = [];
  const groupByLanguage = new Map<Language, string>();

  for (const group of Object.keys(LanguageGroups)) {
    for (const language of LanguageGroups[group] as Language[]) {
      if (groupByLanguage.has(language)) {
        languagesWithMultipleGroups.push(language);
      }
      groupByLanguage.set(language, group);
    }
  }
  if (languagesWithMultipleGroups.length !== 0) {
    problems.add(
      "_groups",
      `languages with multiple groups: ${languagesWithMultipleGroups.join(
        ", ",
      )}`,
    );
  }

  const languagesMissingGroup = LanguageList.filter(
    (lang) => !groupByLanguage.has(lang),
  );
  if (languagesMissingGroup.length !== 0) {
    problems.add(
      "_groups",
      `languages missing group: ${languagesMissingGroup.join(", ")}`,
    );
  }

  console.log(problems.toString());

  if (problems.hasError()) {
    throw new Error("languages with errors");
  }
}

async function validateFonts(): Promise<void> {
  const problems = new Problems<KnownFontName, "_additional">("Fonts", {
    _additional:
      "Font files present but missing in frontend/src/ts/constants/fonts.ts",
  });

  //no missing files
  const ignoredFonts = new Set([
    "GallaudetRegular.woff2", //used for asl
    "Vazirmatn-Regular.woff2", //default font
  ]);

  const fontFiles = fs
    .readdirSync("./static/webfonts")
    .filter((it) => !ignoredFonts.has(it));

  //missing font files
  Object.entries(Fonts)
    .filter(([_name, config]) => !config.systemFont)
    .filter(([_name, config]) => !fontFiles.includes(config.fileName as string))
    .forEach(([name, config]) =>
      problems.add(
        name as KnownFontName,
        `missing file frontend/static/webfonts/${config.fileName}`,
      ),
    );

  //additional font files
  const expectedFontFiles = new Set(
    Object.entries(Fonts)
      .filter(([_name, config]) => !config.systemFont)
      .map(([_name, config]) => config.fileName as string),
  );

  fontFiles
    .filter((name) => !expectedFontFiles.has(name))
    .forEach((file) => problems.add("_additional", file));

  console.log(problems.toString());

  if (problems.hasError()) {
    throw new Error("layouts with errors");
  }
}

async function validateThemes(): Promise<void> {
  const problems = new Problems<ThemeName, "_additional">("Themes", {
    _additional:
      "Theme files present but missing in frontend/src/ts/constants/themes.ts",
  });

  //no missing files
  const themeFiles = fs.readdirSync("./static/themes");

  //missing or additional theme files (mismatch in hasCss)
  ThemesList.filter(
    (it) => themeFiles.includes(it.name + ".css") !== (it.hasCss ?? false),
  ).forEach((it) =>
    problems.add(
      it.name,
      `${it.hasCss ? "missing" : "additional"} file frontend/static/themes/${it.name}.css`,
    ),
  );

  //additional theme files
  themeFiles
    .filter((it) => !ThemesList.some((theme) => theme.name + ".css" === it))
    .forEach((it) => problems.add("_additional", it));

  //validate theme colors are valid hex colors, not covered by typescipt
  const themeNameSchema = z.string().regex(/^[a-z0-9_]+$/, {
    message:
      "theme name can only contain lowercase letters, digits and underscore",
  });
  for (const name of Object.keys(themes)) {
    const theme = themes[name as ThemeName];
    problems.addValidation(name as ThemeName, ThemeSchema.safeParse(theme));
    problems.addValidation(name as ThemeName, themeNameSchema.safeParse(name));
  }

  console.log(problems.toString());

  if (problems.hasError()) {
    throw new Error("themes with errors");
  }
}

type Validator = () => Promise<void>;

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const flags = new Set(args.filter((arg) => arg.startsWith("-")));
  const keys = args.filter((arg) => !arg.startsWith("-"));

  const validators: Record<string, Validator[]> = {
    quotes: [validateQuotes],
    languages: [validateLanguages],
    layouts: [validateLayouts],
    challenges: [validateChallenges],
    fonts: [validateFonts],
    themes: [validateThemes],
    others: [
      validateChallenges,
      validateLayouts,
      validateFonts,
      validateThemes,
    ],
  };

  // flags
  const validateAll = keys.length < 1 || flags.has("--all") || flags.has("-a");
  const passWithNoValidators =
    flags.has("--pass-with-no-validators") || flags.has("-p");

  const tasks: Set<Validator> = new Set(
    validateAll ? Object.values(validators).flat() : [],
  );
  for (const key of keys) {
    if (!Object.keys(validators).includes(key)) {
      console.error(`There is no validator for key '${key}'.`);
      if (!passWithNoValidators) process.exit(1);
    } else if (!validateAll) {
      validators[key]?.forEach((validator) => tasks.add(validator));
    }
  }

  if (tasks.size > 0) {
    await Promise.all([...tasks].map(async (validator) => validator()));
    return;
  }
}
void main();
