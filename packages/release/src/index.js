import { Octokit } from "@octokit/rest";
import { execSync } from "child_process";
import dotenv from "dotenv";
import fs, { readFileSync } from "fs";
import readlineSync from "readline-sync";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const args = new Set(process.argv.slice(2));
const isFrontend = args.has("--fe");
const noDeploy = args.has("--no-deploy");
const isBackend = args.has("--be");
const isDryRun = args.has("--dry");
const noSyncCheck = args.has("--no-sync-check");
const hotfix = args.has("--hotfix");
const previewFe = args.has("--preview-fe");

const PROJECT_ROOT = path.resolve(__dirname, "../../../");

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
      console.error(error.output.toString());
      process.exit(1);
    }
  }
};

const runProjectRootCommand = (command, force) => {
  if (isDryRun && !force) {
    console.log(`[Dry Run] Command: ${command}`);
    return "[Dry Run] Command executed.";
  } else {
    try {
      const output = execSync(`cd ${PROJECT_ROOT} && ${command}`, {
        stdio: "pipe",
      }).toString();
      return output;
    } catch (error) {
      console.error(`Error executing command ${command}`);
      console.error(error);
      process.exit(1);
    }
  }
};

const checkBranchSync = () => {
  console.log("Checking if local branch is master...");
  const currentBranch = runProjectRootCommand(
    "git branch --show-current",
  ).trim();
  if (currentBranch !== "master") {
    console.error(
      "Local branch is not master. Please checkout the master branch.",
    );
    process.exit(1);
  }

  console.log("Checking if local master branch is in sync with origin...");

  if (noSyncCheck) {
    console.log("Skipping sync check.");
  } else if (isDryRun) {
    console.log("[Dry Run] Checking sync...");
  } else {
    try {
      // Fetch the latest changes from the remote repository
      runProjectRootCommand("git fetch origin");

      // Get the commit hashes of the local and remote master branches
      const localMaster = runProjectRootCommand("git rev-parse master").trim();
      const remoteMaster = runProjectRootCommand(
        "git rev-parse origin/master",
      ).trim();

      if (localMaster !== remoteMaster) {
        console.error(
          "Local master branch is not in sync with origin. Please pull the latest changes before proceeding.",
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

  const rootPackageJson = JSON.parse(
    readFileSync(`${PROJECT_ROOT}/package.json`, "utf-8"),
  );

  return rootPackageJson.version;
};

const incrementVersion = (currentVersion) => {
  console.log("Incrementing version...");
  const now = new Date();
  const year = Number(now.getFullYear().toString().slice(-2));
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  const [prevYear, prevWeek, minor] = currentVersion.split(".").map(Number);

  let newMinor = minor + 1;
  if (year !== prevYear || week !== prevWeek) {
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
  const packagePath = `${PROJECT_ROOT}/package.json`;

  // Read the package.json file
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  // Update the version field
  packageJson.version = newVersion.replace("v", "");

  // Write the updated JSON back to package.json
  fs.writeFileSync(
    packagePath,
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf8",
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
      "You have uncommitted changes. Please commit or stash them before proceeding.",
    );
    process.exit(1);
  }
};

const installDependencies = () => {
  console.log("Installing dependencies...");
  if (isDryRun) {
    console.log("[Dry Run] Dependencies would be installed.");
  } else {
    runProjectRootCommand("pnpm i");
  }
};

const buildProject = () => {
  console.log("Building project...");

  if (isFrontend && !isBackend) {
    runProjectRootCommand(
      "NODE_ENV=production SENTRY=1 npx turbo lint test check-assets build --filter @monkeytype/frontend --force",
    );
  } else if (isBackend && !isFrontend) {
    runProjectRootCommand(
      "NODE_ENV=production SENTRY=1 npx turbo lint test build --filter @monkeytype/backend --force",
    );
  } else {
    runProjectRootCommand(
      "NODE_ENV=production SENTRY=1 npx turbo lint test check-assets build --force",
    );
  }
};

const deployBackend = () => {
  console.log("Deploying backend...");
  const p = path.resolve(__dirname, "../bin/deployBackend.sh");
  runCommand(`sh ${p}`);
};

const deployFrontend = () => {
  console.log("Deploying frontend...");
  runProjectRootCommand(
    "cd frontend && npx firebase deploy -P live --only hosting",
  );
};

const purgeCache = () => {
  console.log("Purging Cloudflare cache...");
  const p = path.resolve(__dirname, "../bin/purgeCfCache.sh");
  runCommand(`sh ${p}`);
};

const generateChangelog = async () => {
  console.log("Generating changelog...");

  const p = path.resolve(__dirname, "./buildChangelog.js");

  const changelog = runCommand(`node ${p}`, true);

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
      `[Dry Run] Sent release request to GitHub for version ${version}`,
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
  if (previewFe) {
    console.log(`Starting frontend preview deployment process...`);
    installDependencies();
    runProjectRootCommand(
      "NODE_ENV=production npx turbo lint test check-assets build --filter @monkeytype/frontend --force",
    );

    const name = readlineSync.question(
      "Enter preview channel name (default: preview): ",
    );
    let channelName = name.trim();

    if (channelName === "") {
      channelName = "preview";
    }

    const expirationTime = readlineSync.question(
      "Enter expiration time (e.g., 2h, default: 1d): ",
    );
    let expires = expirationTime.trim();

    if (expires === "") {
      expires = "1d";
    }

    console.log(
      `Deploying frontend preview to channel "${channelName}" with expiration "${expires}"...`,
    );
    const result = runProjectRootCommand(
      `cd frontend && npx firebase hosting:channel:deploy ${channelName} -P live --expires ${expires}`,
    );
    console.log(result);
    console.log("Frontend preview deployed successfully.");
    process.exit(0);
  }

  console.log(`Starting ${hotfix ? "hotfix" : "release"} process...`);

  if (!hotfix) checkBranchSync();

  checkUncommittedChanges();

  installDependencies();

  let changelogContent;
  let newVersion;
  if (!hotfix) {
    changelogContent = await generateChangelog();

    console.log(changelogContent);

    if (!readlineSync.keyInYN("Changelog looks good?")) {
      console.log("Exiting.");
      process.exit(1);
    }

    const currentVersion = getCurrentVersion();
    newVersion = incrementVersion(currentVersion);
    console.log(`New version: ${newVersion}`);
  }
  buildProject();

  if (!hotfix && !readlineSync.keyInYN(`Ready to release ${newVersion}?`)) {
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
  if (!hotfix) {
    updatePackage(newVersion);
    createCommitAndTag(newVersion);
    try {
      await createGithubRelease(newVersion, changelogContent);
    } catch (e) {
      console.error(`Failed to create release on GitHub: ${e}`);
      console.log("Please create the release manually.");
    }
  }

  if (hotfix) {
    console.log("Hotfix completed successfully.");
  } else {
    console.log(`Release ${newVersion} completed successfully.`);
  }
  process.exit(0);
};

main();
