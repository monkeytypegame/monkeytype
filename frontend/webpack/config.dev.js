const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");

const DEVELOPMENT_CONFIG = {
  mode: "development",
  devtool: "eval",
  watch: true,
};

module.exports = merge(BASE_CONFIG, DEVELOPMENT_CONFIG);
