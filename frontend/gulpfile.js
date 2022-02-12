const { task, src, dest, series, watch } = require("gulp");
// const axios = require("axios");
const concat = require("gulp-concat");
const del = require("del");
const vinylPaths = require("vinyl-paths");
const eslint = require("gulp-eslint-new");
var sass = require("gulp-sass")(require("dart-sass"));
const replace = require("gulp-replace");
const through2 = require("through2");
const { webpack } = require("webpack");
const webpackDevConfig = require("./webpack.config.js");
const webpackProdConfig = require("./webpack-production.config.js");
// sass.compiler = require("dart-sass");

let eslintConfig = "../.eslintrc.json";
let tsEslintConfig = "../ts.eslintrc.json";

task("clean", function () {
  return src(["./public/"], { allowEmpty: true }).pipe(vinylPaths(del));
});

task("lint", function () {
  return src(["./src/js/**/*.js", "./src/js/**/*.ts"])
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
  return src("./src/sass/*.scss")
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
    "webpack-production",
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task("watch", function () {
  watch("./src/sass/**/*.scss", series("sass"));
  watch(["./src/js/**/*.js", "./src/js/**/*.ts"], series("lint", "webpack"));
  watch("./static/**/*.*", series("lint-json", "static"));
});

task("build", series("clean", "compile"));
task("build-production", series("clean", "compile-production"));
