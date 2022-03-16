const { merge } = require("webpack-merge");
const BASE_CONFIGURATION = require("./config.base");

const DEVELOPMENT_CONFIGURATION = {
  mode: "development",
  devtool: false,
};

module.exports = merge(BASE_CONFIGURATION, DEVELOPMENT_CONFIGURATION);
