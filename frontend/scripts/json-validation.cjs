const fs = require("fs");
const Ajv = require("ajv");
const ajv = new Ajv();

function findDuplicates(words) {
  const wordFrequencies = {};
  const duplicates = [];

  words.forEach((word) => {
    wordFrequencies[word] =
      word in wordFrequencies ? wordFrequencies[word] + 1 : 1;

    if (wordFrequencies[word] === 2) {
      duplicates.push(word);
    }
  });
  return duplicates;
}

function validateOthers() {
  return new Promise((resolve, reject) => {
    //fonts
    const fontsData = JSON.parse(
      fs.readFileSync("./static/fonts/_list.json", {
        encoding: "utf8",
        flag: "r",
      })
    );
    const fontsSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
        },
        required: ["name"],
      },
    };
    const fontsValidator = ajv.compile(fontsSchema);
    if (fontsValidator(fontsData)) {
      console.log("Fonts JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Fonts JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(fontsValidator.errors[0].message));
    }

    //funbox
    const funboxData = JSON.parse(
      fs.readFileSync("./static/funbox/_list.json", {
        encoding: "utf8",
        flag: "r",
      })
    );
    const funboxSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          info: { type: "string" },
          canGetPb: { type: "boolean" },
          alias: { type: "string" },
        },
        required: ["name", "info", "canGetPb"],
      },
    };
    const funboxValidator = ajv.compile(funboxSchema);
    if (funboxValidator(funboxData)) {
      console.log("Funbox list JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Funbox list JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(funboxValidator.errors[0].message));
    }

    //themes
    const themesData = JSON.parse(
      fs.readFileSync("./static/themes/_list.json", {
        encoding: "utf8",
        flag: "r",
      })
    );
    const themesSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          bgColor: { type: "string" },
          mainColor: { type: "string" },
        },
        required: ["name", "bgColor", "mainColor"],
      },
    };
    const themesValidator = ajv.compile(themesSchema);
    if (themesValidator(themesData)) {
      console.log("Themes list JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Themes list JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(themesValidator.errors[0].message));
    }
    //check if files exist
    for (const theme of themesData) {
      const themeName = theme.name;
      const fileName = `${themeName}.css`;
      const themePath = `./static/themes/${fileName}`;
      if (!fs.existsSync(themePath)) {
        console.log(`File ${fileName} was \u001b[31mnot found\u001b[0m`);
        // return reject(new Error(`File for theme ${themeName} does not exist`));
        return reject(
          `Could not find file ${fileName} for theme ${themeName} - make sure the file exists and is named correctly`
        );
      }
    }

    //challenges
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
                  exact: { type: "string" },
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
    );
    const challengesValidator = ajv.compile(challengesSchema);
    if (challengesValidator(challengesData)) {
      console.log("Challenges list JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Challenges list JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(challengesValidator.errors[0].message));
    }

    //layouts
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
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 13,
                maxItems: 13,
              },
              row2: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 13,
                maxItems: 13,
              },
              row3: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 11,
                maxItems: 11,
              },
              row4: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 10,
                maxItems: 10,
              },
              row5: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 1 },
                minItems: 1,
                maxItems: 1,
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
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 13,
                maxItems: 13,
              },
              row2: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 12,
                maxItems: 12,
              },
              row3: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 12,
                maxItems: 12,
              },
              row4: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 4 },
                minItems: 11,
                maxItems: 11,
              },
              row5: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 1 },
                minItems: 1,
                maxItems: 1,
              },
            },
            required: ["row1", "row2", "row3", "row4", "row5"],
          },
        },
        required: ["keymapShowTopRow", "type", "keys"],
      },
    };
    const layoutsData = JSON.parse(
      fs.readFileSync("./static/layouts/_list.json", {
        encoding: "utf8",
        flag: "r",
      })
    );

    let layoutsAllGood = true;
    let layoutsErrors;
    Object.keys(layoutsData).forEach((layoutName) => {
      const layoutData = layoutsData[layoutName];

      if (!layoutsSchema[layoutData.type]) {
        const msg = `Layout ${layoutName} has an invalid type: ${layoutData.type}`;
        console.log(msg);
        layoutsAllGood = false;
        layoutsErrors = [msg];
      } else {
        const layoutsValidator = ajv.compile(layoutsSchema[layoutData.type]);
        if (!layoutsValidator(layoutData)) {
          console.log(
            `Layout ${layoutName} JSON schema is \u001b[31minvalid\u001b[0m`
          );
          layoutsAllGood = false;
          layoutsErrors = layoutsValidator.errors[0].message;
        }
      }
    });
    if (layoutsAllGood) {
      console.log(`Layout JSON schemas are \u001b[32mvalid\u001b[0m`);
    } else {
      console.log(`Layout JSON schemas are \u001b[31minvalid\u001b[0m`);
      return reject(new Error(layoutsErrors));
    }
    resolve();
  });
}

