const fs = require("fs");

function fixQuoteLengths() {
  return new Promise((resolve) => {
    const quotesFiles = fs.readdirSync("../static/quotes/");
    quotesFiles.forEach((quotefilename) => {
      quotefilename = quotefilename.split(".")[0];
      let quoteData = JSON.parse(
        fs.readFileSync(`../static/quotes/${quotefilename}.json`, {
          encoding: "utf8",
          flag: "r",
        })
      );

      quoteData.quotes.forEach((quote) => {
        quote.length = quote.text.length;
      });

      fs.writeFileSync(
        `../static/quotes/${quotefilename}.json`,
        JSON.stringify(quoteData, null, 2)
      );
    });
    resolve();
  });
}

fixQuoteLengths();
