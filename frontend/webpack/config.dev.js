const { merge } = require("webpack-merge");
const BASE_CONFIGURATION = require("./config.base");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const DEVELOPMENT_CONFIGURATION = {
  mode: "development",
  devtool: false,
  watch: true,
  plugins: [new BundleAnalyzerPlugin({ openAnalyzer: false })],
};

module.exports = merge(BASE_CONFIGURATION, DEVELOPMENT_CONFIGURATION);
