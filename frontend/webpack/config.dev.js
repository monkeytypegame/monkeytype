const { resolve } = require("path");
const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");
const ExtraWatchWebpackPlugin = require("extra-watch-webpack-plugin");

/** @type { import('webpack').Configuration } */
const DEV_CONFIG = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    compress: true,
    port: 3000,
    open: true,
    hot: false,
    historyApiFallback: true,
    client: {
      overlay: false,
    },
  },
  plugins: [
    new ExtraWatchWebpackPlugin({
      dirs: [resolve(__dirname, "../static/html")],
    }),
  ],
};

module.exports = merge(BASE_CONFIG, DEV_CONFIG);
