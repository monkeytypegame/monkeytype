const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");

/** @type { import('webpack').Configuration } */
const DEV_CONFIG = {
  mode: "development",
  devtool: "eval",
  devServer: {
    compress: true,
    port: 5000,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: false,
    },
  },
};

module.exports = merge(BASE_CONFIG, DEV_CONFIG);
