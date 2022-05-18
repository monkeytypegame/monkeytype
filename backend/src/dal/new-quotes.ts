import simpleGit from "simple-git";
import { ObjectId } from "mongodb";
import stringSimilarity from "string-similarity";
import path from "path";
import fs from "fs";
import * as db from "../init/db";
import MonkeyError from "../utils/error";

const PATH_TO_REPO = "../../../../monkeytype-new-quotes";

let git;
try {
  git = simpleGit(path.join(__dirname, PATH_TO_REPO));
} catch (e) {
  git = undefined;
}

type AddQuoteReturn = {
  languageError?: number;
  duplicateId?: number;
  similarityScore?: number;
};

export async function add(
  text: string,
  source: string,
  language: string,
  uid: string
): Promise<AddQuoteReturn | void> {
  if (!git) throw new MonkeyError(500, "Git not available.");
  const quote = {
    _id: new ObjectId(),
    text: text,
    source: source,
    language: language.toLowerCase(),
    submittedBy: uid,
    timestamp: Date.now(),
    approved: false,
  };
  //check for duplicate first
  const fileDir = path.join(
    __dirname,
    `${PATH_TO_REPO}/frontend/static/quotes/${language}.json`
  );
  let duplicateId = -1;
  let similarityScore = -1;
  if (fs.existsSync(fileDir)) {
    const quoteFile = fs.readFileSync(fileDir);
    const quoteFileJSON = JSON.parse(quoteFile.toString());
    quoteFileJSON.quotes.every((old) => {
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
  } else {
    return { languageError: 1 };
  }
  if (duplicateId != -1) {
    return { duplicateId, similarityScore };
  }
  await db.collection("new-quotes").insertOne(quote);
}

export async function get(language: string): Promise<MonkeyTypes.NewQuote[]> {
  if (!git) throw new MonkeyError(500, "Git not available.");
  const where: {
    approved: boolean;
    language?: string;
  } = {
    approved: false,
  };
  if (language !== "all") {
    where.language = language;
  }
  return await db
    .collection<MonkeyTypes.NewQuote>("new-quotes")
    .find(where)
    .sort({ timestamp: 1 })
    .limit(10)
    .toArray();
}

type Quote = {
  id?: number;
  text: string;
  source: string;
  length: number;
  approvedBy: string;
};

type ApproveReturn = {
  quote: Quote;
  message: string;
};

export async function approve(
  quoteId: string,
  editQuote: string,
  editSource: string,
  name: string
): Promise<ApproveReturn> {
  if (!git) throw new MonkeyError(500, "Git not available.");
  //check mod status
  const targetQuote = await db
    .collection<MonkeyTypes.NewQuote>("new-quotes")
    .findOne({ _id: new ObjectId(quoteId) });
  if (!targetQuote) {
    throw new MonkeyError(404, "Quote not found");
  }
  const language = targetQuote.language;
  const quote: Quote = {
    text: editQuote ? editQuote : targetQuote.text,
    source: editSource ? editSource : targetQuote.source,
    length: targetQuote.text.length,
    approvedBy: name,
  };
  let message = "";
  const fileDir = path.join(
    __dirname,
    `${PATH_TO_REPO}/frontend/static/quotes/${language}.json`
  );
  await git.pull("upstream", "master");
  if (fs.existsSync(fileDir)) {
    const quoteFile = fs.readFileSync(fileDir);
    const quoteObject = JSON.parse(quoteFile.toString());
    quoteObject.quotes.every((old) => {
      if (stringSimilarity.compareTwoStrings(old.text, quote.text) > 0.8) {
        throw new MonkeyError(409, "Duplicate quote");
      }
    });
    let maxid = 0;
    quoteObject.quotes.map(function (q) {
      if (q.id > maxid) {
        maxid = q.id;
      }
    });
    quote.id = maxid + 1;
    quoteObject.quotes.push(quote);
    fs.writeFileSync(fileDir, JSON.stringify(quoteObject, null, 2));
    message = `Added quote to ${language}.json.`;
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
    message = `Created file ${language}.json and added quote.`;
  }
  await git.add([`frontend/static/quotes/${language}.json`]);
  await git.commit(`Added quote to ${language}.json`);
  await git.push("origin", "master");
  await db.collection("new-quotes").deleteOne({ _id: new ObjectId(quoteId) });
  return { quote, message };
}

export async function refuse(quoteId: string): Promise<void> {
  if (!git) throw new MonkeyError(500, "Git not available.");
  await db.collection("new-quotes").deleteOne({ _id: new ObjectId(quoteId) });
}
