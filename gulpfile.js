const { task, src, dest, series, watch } = require("gulp");
const concat = require("gulp-concat");
const del = require("del");
const vinylPaths = require("vinyl-paths");
var sass = require("gulp-sass");
sass.compiler = require("dart-sass");

//the order of files is important
const gulpSrc = [
  "./src/js/misc.js",
  "./src/js/words.js",
  "./src/js/layouts.js",
  "./src/js/db.js",
  "./src/js/userconfig.js",
  "./src/js/commandline.js",
  "./src/js/leaderboards.js",
  "./src/js/settings.js",
  "./src/js/account.js",
  "./src/js/script.js",
];

task("cat", function () {
  return src(gulpSrc).pipe(concat("monkeytype.js")).pipe(dest("./dist/js"));
});

task("sass", function () {
  return src("./src/sass/*.scss")
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(dest("dist/css"));
});

task("static", function () {
  return src("./public/**/*").pipe(dest("./dist/"));
});

task("clean", function () {
  return src("./dist/", { allowEmpty: true }).pipe(vinylPaths(del));
});

task("build", series("static", "sass", "cat"));

task("watch", function () {
  watch(["./public/**/*", "./src/**/*"], series("build"));
});

task("rebuild", series("clean", "build"));
