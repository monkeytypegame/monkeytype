const { resolve } = require("path");
const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.base");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const htmlWebpackPlugins = [
  "terms-of-service",
  "security-policy",
  "privacy-policy",
  "email-handler",
  "das",
].map((name) => {
  return new HtmlWebpackPlugin({
    filename: `${name}.html`,
    template: resolve(__dirname, `../static/${name}.html`),
    inject: "body",
    cache: false,
  });
});

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

  plugins: htmlWebpackPlugins,
};

module.exports = merge(BASE_CONFIG, DEV_CONFIG);
