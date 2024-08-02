import { execSync } from "child_process";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import readlineSync from "readline-sync";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const args = process.argv.slice(2);
const isFrontend = args.includes("--fe");
const noDeploy = args.includes("--no-deploy");
const isBackend = args.includes("--be");
const isDryRun = args.includes("--dry");

const runCommand = (command, force) => {
  if (isDryRun && !force) {
    console.log(`[Dry Run] Command: ${command}`);
    return "[Dry Run] Command executed.";
  } else {
    try {
      const output = execSync(command, { stdio: "pipe" }).toString();
      return output;
    } catch (error) {
      console.error(`Error executing command ${command}`);
      console.error(error);
      process.exit(1);
    }
  }
};

const checkBranchSync = () => {
  console.log("Checking if local master branch is in sync with origin...");

  if (isDryRun) {
    console.log("[Dry Run] Checking sync...");
  } else {
    try {
      // Fetch the latest changes from the remote repository
      runCommand("git fetch origin");

      // Get the commit hashes of the local and remote master branches
      const localMaster = runCommand("git rev-parse master").trim();
      const remoteMaster = runCommand("git rev-parse origin/master").trim();

      if (localMaster !== remoteMaster) {
        console.error(
          "Local master branch is not in sync with origin. Please pull the latest changes before proceeding."
        );
        process.exit(1);
      }
    } catch (error) {
      console.error("Error checking branch sync status.");
      console.error(error);
      process.exit(1);
    }
  }
};

const getCurrentVersion = () => {
  console.log("Getting current version...");
  const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
  return packageJson.version;
};

const incrementVersion = (currentVersion) => {
  console.log("Incrementing version...");
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  const [prevYear, prevWeek, minor] = currentVersion.split(".").map(Number);

  let newMinor = minor + 1;
  if (year != prevYear || week != prevWeek) {
    newMinor = 0;
  }

  const v = `v${year}.${week}.${newMinor}`;

  return v;
};

const updatePackage = (newVersion) => {
  console.log("Updating package.json...");
  if (isDryRun) {
    console.log(`[Dry Run] Updated package.json to version ${newVersion}`);
    return;
  }
  const packagePath = path.resolve(__dirname, "../package.json");

  // Read the package.json file
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  // Update the version field
  packageJson.version = newVersion.replace("v", "");

  // Write the updated JSON back to package.json
  fs.writeFileSync(
    packagePath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8"
  );

  console.log(`Updated package.json to version ${newVersion}`);
};

const checkUncommittedChanges = () => {
  console.log("Checking uncommitted changes...");
  const status = execSync("git status --porcelain").toString().trim();
  if (isDryRun) {
    console.log("[Dry Run] Checking uncommitted changes...");
  } else if (status) {
    console.error(
      "You have uncommitted changes. Please commit or stash them before proceeding."
    );
    process.exit(1);
  }
};

const buildProject = () => {
  console.log("Building project...");
  let filter = "";

  if (isFrontend && !isBackend) {
    filter = "--filter @monkeytype/frontend";
  } else if (isBackend && !isFrontend) {
    filter = "--filter @monkeytype/backend";
  }

  runCommand("npx turbo lint test validate-json build " + filter);
};

const deployBackend = () => {
  console.log("Deploying backend...");
  runCommand("sh ./bin/deployBackend.sh");
};

const deployFrontend = () => {
  console.log("Deploying frontend...");
  runCommand("cd frontend && npx firebase deploy -P live --only hosting");
};

const purgeCache = () => {
  console.log("Purging Cloudflare cache...");
  runCommand("sh ./bin/purgeCfCache.sh");
};

const generateChangelog = async () => {
  console.log("Generating changelog...");

  const changelog = runCommand("node bin/buildChangelog.mjs", true);

  return changelog;
};

const createCommitAndTag = (version) => {
  console.log("Creating commit and tag... Pushing to Github...");
  runCommand(`git add .`);
  runCommand(`git commit -m "chore: release ${version}" --no-verify`);
  runCommand(`git tag ${version}`);
  runCommand(`git push origin master --tags --no-verify`);
};

const createGithubRelease = async (version, changelogContent) => {
  console.log("Creating GitHub release...");
  if (isDryRun) {
    console.log(
      `[Dry Run] Sent release request to GitHub for version ${version}`
    );
  } else {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const { owner, repo } = {
      owner: "monkeytypegame",
      repo: "monkeytype",
    };
    await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: version,
      name: `${version}`,
      body: changelogContent,
    });
  }
};

const main = async () => {
  console.log("Starting release process...");

  checkBranchSync();

  checkUncommittedChanges();

  const changelogContent = await generateChangelog();

  console.log(changelogContent);

  if (!readlineSync.keyInYN("Changelog looks good?")) {
    console.log("Exiting.");
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  const newVersion = incrementVersion(currentVersion);

  buildProject();

  if (!readlineSync.keyInYN(`Ready to release ${newVersion}?`)) {
    console.log("Exiting.");
    process.exit(1);
  }

  if (!noDeploy && (isBackend || (!isFrontend && !isBackend))) {
    deployBackend();
  }

  if (!noDeploy && (isFrontend || (!isFrontend && !isBackend))) {
    deployFrontend();
  }

  if (!noDeploy) purgeCache();
  updatePackage(newVersion);
  createCommitAndTag(newVersion);
  await createGithubRelease(newVersion, changelogContent);

  console.log(`Release ${newVersion} completed successfully.`);
  process.exit(0);
};

main();
