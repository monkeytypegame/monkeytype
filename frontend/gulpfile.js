const { task, src, dest, series, watch } = require("gulp");
// const axios = require("axios");
const browserify = require("browserify");
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
const tsify = require("tsify");
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

task("browserify", function () {
  const b = browserify({
    entries: "./src/js/index.js",
    //a source map isn't very useful right now because
    //the source files are concatenated together
    debug: false,
  });
  let ret = b
    .transform(
      babelify.configure({
        presets: ["@babel/preset-env"],
        plugins: ["@babel/transform-runtime"],
      })
    )
    .plugin(tsify)
    .bundle()
    .pipe(source("monkeytype.js"))
    .pipe(buffer());

  if (process.argv[4] === "production") {
    ret = ret.pipe(
      uglify({
        mangle: false,
      })
    );
  }

  ret = ret.pipe(dest("./public/js"));
  return ret;
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
  series(
    "lint",
    "lint-json",
    "browserify",
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task("watch", function () {
  watch("./src/sass/**/*.scss", series("sass"));
  watch(["./src/js/**/*.js", "./src/js/**/*.ts"], series("lint", "browserify"));
  watch("./static/**/*.*", series("lint-json", "static"));
});

task("build", series("clean", "compile"));
