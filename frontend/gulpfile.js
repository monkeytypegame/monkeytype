const { webpack } = require("webpack");
const eslint = require("gulp-eslint-new");
const { task, src, series, watch } = require("gulp");
const { resolve } = require("path");
const fs = require("fs");
const webpackDevConfig = require("./webpack/config.dev.js");
const webpackProdConfig = require("./webpack/config.prod.js");

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

const taskWithWebpackConfig = (webpackConfig) => {
  return async () => {
    if (
      !fs.existsSync(
        resolve(__dirname, "../src/ts/constants/firebase-config.ts")
      )
    ) {
      const msg = `File firebase-config.ts is missing! Please duplicate firebase-config-example.ts and rename it to firebase-config.ts. If you are using Firebase, fill in the values in the config file. If not, you can leave the fields blank. For more information, check CONTRIBUTING_ADVANCED.md`;
      throw new Error(msg);
    }

    return new Promise((resolve, reject) => {
      webpack(webpackConfig, (err, stats) => {
        if (err) {
          return reject(err);
        }
        if (stats.hasErrors()) {
          return reject(new Error(stats.compilation.errors.join("\n")));
        }
        console.log(
          `Finished building in ${
            (stats.endTime - stats.startTime) / 1000
          } second(s)`
        );
        resolve();
      });
    });
  };
};

task("webpack", taskWithWebpackConfig(webpackDevConfig));
task("webpack-production", taskWithWebpackConfig(webpackProdConfig));

task("compile", series("lint", "lint-json", "webpack"));

task(
  "compile-production",
  series("lint", "lint-json", "validate-json-schema", "webpack-production")
);

task("watch", function () {
  watch(["./src/ts/**/*.ts", "./src/ts/*.ts"], series("lint"));
  watch(["./static/**/*.*", "./static/*.*"], series("lint-json"));
});

task("build", series("compile"));

task("build-production", series("compile-production"));

//PR CHECK

task("validate-quote-json-schema", function () {
  return JSONValidation.validateQuotes();
});

task("validate-language-json-schema", function () {
  return JSONValidation.validateLanguages();
});

task("validate-other-json-schema", function () {
  return JSONValidation.validateOthers();
});

task("pr-check-lint-json", series("lint-json"));
task("pr-check-quote-json", series("validate-quote-json-schema"));
task("pr-check-language-json", series("validate-language-json-schema"));
task("pr-check-other-json", series("validate-other-json-schema"));

task("pr-check-lint", series("lint"));

task("pr-check-ts", series("webpack-production"));
