const { merge } = require("webpack-merge");
const BASE_CONFIGURATION = require("./config.base");

const DEVELOPMENT_CONFIGURATION = {
  mode: "development",
  devtool: false,
  watch: true,
  module: {
    rules: [
      {
        test: /firebase\.ts$/,
        loader: "string-replace-loader",
        options: {
          search: /\.\/constants\/firebase-config-example/,
          replace(_match, _p1, _offset, _string) {
            return `./constants/firebase-config`;
          },
          flags: "g",
        },
      },
    ],
  },
};

module.exports = merge(BASE_CONFIGURATION, DEVELOPMENT_CONFIGURATION);
