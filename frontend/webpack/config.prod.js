const { merge } = require("webpack-merge");
const BASE_CONFIGURATION = require("./config.base");

const PRODUCTION_CONFIGURATION = {
  mode: "production",
  module: {
    rules: [
      {
        test: /version\.ts$/,
        loader: "string-replace-loader",
        options: {
          search: /^export const CLIENT_VERSION =.*/,
          replace(_match, _p1, _offset, _string) {
            const date = new Date();
            const dateString = [
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate(),
              date.getHours(),
              date.getMinutes(),
              date.getSeconds(),
            ].join("-");
            return `export const CLIENT_VERSION = "${dateString}";`;
          },
          flags: "g",
        },
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [
              "@babel/plugin-transform-runtime",
              "@babel/plugin-transform-modules-commonjs",
            ],
          },
        },
      },
    ],
  },
};

module.exports = merge(BASE_CONFIGURATION, PRODUCTION_CONFIGURATION);
