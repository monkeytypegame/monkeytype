/**
 * Example usage in root or frontend:
 * pnpm validate-json (npm run validate-json)
 * pnpm vaildate-json quotes others(npm run vaildate-json quotes others)
 * pnpm validate-json challenges fonts -p (npm run validate-json challenges fonts -- -p)
 */

import * as fs from "fs";
import Ajv from "ajv";
import { LanguageGroups, LanguageList } from "../src/ts/constants/languages";
import { Language } from "@monkeytype/schemas/languages";
import { Layout, ThemeName } from "@monkeytype/schemas/configs";
import { LayoutsList } from "../src/ts/constants/layouts";
import { KnownFontName } from "@monkeytype/schemas/fonts";
import { Fonts } from "../src/ts/constants/fonts";
import { ThemesList } from "../src/ts/constants/themes";

const ajv = new Ajv();

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

function findDuplicates(words: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const word of words) {
    if (seen.has(word)) {
      duplicates.add(word);
    } else {
      seen.add(word);
    }
  }

  return Array.from(duplicates);
}

async function validateChallenges(): Promise<void> {
  const challengesSchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        display: { type: "string" },
        autoRole: { type: "boolean" },
        type: { type: "string" },
        message: { type: "string" },
        parameters: {
          type: "array",
        },
        requirements: {
          type: "object",
          properties: {
            wpm: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                exact: { type: "number" },
              },
            },
            time: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                exact: { type: "number" },
              },
            },
            acc: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                exact: { type: "number" },
              },
            },
            raw: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                exact: { type: "number" },
              },
            },
            con: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                exact: { type: "number" },
              },
            },
            config: {
              type: "object",
            },
            funbox: {
              type: "object",
              properties: {
                exact: { type: "array" },
              },
            },
          },
        },
      },
      required: ["name", "display", "type", "parameters"],
    },
  };
  const challengesData = JSON.parse(
    fs.readFileSync("./static/challenges/_list.json", {
      encoding: "utf8",
      flag: "r",
    })
  ) as object;
  const challengesValidator = ajv.compile(challengesSchema);
  if (challengesValidator(challengesData)) {
    console.log("Challenges list JSON schema is \u001b[32mvalid\u001b[0m");
  } else {
    console.log("Challenges list JSON schema is \u001b[31minvalid\u001b[0m");
    throw new Error(challengesValidator?.errors?.[0]?.message);
  }
}

