const { task, src, dest, series, watch } = require("gulp");
// const axios = require("axios");
const babelify = require("babelify");
const concat = require("gulp-concat");
const del = require("del");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const vinylPaths = require("vinyl-paths");
const eslint = require("gulp-eslint-new");
var sass = require("gulp-sass")(require("dart-sass"));
const replace = require("gulp-replace");
const uglify = require("gulp-uglify");
const through2 = require("through2");
const { webpack } = require("webpack");
const webpackStream = require("webpack-stream");
const path = require("path");
const webpackConfig = require("./webpack.config.js");
// sass.compiler = require("dart-sass");

let eslintConfig = "../.eslintrc.json";

task("clean", function () {
  return src(["./public/"], { allowEmpty: true }).pipe(vinylPaths(del));
});

task("lint-js", function () {
  return src("./src/js/**/*.js")
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
  return src("./src/js/index.js")
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe(dest("./public/js"));
});

task("webpack-production", async function () {
  return src("./src/js/index.js")
    .pipe(webpackStream({ ...webpackConfig, mode: "production" }), webpack)
    .pipe(dest("./public/js"));
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
  let date = new Date();
  let dateString =
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
        var date = new Date();
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
    "lint-js",
    "lint-json",
    "webpack",
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task(
  "compile-production",
  series(
    "lint-js",
    "lint-json",
    "webpack-production",
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task("watch", function () {
  watch("./src/sass/**/*.scss", series("sass"));
  watch("./src/js/**/*.js", series("lint-js", "webpack"));
  watch("./static/**/*.*", series("lint-json", "static"));
});

task("build", series("clean", "compile"));
task("build-production", series("clean", "compile-production"));
