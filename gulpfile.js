const { task, src, dest, series, watch } = require("gulp");
const concat = require("gulp-concat");
const del = require("del");
const vinylPaths = require("vinyl-paths");
var sass = require("gulp-sass");
sass.compiler = require("dart-sass");

const gulpSrc = [
  "src/js/misc.js",
  "src/js/words.js",
  "src/js/layouts.js",
  "src/js/db.js",
  "src/js/userconfig.js",
  "src/js/commandline.js",
  "src/js/leaderboards.js",
  "src/js/settings.js",
  "src/js/account.js",
  "src/js/script.js",
];

task("cat", function () {
  return src(gulpSrc).pipe(concat("monkeytype.js")).pipe(dest("public/js"));
});

task("sass", function () {
  return src("src/sass/*.scss")
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(dest("public/css"));
});

task("dist", function () {
  return src("./static/**/*").pipe(dest("public/"));
});

task("clean", function () {
  return src("./public/", { allowEmpty: true }).pipe(vinylPaths(del));
});

task("build", series("dist", "sass", "cat"));

task("watch", function () {
  watch(["./static/**/*", ...gulpSrc], series("build"));
});

task("rebuild", series("clean", "build"));
