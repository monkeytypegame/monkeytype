const fs = require("fs");
const V = require("jsonschema").Validator;
const JSONValidator = new V();

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const fontsValidator = JSONValidator.validate(fontsData, fontsSchema);
    if (fontsValidator.valid) {
      console.log("Fonts JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Fonts JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(fontsValidator.errors));
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
          type: { type: "string" },
          info: { type: "string" },
          affectsWordGeneration: { type: "boolean" },
        },
        required: ["name", "type", "info"],
      },
    };
    const funboxValidator = JSONValidator.validate(funboxData, funboxSchema);
    if (funboxValidator.valid) {
      console.log("Funbox JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Funbox JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(funboxValidator.errors));
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
    const themesValidator = JSONValidator.validate(themesData, themesSchema);
    if (themesValidator.valid) {
      console.log("Themes JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Themes JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(themesValidator.errors));
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
    const challengesValidator = JSONValidator.validate(
      challengesData,
      challengesSchema
    );
    if (challengesValidator.valid) {
      console.log("Challenges list JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Challenges list JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(challengesValidator.errors));
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
                items: { type: "string", minLength: 1, maxLength: 2 },
                minItems: 13,
                maxItems: 13,
              },
              row2: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 2 },
                minItems: 13,
                maxItems: 13,
              },
              row3: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 2 },
                minItems: 11,
                maxItems: 11,
              },
              row4: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 2 },
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
                items: { type: "string", minLength: 1, maxLength: 2 },
                minItems: 13,
                maxItems: 13,
              },
              row2: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 2 },
                minItems: 12,
                maxItems: 12,
              },
              row3: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 2 },
                minItems: 12,
                maxItems: 12,
              },
              row4: {
                type: "array",
                items: { type: "string", minLength: 1, maxLength: 2 },
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

      const layoutsValidator = JSONValidator.validate(
        layoutData,
        layoutsSchema[layoutData.type]
      );
      if (!layoutsValidator.valid) {
        console.log(
          `Layout ${layoutName} JSON schema is \u001b[31minvalid\u001b[0m`
        );
        layoutsAllGood = false;
        layoutsErrors = layoutsValidator.errors;
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
      quoteSchema.properties.language.pattern =
        "^" + escapeRegExp(quotefilename) + "$";
      const quoteValidator = JSONValidator.validate(quoteData, quoteSchema);
      if (!quoteValidator.valid) {
        console.log(
          `Quote ${quotefilename} JSON schema is \u001b[31minvalid\u001b[0m`
        );
        quoteFilesAllGood = false;
        quoteFilesErrors = quoteValidator.errors;
      }
      const quoteIds = quoteData.quotes.map((quote) => quote.id);
      const quoteIdsValidator = JSONValidator.validate(
        quoteIds,
        quoteIdsSchema
      );
      if (!quoteIdsValidator.valid) {
        console.log(
          `Quote ${quotefilename} IDs are \u001b[31mnot unique\u001b[0m`
        );
        quoteIdsAllGood = false;
        quoteIdsErrors = quoteIdsValidator.errors;
      }
      const incorrectQuoteLength = quoteData.quotes
        .filter((quote) => quote.text.length !== quote.length)
        .map((quote) => quote.id);
      if (incorrectQuoteLength.length !== 0) {
        console.log(
          `Quote ${quotefilename} ID(s) ${incorrectQuoteLength.join(
            ","
          )} length fields are \u001b[31mincorrect\u001b[0m`
        );
        quoteFilesAllGood = false;
        incorrectQuoteLength.map((id) => {
          quoteLengthErrors.push(
            `${quotefilename} ${id} length field is incorrect`
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
    const languagesValidator = JSONValidator.validate(
      languagesData,
      languagesSchema
    );
    if (languagesValidator.valid) {
      console.log("Languages list JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Languages list JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(languagesValidator.errors));
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
    const languagesGroupValidator = JSONValidator.validate(
      languagesGroupData,
      languagesGroupSchema
    );
    if (languagesGroupValidator.valid) {
      console.log("Languages groups JSON schema is \u001b[32mvalid\u001b[0m");
    } else {
      console.log("Languages groups JSON schema is \u001b[31minvalid\u001b[0m");
      return reject(new Error(languagesGroupValidator.errors));
    }

    //language files
    const languageFileSchema = {
      type: "object",
      properties: {
        name: { type: "string" },
        leftToRight: { type: "boolean" },
        noLazyMode: { type: "boolean" },
        bcp47: { type: "string" },
        words: {
          type: "array",
          items: { type: "string", minLength: 1 },
        },
        accents: {
          type: "array",
          items: {
            type: "array",
            items: { type: "string", minLength: 1 },
            minItems: 2,
            maxItems: 2,
          },
        },
      },
      required: ["name", "leftToRight", "words"],
    };
    let languageFilesAllGood = true;
    let languageFilesErrors;
    languagesData.forEach((language) => {
      const languageFileData = JSON.parse(
        fs.readFileSync(`./static/languages/${language}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      );
      languageFileSchema.properties.name.pattern =
        "^" + escapeRegExp(language) + "$";
      const languageFileValidator = JSONValidator.validate(
        languageFileData,
        languageFileSchema
      );
      if (!languageFileValidator.valid) {
        languageFilesAllGood = false;
        languageFilesErrors = languageFileValidator.errors;
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
