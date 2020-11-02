const { task, src, dest, series, watch } = require("gulp");
const concat = require("gulp-concat");
const del = require("del");
const vinylPaths = require("vinyl-paths");

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

task("dist", function () {
  return src("./static/**/*").pipe(dest("public/"));
});

task("clean", function () {
  return src("./public/").pipe(vinylPaths(del));
});

task("build", series("dist", "cat"));

task("watch", function () {
  watch(["./static/**/*", ...gulpSrc], series("build"));
});

task("rebuild", series("clean", "build"));
