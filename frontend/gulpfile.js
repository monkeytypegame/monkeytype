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
const moment = require("moment");
// sass.compiler = require("dart-sass");

let eslintConfig = "../.eslintrc.json";
let tsEslintConfig = "../ts.eslintrc.json";

task("clean", function () {
  return src(["./public/"], { allowEmpty: true }).pipe(vinylPaths(del));
});

task("lint-js", function () {
  return src("./src/js/**/*.js")
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

task("lint-ts", function () {
  return src("./src/ts/**/*.ts")
    .pipe(eslint(tsEslintConfig))
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
  return b
    .transform(
      babelify.configure({
        presets: ["@babel/preset-env"],
        plugins: ["@babel/transform-runtime"],
      })
    )
    .bundle()
    .pipe(source("monkeytype.js"))
    .pipe(buffer())
    .pipe(
      uglify({
        mangle: false,
      })
    )
    .pipe(dest("./public/js"));
});

task("browserify-ts", function () {
  const b = browserify({
    entries: "./src/ts/index.ts",
    //a source map isn't very useful right now because
    //the source files are concatenated together
    //a source map will most likely be useful for ts
    debug: false,
  });
  return (
    b
      // .transform(
      //   babelify.configure({
      //     presets: ["@babel/preset-env"],
      //     plugins: ["@babel/transform-runtime"],
      //   })
      // )
      .plugin(tsify)
      .bundle()
      .pipe(source("monkeytype.js"))
      .pipe(buffer())
      .pipe(
        uglify({
          mangle: false,
        })
      )
      .pipe(dest("./public/js"))
  );
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
  // let date = new Date();
  // let dateString =
  //   date.getFullYear() +
  //   "-" +
  //   (date.getMonth() + 1) +
  //   "-" +
  //   date.getDate() +
  //   "-" +
  //   date.getHours() +
  //   "-" +
  //   date.getMinutes() +
  //   "-" +
  //   date.getSeconds();

  let dateString = moment().format("YYYY-MM-DD-hh-mm-ss");
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
    "browserify",
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task(
  "compile-ts",
  series(
    "lint-ts",
    "lint-json",
    "browserify-ts",
    "static",
    "sass",
    "updateSwCacheName"
  )
);

task("watch", function () {
  watch("./src/sass/**/*.scss", series("sass"));
  watch("./src/js/**/*.js", series("lint-js", "browserify"));
  watch("./static/**/*.*", series("lint-json", "static"));
});

task("watch-ts", function () {
  watch("./src/sass/**/*.scss", series("sass"));
  watch("./src/ts/**/*.ts", series("lint-ts", "browserify-ts"));
  watch("./static/**/*.*", series("lint-json", "static"));
});

task("build", series("clean", "compile"));

task("build-ts", series("clean", "compile-ts"));
