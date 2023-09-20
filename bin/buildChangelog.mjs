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
  "Thank you to all the contributors who made this release possible!";
const footer = `\n### Other\n\n- Various style, documentation, refactoring, performance, or build improvements`;

let log = "";
for await (const chunk of stream) {
  log += chunk;
}

log = log.replace(/^\*/gm, "-");

// console.log(log);

// console.log(header + log + footer);
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
  const scopeIsQuote =
    item.scope?.includes("quote") ||
    item.scope?.includes("quotes") ||
    item.message?.includes("quote");

  const messageAdds =
    item.message.includes("add") ||
    item.message.includes("added") ||
    item.message.includes("adding") ||
    item.message.includes("adds");

  return scopeIsQuote && messageAdds;
}

function itemIsAddressingQuoteReports(item) {
  const scopeIsQuote =
    item.scope?.includes("quote") || item.scope?.includes("quotes");

  const messageReport =
    item.message.includes("quote") &&
    (item.message.includes("report") || item.message.includes("reports"));

  return scopeIsQuote && messageReport;
}

const titles = {
  feat: "Features",
  impr: "Improvements",
  fix: "Fixes",
};

function getPrLink(pr) {
  const prNum = pr.replace("#", "");
  return `[#${prNum}](https://github.com/monkeytypegame/monkeytype/issues/${prNum})`;
}

function getCommitLink(hash, longHash) {
  return `[${hash}](https://github.com/monkeytypegame/monkeytype/commit/${longHash})`;
}

function buildSection(type, allItems) {
  let ret = `### ${titles[type]}\n\n`;

  const items = allItems.filter((item) => item.type === type);

  if (items.length === 0) {
    return "";
  }

  for (let item of items) {
    const scope = item.scope ? `**${item.scope}:** ` : "";
    const usernames =
      item.usernames.length > 0 ? ` (${item.usernames.join(", ")})` : "";
    const pr =
      item.prs.length > 0
        ? ` (${item.prs.map((p) => getPrLink(p)).join(", ")})`
        : "";
    const hash = ` (${item.hashes
      .map((h) => getCommitLink(h.short, h.full))
      .join(", ")})`;

    ret += `- ${scope}${item.message}${usernames}${pr}${hash}\n`;
  }

  return ret;
}

async function main() {
  let logString = await getLog();
  logString = logString.split("\n");

  let log = [];
  for (let line of logString) {
    //split line based on the format: d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 style: adjusted testConfig and modesNotice.
    //use regex to split
    const [_, hash, shortHash, fullMessage] = line.split(
      /(\w{40}) (\w{9,10}) (.*)/
    );

    //split message using regex based on fix(language): spelling mistakes in Nepali wordlist and quotes (sapradhan) (#4528)
    //scope is optional, username is optional, pr number is optional
    const [__, type, scope, message, message2, message3] = fullMessage.split(
      /^(\w+)(?:\(([^)]+)\))?:\s+(.+?)\s*(?:\(([^)]+)\))?(?:\s+\(([^)]+)\))?(?:\s+\(([^)]+)\))?$/
    );

    const usernames = message2 && message3 ? message2.split(", ") : [];

    let pr;
    if (message2 && message3) {
      pr = message3;
    } else if (message2 && !message3) {
      pr = message2;
    }

    const prs = pr ? pr.split(", ") : [];

    if (type && message) {
      log.push({
        hashes: [
          {
            short: shortHash,
            full: hash,
          },
        ],
        type,
        scope,
        message,
        usernames,
        prs,
      });
    } else {
      console.warn("skipping line due to invalid format: " + line);
    }
  }

  let quoteAddCommits = log.filter((item) => itemIsAddingQuotes(item));
  log = log.filter((item) => !itemIsAddingQuotes(item));

  let quoteReportCommits = log.filter((item) =>
    itemIsAddressingQuoteReports(item)
  );
  log = log.filter((item) => !itemIsAddressingQuoteReports(item));

  if (quoteAddCommits.length > 0) {
    log.push({
      hashes: quoteAddCommits.map((item) => item.hashes).flat(),
      type: "impr",
      scope: "quote",
      message: "add quotes in various languages",
      usernames: quoteAddCommits.map((item) => item.usernames).flat(),
      prs: quoteAddCommits.map((item) => item.prs).flat(),
    });
  }

  if (quoteReportCommits.length > 0) {
    log.push({
      hashes: quoteReportCommits.map((item) => item.hashes).flat(),
      type: "fix",
      scope: "quote",
      message: "update or remove quotes reported by users",
      usernames: quoteReportCommits.map((item) => item.usernames).flat(),
      prs: quoteReportCommits.map((item) => item.prs).flat(),
    });
  }

  let final = "";

  final += header + "\n\n\n";

  const sections = [];
  for (const type of Object.keys(titles)) {
    const section = buildSection(type, log);
    if (section) {
      sections.push(section);
    }
  }

  final += sections.join("\n\n");

  final += "\n" + footer;

  console.log(final);
}

main();
