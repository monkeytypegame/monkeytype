const { task, src, dest, series, watch } = require("gulp");
// const axios = require("axios");
const concat = require("gulp-concat");
const del = require("del");
const vinylPaths = require("vinyl-paths");
const eslint = require("gulp-eslint-new");
const sass = require("gulp-sass")(require("dart-sass"));
const replace = require("gulp-replace");
const through2 = require("through2");
const { webpack } = require("webpack");
const webpackDevConfig = require("./webpack.config.js");
const webpackProdConfig = require("./webpack-production.config.js");
const ts = require("gulp-typescript");

const JSONValidation = require("./json-validation");

const eslintConfig = "../.eslintrc.json";
const tsProject = ts.createProject("tsconfig.json");

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

task("copy-src-contents", function () {
  return src("./src/scripts/**").pipe(dest("./dist/"));
});

task("transpile-ts", function () {
  return tsProject.src().pipe(tsProject()).js.pipe(dest("dist"));
});

task("webpack", async function () {
  return new Promise((resolve, reject) => {
    webpack(webpackDevConfig, (err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats.hasErrors()) {
        return reject(new Error(stats.compilation.errors.join("\n")));
      }
      resolve();
    });
  });
});

task("webpack-production", async function () {
  return new Promise((resolve, reject) => {
    webpack(webpackProdConfig, (err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats.hasErrors()) {
        return reject(new Error(stats.compilation.errors.join("\n")));
      }
      resolve();
    });
  });
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
  series("lint", "lint-json", "webpack", "static", "sass", "updateSwCacheName")
);

task(
  "compile-production",
  series(
    "lint",
    "lint-json",
    "validate-json-schema",
    "webpack-production",
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
    series("lint", "webpack")
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

task("pr-check-ts", series("webpack-production"));
