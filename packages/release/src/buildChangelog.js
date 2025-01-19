import { exec } from "child_process";

// const stream = conventionalChangelog(
//   {
//     preset: {
//       name: "conventionalcommits",
//       types: [
//         { type: "feat", section: "Features" },
//         { type: "impr", section: "Improvements" },
//         { type: "fix", section: "Fixes" },
//       ],
//     },
//   },
//   undefined,
//   undefined,
//   undefined,
//   {
//     headerPartial: "",
//   }
// );

// let log = "";
// for await (const chunk of stream) {
//   log += chunk;
// }

// log = log.replace(/^\*/gm, "-");

// console.log(log);

// console.log(header + log + footer);
//i might come back to the approach below at some point

const lineDelimiter =
  "thisismylinedelimiterthatwilldefinitelynotappearintheactualcommitmessage";
const logDelimiter =
  "thisismylogdelimiterthatwilldefinitelynotappearintheactualcommitmessage";

async function getLog() {
  function execPromise(command) {
    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, _stderr) => {
        if (err) reject(err);
        resolve(stdout);
      });
    });
  }

  return execPromise(`git describe --tags --abbrev=0 HEAD^`).then((lastTag) =>
    execPromise(
      `git log --oneline ${lastTag.trim()}..HEAD --pretty="format:${lineDelimiter}%H${logDelimiter}%h${logDelimiter}%s${logDelimiter}%b"`
    )
  );
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
    item.message.includes("report") || item.message.includes("reports");

  return scopeIsQuote && messageReport;
}

const titles = {
  feat: "Features",
  impr: "Improvements",
  fix: "Fixes",
};

function getPrLink(pr) {
  const prNum = pr.replace("#", "");
  return `[#${prNum}](https://github.com/monkeytypegame/monkeytype/pull/${prNum})`;
}

function getCommitLink(hash, longHash) {
  return `[${hash}](https://github.com/monkeytypegame/monkeytype/commit/${longHash})`;
}

function buildItems(items, mergeTypeAndScope = false) {
  let ret = "";
  for (let item of items) {
    let scope = item.scope ? `**${item.scope}:** ` : "";

    if (mergeTypeAndScope) {
      scope = `**${item.type}${item.scope ? `(${item.scope})` : ""}:** `;
    }

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

function buildSection(type, allItems) {
  let ret = `### ${titles[type]}\n\n`;

  const items = allItems.filter(
    (item) => item.type === type && !item.body.includes("!nuf")
  );

  if (items.length === 0) {
    return "";
  }

  return (ret += buildItems(items));
}

function buildFooter(logs) {
  let out =
    "\n### Nerd stuff\n\nThese changes will not be visible to users, but are included for completeness and to credit contributors.\n\n";

  const featLogs = logs.filter(
    (item) => item.type === "feat" && item.body.includes("!nuf")
  );
  const imprLogs = logs.filter(
    (item) => item.type === "impr" && item.body.includes("!nuf")
  );
  const fixLogs = logs.filter(
    (item) => item.type === "fix" && item.body.includes("!nuf")
  );
  const styleLogs = logs.filter((item) => item.type === "style");
  const docLogs = logs.filter((item) => item.type === "docs");
  const refactorLogs = logs.filter((item) => item.type === "refactor");
  const perfLogs = logs.filter((item) => item.type === "perf");
  const ciLogs = logs.filter((item) => item.type === "ci");
  const testLogs = logs.filter((item) => item.type === "test");
  const buildLogs = logs.filter((item) => item.type === "build");
  const choreLogs = logs.filter((item) => item.type === "chore");

  const allOtherLogs = [
    ...featLogs,
    ...imprLogs,
    ...fixLogs,
    ...styleLogs,
    ...docLogs,
    ...refactorLogs,
    ...perfLogs,
    ...ciLogs,
    ...testLogs,
    ...buildLogs,
    ...choreLogs,
  ];

  //remove dupes based on hash
  const uniqueOtherLogs = allOtherLogs.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.hashes[0].full === item.hashes[0].full)
  );

  // console.log(uniqueOtherLogs);

  out += buildItems(uniqueOtherLogs, true);

  return out;
}

// function buildFooter(logs) {
//   const styleLogs = logs.filter((item) => item.type === "style");
//   const docLogs = logs.filter((item) => item.type === "docs");
//   const refactorLogs = logs.filter((item) => item.type === "refactor");
//   const perfLogs = logs.filter((item) => item.type === "perf");
//   const ciLogs = logs.filter((item) => item.type === "ci");
//   const testLogs = logs.filter((item) => item.type === "test");
//   const buildLogs = logs.filter((item) => item.type === "build");

