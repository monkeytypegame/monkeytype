const { merge } = require("webpack-merge");
const BASE_CONFIGURATION = require("./config.base");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const AUDIT_CONFIGURATION = {
  mode: "development",
  devtool: false,
  plugins: [new BundleAnalyzerPlugin({ openAnalyzer: false })],
};

module.exports = merge(BASE_CONFIGURATION, AUDIT_CONFIGURATION);
