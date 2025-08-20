/**
 * Example usage in root or frontend:
 * pnpm validate-json (npm run validate-json)
 * pnpm vaildate-json quotes others(npm run vaildate-json quotes others)
 * pnpm validate-json challenges fonts -p (npm run validate-json challenges fonts -- -p)
 */

import * as fs from "fs";
import Ajv from "ajv";
const ajv = new Ajv();

function findDuplicates(words: string[]): string[] {
  const wordFrequencies: Record<string, number> = {};
  const duplicates: string[] = [];

  words.forEach((word) => {
    wordFrequencies[word] = (wordFrequencies[word] ?? 0) + 1;

    if (wordFrequencies[word] === 2) {
      duplicates.push(word);
    }
  });
  return duplicates;
}

async function validateChallenges(): Promise<void> {
  return new Promise((resolve, reject) => {
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
      reject(new Error(challengesValidator?.errors?.[0]?.message));
    }
    resolve();
  });
}

async function validateLayouts(): Promise<void> {
  return new Promise((resolve, reject) => {
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

    let layoutsErrors = [];

    const layouts = fs
      .readdirSync("./static/layouts")
      .map((it) => it.substring(0, it.length - 5));

    for (let layoutName of layouts) {
      let layoutData = undefined;
      try {
        layoutData = JSON.parse(
          fs.readFileSync(`./static/layouts/${layoutName}.json`, "utf-8")
        ) as object & { type: "ansi" | "iso" };
      } catch (e) {
        layoutsErrors.push(
          `Layout ${layoutName} has error: ${
            e instanceof Error ? e.message : e
          }`
        );
        continue;
      }

      if (layoutsSchema[layoutData.type] === undefined) {
        const msg = `Layout ${layoutName} has an invalid type: ${layoutData.type}`;
        console.log(msg);
        layoutsErrors.push(msg);
      } else {
        const layoutsValidator = ajv.compile(layoutsSchema[layoutData.type]);
        if (!layoutsValidator(layoutData)) {
          console.log(
            `Layout ${layoutName} JSON schema is \u001b[31minvalid\u001b[0m`
          );
          layoutsErrors.push(layoutsValidator.errors?.[0]?.message);
        }
      }
    }

    if (layoutsErrors.length === 0) {
      console.log(`Layout JSON schemas are \u001b[32mvalid\u001b[0m`);
    } else {
      console.log(`Layout JSON schemas are \u001b[31minvalid\u001b[0m`);
      reject(new Error(layoutsErrors.join("\n")));
    }
    resolve();
  });
}