async function validateLayouts(): Promise<void> {
  const problems = new Problems<Layout, "_additional">("Layouts", {
    _additional:
      "Additional layout files not declared in frontend/src/ts/constants/layouts.ts",
  });

  const charDefinitionSchema = {
    type: "array",
    minItems: 1,
    maxItems: 4,
    items: { type: "string", minLength: 1, maxLength: 1 },
  };
  const charDefinitionSchemaRow5 = {
    type: "array",
    minItems: 1,
    maxItems: 2,
    items: { type: "string", minLength: 1, maxLength: 1 },
  };

  const layoutsSchema = {
    ansi: {
      type: "object",
      properties: {
        keymapShowTopRow: { type: "boolean" },
        type: { type: "string", pattern: "^ansi$" },
        keys: {
          type: "object",
          properties: {
            row1: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 13,
              maxItems: 13,
            },
            row2: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 13,
              maxItems: 13,
            },
            row3: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 11,
              maxItems: 11,
            },
            row4: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 10,
              maxItems: 10,
            },
            row5: {
              type: "array",
              items: charDefinitionSchemaRow5,
              minItems: 1,
              maxItems: 2,
            },
          },
          required: ["row1", "row2", "row3", "row4", "row5"],
        },
      },
      required: ["keymapShowTopRow", "type", "keys"],
    },
    iso: {
      type: "object",
      properties: {
        keymapShowTopRow: { type: "boolean" },
        type: { type: "string", pattern: "^iso$" },
        keys: {
          type: "object",
          properties: {
            row1: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 13,
              maxItems: 13,
            },
            row2: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 12,
              maxItems: 12,
            },
            row3: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 12,
              maxItems: 12,
            },
            row4: {
              type: "array",
              items: charDefinitionSchema,
              minItems: 11,
              maxItems: 11,
            },
            row5: {
              type: "array",
              items: charDefinitionSchemaRow5,
              minItems: 1,
              maxItems: 2,
            },
          },
          required: ["row1", "row2", "row3", "row4", "row5"],
        },
      },
      required: ["keymapShowTopRow", "type", "keys"],
    },
  };

  for (let layoutName of LayoutsList) {
    let layoutData = undefined;
    if (!fs.existsSync(`./static/layouts/${layoutName}.json`)) {
      problems.add(
        layoutName,
        `missing json file frontend/static/layouts/${layoutName}.json`
      );
      continue;
    }
    try {
      layoutData = JSON.parse(
        fs.readFileSync(`./static/layouts/${layoutName}.json`, "utf-8")
      ) as object & { type: "ansi" | "iso" };
    } catch (e) {
      problems.add(
        layoutName,
        `Unable to parse ${e instanceof Error ? e.message : e}`
      );
      continue;
    }

    if (layoutsSchema[layoutData.type] === undefined) {
      problems.add(layoutName, `invalid type: ${layoutData.type}`);
    } else {
      const layoutsValidator = ajv.compile(layoutsSchema[layoutData.type]);
      if (!layoutsValidator(layoutData)) {
        problems.add(
          layoutName,
          layoutsValidator.errors?.[0]?.message ?? "unknown"
        );
      }
    }
  }

  //no files not defined in LayoutsList
  const additionalLayoutFiles = fs
    .readdirSync("./static/layouts")
    .map((it) => it.substring(0, it.length - 5))
    .filter((it) => !LayoutsList.some((layout) => layout === it))
    .map((it) => `frontend/static/layouts/${it}.json`);
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

  //quotes
  const quoteSchema = {
    type: "object",
    properties: {
      language: { type: "string" },
      groups: {
        type: "array",
        items: {
          type: "array",
          items: {
            type: "number",
          },
          minItems: 2,
          maxItems: 2,
        },
      },
      quotes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            source: { type: "string" },
            length: { type: "number" },
            id: { type: "number" },
          },
          required: ["text", "source", "length", "id"],
        },
      },
    },
    required: ["language", "groups", "quotes"],
  };
  const quoteIdsSchema = {
    type: "array",
    items: {
      type: "number",
    },
    uniqueItems: true,
  };

  const quotesFiles = fs.readdirSync("./static/quotes/");
  for (let quotefilename of quotesFiles) {
    quotefilename = quotefilename.split(".")[0] as string;
    let quoteData;

    try {
      quoteData = JSON.parse(
        fs.readFileSync(`./static/quotes/${quotefilename}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      ) as object & {
        language: string;
        quotes: { id: number; text: string; length: number }[];
      };
    } catch (e) {
      problems.add(
        quotefilename,
        `Unable to parse ${e instanceof Error ? e.message : e}`
      );
      continue;
    }
    if (quoteData.language !== quotefilename) {
      problems.add(
        quotefilename,
        `Name not matching language ${quoteData.language}`
      );
    }
    const quoteValidator = ajv.compile(quoteSchema);
    if (!quoteValidator(quoteData)) {
      problems.add(
        quotefilename,
        quoteValidator.errors?.[0]?.message ?? "unknown"
      );
      continue;
    }
    const quoteIds = quoteData.quotes.map((quote) => quote.id);
    const quoteIdsValidator = ajv.compile(quoteIdsSchema);
    if (!quoteIdsValidator(quoteIds)) {
      problems.add(
        quotefilename,
        `IDs not unique: ${quoteIdsValidator.errors?.[0]?.message}`
      );
    }

    quoteData.quotes
      .filter((quote) => quote.text.length !== quote.length)
      .forEach((quote) =>
        problems.add(
          quotefilename,
          `ID ${quote.id}: expected length ${quote.text.length}`
        )
      );
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
        "Additional language files not declared in frontend/src/ts/constants/languages.ts",
      _groups:
        "Problems in LanguageGroups on frontend/src/ts/constants/languages.ts",
    }
  );

  //language files
  const languageFileSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      rightToLeft: { type: "boolean" },
      noLazyMode: { type: "boolean" },
      bcp47: { type: "string" },
      words: {
        type: "array",
        items: { type: "string", minLength: 1 },
      },
      additionalAccents: {
        type: "array",
        items: {
          type: "array",
          items: { type: "string", minLength: 1 },
          minItems: 2,
          maxItems: 2,
        },
      },
    },
    required: ["name", "words"],
  };

  const duplicatePercentageThreshold = 0.0001;
  for (const language of LanguageList) {
    let languageFileData;
    try {
      languageFileData = JSON.parse(
        fs.readFileSync(`./static/languages/${language}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      ) as object & { name: string; words: string[] };
    } catch (e) {
      problems.add(
        language,
        `missing json file frontend/static/languages/${language}.json`
      );

      continue;
    }
    const languageFileValidator = ajv.compile(languageFileSchema);
    if (!languageFileValidator(languageFileData)) {
      problems.add(
        language,
        languageFileValidator.errors?.[0]?.message ?? "unknown"
      );
      continue;
    }
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
          duplicatePercentage
        )}%) duplicates:\n ${duplicates.join(",")}`
      );
    }
  }

  //no files not defined in LanguageList
  fs.readdirSync("./static/languages")
    .map((it) => it.substring(0, it.length - 5))
    .filter((it) => !LanguageList.some((language) => language === it))
    .map((it) => `frontend/static/languages/${it}.json`)
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
        ", "
      )}`
    );
  }

  const languagesMissingGroup = LanguageList.filter(
    (lang) => !groupByLanguage.has(lang)
  );
  if (languagesMissingGroup.length !== 0) {
    problems.add(
      "_groups",
      `languages missing group: ${languagesMissingGroup.join(", ")}`
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
      "Additional font files not declared in frontend/src/ts/constants/fonts.ts",
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
        `missing file frontend/static/webfonts/${config.fileName}`
      )
    );

  //additional font files
  const expectedFontFiles = new Set(
    Object.entries(Fonts)
      .filter(([_name, config]) => !config.systemFont)
      .map(([_name, config]) => config.fileName as string)
  );

  fontFiles
    .filter((name) => !expectedFontFiles.has(name))
    .map((name) => `frontend/static/webfonts/${name}`)
    .forEach((file) => problems.add("_additional", file));

  console.log(problems.toString());

  if (problems.hasError()) {
    throw new Error("layouts with errors");
  }
}

async function validateThemes(): Promise<void> {
  const problems = new Problems<ThemeName, "_additional">("Themes", {
    _additional:
      "Additional theme files not declared in frontend/src/ts/constants/themes.ts",
  });

  //no missing files
  const themeFiles = fs
    .readdirSync("./static/themes")
    .map((it) => it.substring(0, it.length - 4));

  //missing theme files
  ThemesList.filter((it) => !themeFiles.includes(it.name)).forEach((it) =>
    problems.add(it.name, `missing file frontend/static/themes/${it.name}.css`)
  );

  //additional theme files
  themeFiles
    .filter((it) => !ThemesList.some((theme) => theme.name === it))
    .map((it) => `frontend/static/themes/${it}.css`)
    .forEach((it) => problems.add("_additional", it));

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
    validateAll ? Object.values(validators).flat() : []
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
