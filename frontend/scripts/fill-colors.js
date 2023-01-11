const fs = require("fs");

function main() {
  return new Promise((resolve, reject) => {
    const listFile = JSON.parse(
      fs.readFileSync("../static/themes/_list.json", {
        encoding: "utf8",
      })
    );
    const themeFiles = fs.readdirSync("../static/themes/");
    // themeFiles.forEach((filename) => {
    for (let filename of themeFiles) {
      if (filename === "_list.json") continue;

      filename = filename.split(".")[0];
      let themeData = fs.readFileSync(`../static/themes/${filename}.css`, {
        encoding: "utf8",
        flag: "r",
      });

      const subMatches = /--sub-color: (#.+);/g.exec(themeData);

      const bgMatches = /--bg-color: (#.+);/g.exec(themeData);

      const mainMatches = /--main-color: (#.+);/g.exec(themeData);

      const textMatches = /--text-color: (#.+);/g.exec(themeData);

      listFile.find(
        (theme) => theme.name === filename.split(".css")[0]
      ).subColor = subMatches[1];
      listFile.find(
        (theme) => theme.name === filename.split(".css")[0]
      ).textColor = textMatches[1];
      listFile.find(
        (theme) => theme.name === filename.split(".css")[0]
      ).bgColor = bgMatches[1];
      listFile.find(
        (theme) => theme.name === filename.split(".css")[0]
      ).mainColor = mainMatches[1];

      // console.log(themeData);

      // fs.writeFileSync(
      //   `../static/quotes/${filename}.json`,
      //   JSON.stringify(quoteData, null, 2)
      // );
    }
    fs.writeFileSync(
      `../static/themes/_list.json`,
      JSON.stringify(listFile, null, 2)
    );
    resolve();
  });
  // });
}

main();
