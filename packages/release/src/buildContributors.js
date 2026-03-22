import dotenv from "dotenv";

dotenv.config();

const OWNER = "monkeytypegame";
const REPO = "monkeytype";

const EXCLUDED = new Set(["monkeytypegeorge", "miodec"]);

async function getContributors(page) {
  console.log("Getting contributors from page " + page);
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contributors?anon=1&per_page=100&page=${page}`,
    {
      method: "GET",
      headers: {
        "User-Agent": "monkeytypegame release script",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    },
  );
  return res.json();
}

async function main() {
  let total = [];
  let page = 1;
  let lastCount = 1;

  while (lastCount > 0) {
    const data = await getContributors(page);
    const contributors = data.map((c) => ({
      name: c.login ?? c.name,
      contributions: c.contributions,
    }));
    lastCount = contributors.length;
    page++;
    total.push(...contributors);
  }

  total = total
    .filter(
      (c) => !EXCLUDED.has(c.name?.toLowerCase()) && !c.name?.includes("[bot]"),
    )
    .sort((a, b) => b.contributions - a.contributions);

  // dedupe
  const seen = new Set();
  total = total.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  console.log(JSON.stringify(total.map((c) => c.name)));
}

main();
