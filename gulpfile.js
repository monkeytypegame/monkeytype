const { task, src, dest, series, watch } = require("gulp");
const axios = require("axios");
const browserify = require("browserify");
const babelify = require("babelify");
const concat = require("gulp-concat");
const del = require("del");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const vinylPaths = require("vinyl-paths");
const eslint = require("gulp-eslint");
var sass = require("gulp-sass")(require("dart-sass"));
// sass.compiler = require("dart-sass");

let eslintConfig = {
  parser: "babel-eslint",
  globals: [
    "jQuery",
    "$",
    "firebase",
    "moment",
    "html2canvas",
    "ClipboardItem",
  ],
  envs: ["es6", "browser", "node"],
  plugins: ["json"],
  extends: ["plugin:json/recommended"],
  rules: {
    "json/*": ["error"],
    "constructor-super": "error",
    "for-direction": "error",
    "getter-return": "error",
    "no-async-promise-executor": "error",
    "no-case-declarations": "error",
    "no-class-assign": "error",
    "no-compare-neg-zero": "error",
    "no-cond-assign": "error",
    "no-const-assign": "error",
    "no-constant-condition": "error",
    "no-control-regex": "error",
    "no-debugger": "error",
    "no-delete-var": "error",
    "no-dupe-args": "error",
    "no-dupe-class-members": "error",
    "no-dupe-else-if": "warn",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-empty": ["warn", { allowEmptyCatch: true }],
    "no-empty-character-class": "error",
    "no-empty-pattern": "error",
    "no-ex-assign": "error",
    "no-extra-boolean-cast": "error",
    "no-extra-semi": "error",
    "no-fallthrough": "error",
    "no-func-assign": "error",
    "no-global-assign": "error",
    "no-import-assign": "error",
    "no-inner-declarations": "error",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "warn",
    "no-misleading-character-class": "error",
    "no-mixed-spaces-and-tabs": "error",
    "no-new-symbol": "error",
    "no-obj-calls": "error",
    "no-octal": "error",
    "no-prototype-builtins": "error",
    "no-redeclare": "error",
    "no-regex-spaces": "error",
    "no-self-assign": "error",
    "no-setter-return": "error",
    "no-shadow-restricted-names": "error",
    "no-sparse-arrays": "error",
    "no-this-before-super": "error",
    "no-undef": "error",
    "no-unexpected-multiline": "warn",
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "no-unused-labels": "error",
    "no-unused-vars": ["warn", { argsIgnorePattern: "e|event" }],
    "no-use-before-define": "warn",
    "no-useless-catch": "error",
    "no-useless-escape": "error",
    "no-with": "error",
    "require-yield": "error",
    "use-isnan": "error",
    "valid-typeof": "error",
  },
};

