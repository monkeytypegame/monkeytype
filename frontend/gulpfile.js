const { task, src, dest, series, watch, parallel } = require("gulp");
// const axios = require("axios");
const concat = require("gulp-concat");
const del = require("del");
const vinylPaths = require("vinyl-paths");
const eslint = require("gulp-eslint-new");
const sass = require("gulp-sass")(require("sass"));
const replace = require("gulp-replace");
const through2 = require("through2");
const esbuild = require("esbuild");
const esbuildConfig = require("./esbuild.config");
const babel = require("gulp-babel");
const babelConfig = require("./babel.config.json");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json", { noEmit: true });

const JSONValidation = require("./json-validation");

const eslintConfig = "../.eslintrc.json";

task("clean", function () {
  return src(["./public/"], { allowEmpty: true }).pipe(vinylPaths(del));
});

task("lint", function () {
  return src(["./src/scripts/**/*.js", "./src/scripts/**/*.ts"])
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

task("lint-json", function () {
  return src("./static/**/*.json")
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

task("validate-json-schema", function () {
  return JSONValidation.validateAll();
});

task("esbuild", async function () {
  const buildResult = await esbuild.build(esbuildConfig);

  console.log(
    `ESBuild compiled with ${buildResult.warnings.length} warnings and ${buildResult.errors.length} errors.`
  );

  if (buildResult.errors.length !== 0) {
    throw new Error("ESBuild failed.");
  }
});

task("esbuild-production", async function () {
  const buildResult = await esbuild.build(esbuildConfig);

  console.log(
    `ESBuild compiled with ${buildResult.warnings.length} warnings and ${buildResult.errors.length} errors.`
  );

  if (buildResult.errors.length !== 0) {
    throw new Error("ESBuild failed.");
  }
});

task("babel", function () {
  return src("./public/js/monkeytype.js")
    .pipe(babel(babelConfig))
    .pipe(dest("./public/js"));
});

task("typescript", function () {
  return tsProject.src().pipe(tsProject(ts.reporter.defaultReporter()));
});

task("static", function () {
  return src("./static/**/*", { dot: true }).pipe(dest("./public/"));
});

task("sass", function () {
  return src("./src/styles/*.scss")
    .pipe(concat("style.scss"))
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(dest("public/css"));
});

task("updateSwCacheName", function () {
  const date = new Date();
  const dateString =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1) +
    "-" +
    date.getDate() +
    "-" +
    date.getHours() +
    "-" +
    date.getMinutes() +
    "-" +
    date.getSeconds();

  return src(["static/sw.js"])
    .pipe(
      replace(
        /const staticCacheName = .*;/g,
        `const staticCacheName = "sw-cache-${dateString}";`
      )
    )
    .pipe(
      through2.obj(function (file, enc, cb) {
        const date = new Date();
        file.stat.atime = date;
        file.stat.mtime = date;
        cb(null, file);
      })
    )
    .pipe(dest("./public/"));
});

task(
  "compile",
  series(
    "lint",
    "lint-json",
    parallel("typescript", "esbuild"),
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task(
  "compile-production",
  series(
    "lint",
    "lint-json",
    "validate-json-schema",
    "typescript",
    "esbuild-production",
    "babel",
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task("watch", function () {
  watch("./src/styles/*.scss", series("sass"));
  watch(
    [
      "./src/scripts/**/*.js",
      "./src/scripts/**/*.ts",
      "./src/scripts/*.js",
      "./src/scripts/*.ts",
    ],
    series("lint", parallel("typescript", "esbuild"))
  );
  watch(["./static/**/*.*", "./static/*.*"], series("lint-json", "static"));
});

task("build", series("clean", "compile"));

task("build-production", series("clean", "compile-production"));

//PR CHECK

task("validate-quote-json-schema", function () {
  return JSONValidation.validateQuotes();
});

task("validate-language-json-schema", function () {
  return JSONValidation.validateLanguages();
});

task("validate-other-json-schema", function () {
  return JSONValidation.validateOthers();
});

task("pr-check-lint-json", series("lint-json"));
task("pr-check-quote-json", series("validate-quote-json-schema"));
task("pr-check-language-json", series("validate-language-json-schema"));
task("pr-check-other-json", series("validate-other-json-schema"));

task("pr-check-lint", series("lint"));
task("pr-check-scss", series("sass"));

task("pr-check-ts", series("esbuild-production"));
