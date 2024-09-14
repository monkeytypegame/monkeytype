const esbuild = require("esbuild");
const { readdirSync, statSync } = require("fs");
const { join, extname } = require("path");
const chokidar = require("chokidar");

//check if watch parameter is passed
const isWatch = process.argv.includes("--watch");

// Recursive function to get all .ts files in a directory
const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (extname(file) === ".ts") {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
};

// Get all TypeScript files from the src directory and subdirectories
const entryPoints = getAllFiles("./src");

// Function to generate output file names
const getOutfile = (entryPoint, format) => {
  const relativePath = entryPoint.replace(/src[/\\]/, "");
  const fileBaseName = relativePath.replace(".ts", "");
  return `./dist/${fileBaseName}.${format === "esm" ? "mjs" : "cjs"}`;
};

// Common build settings
const commonSettings = {
  bundle: true,
  sourcemap: true,
  minify: true,
};

function buildAll(silent, stopOnError) {
  console.log("Building all files...");
  entryPoints.forEach((entry) => {
    build(entry, silent, stopOnError);
  });
}

function build(entry, silent, stopOnError) {
  if (!silent) console.log("Building", entry);

  // ESM build
  esbuild
    .build({
      ...commonSettings,
      entryPoints: [entry],
      format: "esm",
      outfile: getOutfile(entry, "esm"),
    })
    .catch((e) => {
      console.log(`Failed to build ${entry} to ESM:`, e);
      if (stopOnError) process.exit(1);
    });

  // CommonJS build
  esbuild
    .build({
      ...commonSettings,
      entryPoints: [entry],
      format: "cjs",
      outfile: getOutfile(entry, "cjs"),
    })
    .catch((e) => {
      console.log(`Failed to build ${entry} to CJS:`, e);
      if (stopOnError) process.exit(1);
    });
}

if (isWatch) {
  buildAll(true, false);
  console.log("Starting watch mode...");
  chokidar.watch("./src/**/*.ts").on(
    "change",
    (_path) => {
      console.log("File change detected...");
      // build(path, false, false);
      buildAll(false, false);
    },
    {
      ignoreInitial: true,
    }
  );
} else {
  buildAll(false, true);
}
