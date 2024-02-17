const eslint = require("gulp-eslint-new");
const { task, src, series } = require("gulp");
const JSONValidation = require("./scripts/json-validation");
const eslintConfig = "../.eslintrc.json";

task("lint", function () {
  return src(["./src/ts/**/*.ts"])
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

//PR CHECK

task("pr-check-quote-json", function () {
  return JSONValidation.validateQuotes();
});
task("pr-check-language-json", function () {
  return JSONValidation.validateLanguages();
});
task("pr-check-other-json", function () {
  return JSONValidation.validateOthers();
});

task("pr-check-lint", series("lint"));