//refactored files, which should be es6 modules
//once all files are moved here, then can we use a bundler to its full potential
const refactoredSrc = [
  "./src/js/axios-instance.js",
  "./src/js/db.js",
  "./src/js/misc.js",
  "./src/js/layouts.js",
  "./src/js/sound.js",
  "./src/js/theme-colors.js",
  "./src/js/chart-controller.js",
  "./src/js/theme-controller.js",
  "./src/js/config.js",
  "./src/js/tag-controller.js",
  "./src/js/preset-controller.js",
  "./src/js/ui.js",
  "./src/js/commandline.js",
  "./src/js/commandline-lists.js",
  "./src/js/commandline.js",
  "./src/js/challenge-controller.js",
  "./src/js/mini-result-chart.js",
  "./src/js/account-controller.js",
  "./src/js/simple-popups.js",
  "./src/js/settings.js",
  "./src/js/input-controller.js",
  "./src/js/route-controller.js",
  "./src/js/ready.js",
  "./src/js/monkey-power.js",

  "./src/js/account/all-time-stats.js",
  "./src/js/account/pb-tables.js",
  "./src/js/account/result-filters.js",
  "./src/js/account/verification-controller.js",
  "./src/js/account.js",

  "./src/js/elements/monkey.js",
  "./src/js/elements/notifications.js",
  "./src/js/elements/leaderboards.js",
  "./src/js/elements/account-button.js",
  "./src/js/elements/loader.js",
  "./src/js/elements/sign-out-button.js",
  "./src/js/elements/about-page.js",
  "./src/js/elements/psa.js",
  "./src/js/elements/new-version-notification.js",

  "./src/js/popups/custom-text-popup.js",
  "./src/js/popups/pb-tables-popup.js",
  "./src/js/popups/quote-search-popup.js",
  "./src/js/popups/rate-quote-popup.js",
  "./src/js/popups/version-popup.js",
  "./src/js/popups/support-popup.js",
  "./src/js/popups/custom-word-amount-popup.js",
  "./src/js/popups/custom-test-duration-popup.js",
  "./src/js/popups/word-filter-popup.js",
  "./src/js/popups/result-tags-popup.js",
  "./src/js/popups/edit-tags-popup.js",
  "./src/js/popups/edit-preset-popup.js",
  "./src/js/popups/custom-theme-popup.js",
  "./src/js/popups/import-settings-popup.js",
  "./src/js/popups/custom-background-filter.js",

  "./src/js/settings/language-picker.js",
  "./src/js/settings/theme-picker.js",
  "./src/js/settings/settings-group.js",

  "./src/js/test/custom-text.js",
  "./src/js/test/british-english.js",
  "./src/js/test/lazy-mode.js",
  "./src/js/test/shift-tracker.js",
  "./src/js/test/out-of-focus.js",
  "./src/js/test/caret.js",
  "./src/js/test/manual-restart-tracker.js",
  "./src/js/test/test-stats.js",
  "./src/js/test/focus.js",
  "./src/js/test/practise-words.js",
  "./src/js/test/test-ui.js",
  "./src/js/test/keymap.js",
  "./src/js/test/live-wpm.js",
  "./src/js/test/caps-warning.js",
  "./src/js/test/live-acc.js",
  "./src/js/test/live-burst.js",
  "./src/js/test/timer-progress.js",
  "./src/js/test/test-logic.js",
  "./src/js/test/funbox.js",
  "./src/js/test/pace-caret.js",
  "./src/js/test/pb-crown.js",
  "./src/js/test/test-timer.js",
  "./src/js/test/test-config.js",
  "./src/js/test/layout-emulator.js",
  "./src/js/test/poetry.js",
  "./src/js/test/today-tracker.js",
  "./src/js/test/weak-spot.js",
  "./src/js/test/wordset.js",
  "./src/js/test/tts.js",
  "./src/js/replay.js",
];

//legacy files
//the order of files is important
const globalSrc = ["./src/js/global-dependencies.js", "./src/js/exports.js"];

//concatenates and lints legacy js files and writes the output to dist/gen/index.js
task("cat", function () {
  return src(globalSrc)
    .pipe(concat("index.js"))
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(dest("./dist/gen"));
});

task("sass", function () {
  return src("./src/sass/*.scss")
    .pipe(concat("style.scss"))
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(dest("dist/css"));
});

task("static", function () {
  return src("./static/**/*", { dot: true }).pipe(dest("./dist/"));
});

//copies refactored js files to dist/gen so that they can be required by dist/gen/index.js
task("copy-modules", function () {
  return src(refactoredSrc, { allowEmpty: true }).pipe(dest("./dist/gen"));
});

//bundles the refactored js files together with index.js (the concatenated legacy js files)
//it's odd that the entry point is generated, so we should seek a better way of doing this
task("browserify", function () {
  const b = browserify({
    //index.js is generated by task "cat"
    entries: "./dist/gen/index.js",
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
    .pipe(dest("./dist/js"));
});

//lints only the refactored files
task("lint", function () {
  let filelist = refactoredSrc;
  filelist.push("./static/**/*.json");
  return src(filelist)
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

task("clean", function () {
  return src("./dist/", { allowEmpty: true }).pipe(vinylPaths(del));
});

task(
  "compile",
  series("lint", "cat", "copy-modules", "browserify", "static", "sass")
);

task("watch", function () {
  watch(["./static/**/*", "./src/**/*"], series("compile"));
});

task("build", series("clean", "compile"));
