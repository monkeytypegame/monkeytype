const fs = require("fs");


const MAX_WORDS_LENGTH = 10000
const DUPLICATE_PERCENTAGE_QUALITY_GATE = 15

function findDuplicates (arr) {
  return arr.filter((item, index) => {
    let indexOf = arr.indexOf(item.toLowerCase());
    return indexOf !== index && indexOf !== -1;
  });
}

function validateLanguageContents(languageNameFilter) {
  return new Promise((resolve, reject) => {
    const languagesData = JSON.parse(
      fs.readFileSync("./static/languages/_list.json", {
        encoding: "utf8",
        flag: "r",
      })
    ).filter(language => languageNameFilter === undefined || language.startsWith(languageNameFilter));


    const results = [];
    let allLanguageFilesOk = true;

    languagesData.forEach((language) => {
      const languageFileData = JSON.parse(
        fs.readFileSync(`./static/languages/${language}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      );

      // Skip the validation of large language lists
      if (languageFileData.words.length > MAX_WORDS_LENGTH) return;


      let duplicates = findDuplicates(languageFileData.words);

      let duplicatePercentage = Math.round(duplicates.length / languageFileData.words.length * 100)
      if (duplicatePercentage > DUPLICATE_PERCENTAGE_QUALITY_GATE) {
        console.warn(`Language '${languageFileData.name}' may contain ${duplicates.length} (${duplicatePercentage}%) duplicate(s):`);
        console.warn(duplicates)
        results.push({'name': languageFileData.name, 'duplicates': duplicates})
        allLanguageFilesOk = false;
      }

    });

    if(!allLanguageFilesOk) {
      return reject(new Error(`Detected ${results.length} languages with duplicate percentage over ${DUPLICATE_PERCENTAGE_QUALITY_GATE}% !`));
    }

    resolve();
  });
}

module.exports = {
  validateLanguageContents,
};