const { resolve } = require("path");
const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");
const ExtraWatchWebpackPlugin = require("extra-watch-webpack-plugin");
const fs = require("fs");

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

if (
  !fs.existsSync(resolve(__dirname, "../src/ts/constants/firebase-config.ts"))
) {
  const msg = `File firebase-config.ts is missing! Please duplicate firebase-config-example.ts and rename it to firebase-config.ts. If you are using Firebase, fill in the values in the config file. If not, you can leave the fields blank. For more information, check CONTRIBUTING_ADVANCED.md`;
  throw new Error(msg);
}

module.exports = merge(BASE_CONFIG, DEV_CONFIG);
