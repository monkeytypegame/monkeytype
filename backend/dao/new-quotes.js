const MonkeyError = require("../handlers/error");
const { mongoDB } = require("../init/mongodb");
const fs = require("fs");
const simpleGit = require("simple-git");
const git = simpleGit();
const stringSimilarity = require("string-similarity");

class NewQuotesDAO {
  static async add(text, source, language, uid) {
    let quote = {
      text: text,
      source: source,
      language: language.toLowerCase(),
      submittedBy: uid,
      timestamp: Date.now(),
      approved: false,
    };
    //check for duplicate first
    const fileDir = `../monkeytype/static/quotes/${language}.json`;
    let duplicateId = -1;
    let similarityScore = -1;
    if (fs.existsSync(fileDir)) {
      let quoteFile = fs.readFileSync(fileDir);
      quoteFile = JSON.parse(quoteFile.toString());
      quoteFile.quotes.every((old) => {
        if (stringSimilarity.compareTwoStrings(old.text, quote.text) > 0.9) {
          duplicateId = old.id;
          similarityScore = stringSimilarity.compareTwoStrings(
            old.text,
            quote.text
          );
          return false;
        }
        return true;
      });
    }
    if (duplicateId != -1) {
      return { duplicateId, similarityScore };
    }
    return await mongoDB().collection("new-quotes").insertOne(quote);
  }

  static async get() {
    return await mongoDB()
      .collection("new-quotes")
      .find({ approved: false })
      .toArray();
  }

  static async approve(quoteId, modUid) {
    //check mod status
    const user = await mongoDB().collection("users").findOne({ uid: modUid });
    if (user.quoteMod != true)
      return { status: "Quote not approved. You are not a mod" };
    let quote = await mongoDB()
      .collection("new-quotes")
      .findOne({ _id: quoteId });
    language = quote.language;
    quote = {
      text: quote.text,
      source: quote.source,
      length: quote.text.length,
    };
    const fileDir = `../monkeytype/static/quotes/${language}.json`;
    if (fs.existsSync(fileDir)) {
      let quoteFile = fs.readFileSync(fileDir);
      quoteFile = JSON.parse(quoteFile.toString());
      let newid =
        Math.max.apply(
          Math,
          quoteFile.quotes.map(function (q) {
            return q.id;
          })
        ) + 1;
      quote.id = newid;
      quoteFile.quotes.push(quote);
      returnValue.status = true;
      returnValue.message = `Added quote to ${language}.json.`;
    } else {
      //file doesnt exist, create it
      quote.id = 1;
      fs.writeFileSync(
        fileDir,
        JSON.stringify({
          language: language,
          groups: [
            [0, 100],
            [101, 300],
            [301, 600],
            [601, 9999],
          ],
          quotes: [quote],
        })
      );
      returnValue.status = true;
      returnValue.message = `Created file ${language}.json and added quote.`;
    }
    git.pull("upstream", "master");
    git.add([`static/quotes/${language}.json`]);
    git.commit(`Added quote to ${language}.json`);
    git.push("origin", "master");
    return await mongoDB()
      .collection("new-quotes")
      .updateOne(
        { _id: quoteId },
        {
          $set: {
            approvedBy: modUid,
            approved: true,
            approvedTime: Date.now(),
          },
        }
      );
  }
}

module.exports = NewQuotesDAO;
