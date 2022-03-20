const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");

/** @type { import('webpack').Configuration } */
const DEVELOPMENT_CONFIG = {
  mode: "development",
  devtool: "eval",
  watch: true,
};

module.exports = merge(BASE_CONFIG, DEVELOPMENT_CONFIG);