//   const otherStrings = [];

//   if (styleLogs.length > 0) {
//     otherStrings.push("style");
//   }
//   if (docLogs.length > 0) {
//     otherStrings.push("documentation");
//   }
//   if (refactorLogs.length > 0) {
//     otherStrings.push("refactoring");
//   }
//   if (perfLogs.length > 0) {
//     otherStrings.push("performance");
//   }
//   if (ciLogs.length > 0) {
//     otherStrings.push("CI");
//   }
//   if (testLogs.length > 0) {
//     otherStrings.push("testing");
//   }
//   if (buildLogs.length > 0) {
//     otherStrings.push("build");
//   }

//   if (otherStrings.length === 0) {
//     return "";
//   }

//   //build a string where otherStrings are joined by commas and the last one is joined by "and"
//   const finalString =
//     otherStrings.length > 1
//       ? otherStrings.slice(0, -1).join(", ") + " and " + otherStrings.slice(-1)
//       : otherStrings[0];

//   return `\n### Other\n\n- Various ${finalString} changes`;
// }

function convertStringToLog(logString) {
  let log = [];
  for (let line of logString) {
    if (line === "" || line === "\r" || line === "\n") continue;
    // console.log(line);

    //split line based on the format: d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 style: adjusted testConfig and modesNotice.
    //use regex to split
    // const [_, hash, shortHash, fullMessage] = line.split(
    //   /(\w{40}) (\w{9,10}) (.*)/
    // );

    const [hash, shortHash, title, body] = line
      .split(logDelimiter)
      .map((s) => s.trim());

    // console.log({
    //   hash,
    //   shortHash,
    //   title,
    //   body,
    // });

    //split message using regex based on fix(language): spelling mistakes in Nepali wordlist and quotes (sapradhan) (#4528)
    //scope is optional, username is optional, pr number is optional
    const [_, type, scope, message, username, pr] = title.split(
      /^(\w+)(?:\(([^)]+)\))?:\s+(.+?)(?:\s*\((@[^)]+)\))?(?:\s+\((#[^)]+)\))?$/
    );

    const usernames = username ? username.split(", ") : [];
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
        usernames: usernames || [],
        prs: prs || [],
        body: body || "",
      });
    } else {
      // console.log({ hash, shortHash, title, body });
      // console.warn("skipping line due to invalid format: " + line);
    }
  }
  return log;
}

const header =
  "Thank you to all the contributors who made this release possible!";

async function main() {
  let logString = await getLog();
  logString = logString.split(lineDelimiter);

  //test commits
  // const logString = [
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 build: add new feature (miodec, someone) (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 build(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 chore: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 chore(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 ci: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 ci(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 docs: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 docs(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 feat: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 feat(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 impr: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 impr(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 fix: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 fix(score): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 perf: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 perf(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 refactor: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 refactor(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 revert: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 revert(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 style: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 style(scope): add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 test: add new feature (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c106 d2739e4f1 test(scope): add new feature (#1234)",
  // ];

  //test commits
  // logString = [
  //   "d2739e4f193137db4d86450f0d50b3489d75c101 d2739e4f1 fix: add new fix (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c102 d2739e4f1 fix(nuf something): add new fix nuf (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c103 d2739e4f1 test: add new test (#1234)",
  //   "d2739e4f193137db4d86450f0d50b3489d75c104 d2739e4f1 test(blah): add new test blah (#1234)",
  // ];

  let log = convertStringToLog(logString);

  const contributorCount = log
    .map((l) => {
      const filtered = l.usernames.filter((u) => {
        const lowerCased = u.toLowerCase();
        return (
          lowerCased !== "monkeytype-bot" &&
          lowerCased !== "dependabot" &&
          lowerCased !== "miodec"
        );
      });
      return filtered;
    })
    .flat().length;

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
      body: "",
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
      body: "",
    });
  }

  let final = "";

  if (contributorCount > 0) {
    final += header + "\n\n\n";
  }

  const sections = [];
  for (const type of Object.keys(titles)) {
    const section = buildSection(type, log);
    if (section) {
      sections.push(section);
    }
  }

  final += sections.join("\n\n");

  const footer = buildFooter(log);
  if (footer) {
    final += "\n" + footer;
  }

  console.log(final);
}

main();
