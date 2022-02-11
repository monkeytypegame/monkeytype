const path = require("path");
const { readFileSync } = require("fs");
const ESLintPlugin = require("eslint-webpack-plugin");
let eslintConfig = JSON.parse(
  readFileSync(path.resolve(__dirname, "../.eslintrc.json"), "utf-8").toString()
);
console.log(eslintConfig);

module.exports = {
  mode: "development", // Change to 'production' for production
  devtool: false,
  entry: path.resolve(__dirname, "src/js/index.js"),
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
    },
  },
  output: {
    path: path.resolve(__dirname, "public/js/"),
    filename: "monkeytype.js",
  },
  plugins: [
    new ESLintPlugin({
      failOnError: true,
      baseConfig: eslintConfig,
      extensions: ["js", "json"],
      exclude: "node_modules/",
      files: [
        path.resolve(__dirname, "src/js/**/*.js"),
        path.resolve(__dirname, "static/**/*.json"),
      ],
    }),
  ],
};
