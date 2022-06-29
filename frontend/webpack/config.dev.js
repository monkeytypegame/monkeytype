const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");

/** @type { import('webpack').Configuration } */
const DEV_CONFIG = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    compress: true,
    port: 3000,
    open: true,
    hot: false,
    liveReload: true,
    historyApiFallback: true,
    client: {
      overlay: false,
    },
  },
};

module.exports = merge(BASE_CONFIG, DEV_CONFIG);
