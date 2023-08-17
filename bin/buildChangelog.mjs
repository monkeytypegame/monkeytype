import conventionalChangelog from "conventional-changelog";
import { exec } from "child_process";

const stream = conventionalChangelog(
  {
    preset: {
      name: "conventionalcommits",
      types: [
        { type: "feat", section: "Features" },
        { type: "impr", section: "Improvements" },
        { type: "fix", section: "Fixes" },
      ],
    },
  },
  undefined,
  undefined,
  undefined,
  {
    headerPartial: "",
  }
);

const header =
  "Thank you to all the contributors who made this release possible!\n\n---";
const footer = `\n### Other\n\nVarious style, documentation, refactoring, performance, or build improvements.`;

let log = "";
for await (const chunk of stream) {
  log += chunk;
}

log = log.replace(/^\*/gm, "-");

console.log(header + log + footer);

//i might come back to the approach below at some point

async function getLog() {
  return new Promise((resolve, reject) => {
    exec(
      `git log --oneline $(git describe --tags --abbrev=0 @^)..@ --pretty="format:%H %h %s"`,
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }

        resolve(stdout);
      }
    );
  });
}

function itemIsAddingQuotes(item) {
  return (
    (item.scope?.includes("quote") ||
      item.scope?.includes("quotes") ||
      item.message?.includes("quote")) &&
    (item.message.includes("add") ||
      item.message.includes("added") ||
      item.message.includes("adding") ||
      item.message.includes("adds"))
  );
}

async function main() {
  let logString = await getLog();
  logString = logString.split("\n");

  let log = [];
  for (let line of logString) {
    //split line based on the format: d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 style: adjusted testConfig and modesNotice.
    //use regex to split
    const [_, hash, shortHash, fullMessage] = line.split(
      /(\w{40}) (\w{9}) (.*)/
    );

    //split message using regex based on fix(language): spelling mistakes in Nepali wordlist and quotes (sapradhan) (#4528)
    //scope is optional, username is optional, pr number is optional
    const [__, type, scope, message, username, pr] = fullMessage.split(
      /^([^\s()]+)(?:\(([^\s()]+)\))?:\s(.*?)(?:\(([^\s()]+)\))?(?:\s\((#\d+)\))?$/
    );

    if (type && message) {
      log.push({
        hash,
        shortHash,
        type,
        scope,
        message,
        username,
        pr,
      });
    } else {
      console.warn("skipping line due to invalid format: " + line);
    }
  }

  log = log.filter((item) => ["feat", "fix", "impr"].includes(item.type));

  log = log.filter((item) => !itemIsAddingQuotes(item));

  let quoteAddCommits = log.filter((item) => itemIsAddingQuotes(item));

  console.log(quoteAddCommits);

  // console.log(log);
}

// main();