async function validateQuotes(): Promise<void> {
  return new Promise((resolve, reject) => {
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
    let quoteFilesAllGood = true;
    let quoteFilesErrors;
    let quoteIdsAllGood = true;
    let quoteIdsErrors;
    let quoteLengthsAllGood = true;
    let quoteLengthErrors: string[] = [];
    const quotesFiles = fs.readdirSync("./static/quotes/");
    quotesFiles.forEach((quotefilename: string) => {
      quotefilename = quotefilename.split(".")[0] as string;
      const quoteData = JSON.parse(
        fs.readFileSync(`./static/quotes/${quotefilename}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      ) as object & {
        language: string;
        quotes: { id: number; text: string; length: number }[];
      };
      if (quoteData.language !== quotefilename) {
        quoteFilesAllGood = false;
        quoteFilesErrors = "Name is not " + quotefilename;
      }
      const quoteValidator = ajv.compile(quoteSchema);
      if (!quoteValidator(quoteData)) {
        console.log(
          `Quote ${quotefilename} JSON schema is \u001b[31minvalid\u001b[0m`
        );
        quoteFilesAllGood = false;
        quoteFilesErrors =
          quoteValidator.errors?.[0]?.message +
          ` (at static/quotes/${quotefilename}.json)`;
        return;
      }
      const quoteIds = quoteData.quotes.map((quote) => quote.id);
      const quoteIdsValidator = ajv.compile(quoteIdsSchema);
      if (!quoteIdsValidator(quoteIds)) {
        console.log(
          `Quote ${quotefilename} IDs are \u001b[31mnot unique\u001b[0m`
        );
        quoteIdsAllGood = false;
        quoteIdsErrors =
          quoteIdsValidator.errors?.[0]?.message +
          ` (at static/quotes/${quotefilename}.json)`;
      }
      const incorrectQuoteLength = quoteData.quotes.filter(
        (quote) => quote.text.length !== quote.length
      );
      if (incorrectQuoteLength.length !== 0) {
        console.log("Some length fields are \u001b[31mincorrect\u001b[0m");
        incorrectQuoteLength.map((quote) => {
          console.log(
            `Quote ${quotefilename} ID ${quote.id}: expected length ${quote.text.length}`
          );
        });
        quoteFilesAllGood = false;
        incorrectQuoteLength.map((quote) => {
          quoteLengthErrors.push(
            `${quotefilename} ${quote.id} length field is incorrect`
          );
        });
      }
    });
    if (quoteFilesAllGood) {
      console.log(`Quote file JSON schemas are \u001b[32mvalid\u001b[0m`);
    } else {
      console.log(`Quote file JSON schemas are \u001b[31minvalid\u001b[0m`);
      reject(new Error(quoteFilesErrors));
    }
    if (quoteIdsAllGood) {
      console.log(`Quote IDs are \u001b[32munique\u001b[0m`);
    } else {
      console.log(`Quote IDs are \u001b[31mnot unique\u001b[0m`);
      reject(new Error(quoteIdsErrors));
    }
    if (quoteLengthsAllGood) {
      console.log(`Quote length fields are \u001b[32mcorrect\u001b[0m`);
    } else {
      console.log(`Quote length fields are \u001b[31mincorrect\u001b[0m`);
      reject(new Error(quoteLengthErrors.join(",")));
    }
    resolve();
  });
}

async function validateLanguages(): Promise<void> {
  return new Promise((resolve, reject) => {
    const languages = fs
      .readdirSync("./static/languages")
      .map((it) => it.substring(0, it.length - 5));
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
    let languageFilesAllGood = true;
    let languageWordListsAllGood = true;
    let languageFilesErrors = "";
    const duplicatePercentageThreshold = 0.0001;
    let langsWithDuplicates = 0;
    languages.forEach((language) => {
      const languageFileData = JSON.parse(
        fs.readFileSync(`./static/languages/${language}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      ) as object & { name: string; words: string[] };
      const languageFileValidator = ajv.compile(languageFileSchema);
      if (!languageFileValidator(languageFileData)) {
        console.log(
          `Language ${language} JSON schema is \u001b[31minvalid\u001b[0m`
        );
        languageFilesAllGood = false;
        languageFilesErrors =
          languageFileValidator.errors?.[0]?.message +
          ` (at static/languages/${language}.json`;
        return;
      }
      if (languageFileData.name !== language) {
        languageFilesAllGood = false;
        languageFilesErrors = "Name is not " + language;
      }
      const duplicates = findDuplicates(languageFileData.words);
      const duplicatePercentage =
        (duplicates.length / languageFileData.words.length) * 100;
      if (duplicatePercentage >= duplicatePercentageThreshold) {
        langsWithDuplicates++;
        languageWordListsAllGood = false;
        languageFilesErrors = `Language '${languageFileData.name}' contains ${
          duplicates.length
        } (${Math.round(duplicatePercentage)}%) duplicates:`;
        console.log(languageFilesErrors);
        console.log(duplicates);
      }
    });
    if (languageFilesAllGood) {
      console.log(
        `Language word list JSON schemas are \u001b[32mvalid\u001b[0m`
      );
    } else {
      console.log(
        `Language word list JSON schemas are \u001b[31minvalid\u001b[0m`
      );
      reject(new Error(languageFilesErrors));
    }

    if (languageWordListsAllGood) {
      console.log(
        `Language word lists duplicate check is \u001b[32mvalid\u001b[0m`
      );
    } else {
      console.log(
        `Language word lists duplicate check is \u001b[31minvalid\u001b[0m (${langsWithDuplicates} languages contain duplicates)`
      );
      reject(new Error(languageFilesErrors));
    }

    resolve();
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // oxlint-disable-next-line prefer-set-has this error doesnt make sense
  const flags = args.filter((arg) => arg.startsWith("-"));
  const keys = args.filter((arg) => !arg.startsWith("-"));

  const mainValidators: Record<string, () => Promise<void>> = {
    quotes: validateQuotes,
    languages: validateLanguages,
    layouts: validateLayouts,
    challenges: validateChallenges,
  };

  const validatorsIndex = {
    ...Object.fromEntries(
      Object.entries(mainValidators).map(([k, v]) => [k, [v]])
    ),
    // add arbitrary keys and validator groupings down here
    others: [validateChallenges, validateLayouts],
  };

  // flags
  const validateAll =
    keys.length < 1 || flags.includes("--all") || flags.includes("-a");
  const passWithNoValidators =
    flags.includes("--pass-with-no-validators") || flags.includes("-p");

  const tasks = new Set(validateAll ? Object.values(mainValidators) : []);
  for (const key of keys) {
    if (!Object.keys(validatorsIndex).includes(key)) {
      console.error(`There is no validator for key '${key}'.`);
      if (!passWithNoValidators) process.exit(1);
    } else if (!validateAll) {
      //@ts-expect-error magic
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      validatorsIndex[key].forEach((validator) => tasks.add(validator));
    }
  }

  if (tasks.size > 0) {
    await Promise.all([...tasks].map(async (validator) => validator()));
    return;
  }
}
void (async () => {
  try {
    await main();
  } catch (err) {
    console.error("Error in main:", err);
    process.exit(1); // Optional: exit with error code
  }
})();
