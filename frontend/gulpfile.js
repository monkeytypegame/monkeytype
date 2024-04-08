import eslint, { format, failAfterError } from "gulp-eslint-new";
import gulp from "gulp";
import {
  validateAll,
  validateQuotes,
  validateLanguages,
  validateOthers,
} from "./scripts/json-validation.cjs";
const eslintConfig = "../.eslintrc.json";

const { task, src, series } = gulp;

task("lint", function () {
  return src(["./src/ts/**/*.ts"])
    .pipe(eslint(eslintConfig))
    .pipe(format())
    .pipe(failAfterError());
});

task("lint-json", function () {
  return src("./static/**/*.json")
    .pipe(eslint(eslintConfig))
    .pipe(format())
    .pipe(failAfterError());
});

task("validate-json-schema", function () {
  return validateAll();
});

//PR CHECK

task("pr-check-quote-json", function () {
  return validateQuotes();
});
task("pr-check-language-json", function () {
  return validateLanguages();
});
task("pr-check-other-json", function () {
  return validateOthers();
});

task("pr-check-lint", series("lint"));