function validateQuotes() {
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
    let quoteLengthErrors = [];
    const quotesFiles = fs.readdirSync("./static/quotes/");
    quotesFiles.forEach((quotefilename) => {
      quotefilename = quotefilename.split(".")[0];
      const quoteData = JSON.parse(
        fs.readFileSync(`./static/quotes/${quotefilename}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      );
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
          quoteValidator.errors[0].message +
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
          quoteIdsValidator.errors[0].message +
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
      return reject(new Error(quoteFilesErrors));
    }
    if (quoteIdsAllGood) {
      console.log(`Quote IDs are \u001b[32munique\u001b[0m`);
    } else {
      console.log(`Quote IDs are \u001b[31mnot unique\u001b[0m`);
      return reject(new Error(quoteIdsErrors));
    }
    if (quoteLengthsAllGood) {
      console.log(`Quote length fields are \u001b[32mcorrect\u001b[0m`);
    } else {
      console.log(`Quote length fields are \u001b[31mincorrect\u001b[0m`);
      return reject(new Error(quoteLengthErrors));
    }
    resolve();
  });
}

function validateLanguages() {
  return new Promise((resolve, reject) => {
    //languages
    const languagesData = JSON.parse(
      fs.readFileSync("./static/languages/_list.json", {
        encoding: "utf8",
        flag: "r",
      })
    );
    const languagesSchema = {
      type: "array",
      items: {
        type: "string",
      },
    };
    const languagesValidator = ajv.compile(languagesSchema);
    if (languagesValidator(languagesData)) {
      console.log("Languages list JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Languages list JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(languagesValidator.errors[0].message));
    }

    //languages group
    const languagesGroupData = JSON.parse(
      fs.readFileSync("./static/languages/_groups.json", {
        encoding: "utf8",
        flag: "r",
      })
    );
    const languagesGroupSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          languages: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: ["name", "languages"],
      },
    };
    const languagesGroupValidator = ajv.compile(languagesGroupSchema);
    if (languagesGroupValidator(languagesGroupData)) {
      console.log("Languages groups JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Languages groups JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(languagesGroupValidator.errors[0].message));
    }

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
    let languageFilesErrors;
    const duplicatePercentageThreshold = 0.0001;
    let langsWithDuplicates = 0;
    languagesData.forEach((language) => {
      const languageFileData = JSON.parse(
        fs.readFileSync(`./static/languages/${language}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      );
      const languageFileValidator = ajv.compile(languageFileSchema);
      if (!languageFileValidator(languageFileData)) {
        console.log(
          `Language ${language} JSON schema is \u001b[31minvalid\u001b[0m`
        );
        languageFilesAllGood = false;
        languageFilesErrors =
          languageFileValidator.errors[0].message +
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
      return reject(new Error(languageFilesErrors));
    }

    if (languageWordListsAllGood) {
      console.log(
        `Language word lists duplicate check is \u001b[32mvalid\u001b[0m`
      );
    } else {
      console.log(
        `Language word lists duplicate check is \u001b[31minvalid\u001b[0m (${langsWithDuplicates} languages contain duplicates)`
      );
      return reject(new Error(languageFilesErrors));
    }

    resolve();
  });
}

function validateAll() {
  return Promise.all([validateOthers(), validateLanguages(), validateQuotes()]);
}

module.exports = {
  validateAll,
  validateOthers,
  validateLanguages,
  validateQuotes,
};
