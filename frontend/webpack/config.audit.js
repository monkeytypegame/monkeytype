const { merge } = require("webpack-merge");
const BASE_CONFIG = require("./config.prod");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const AUDIT_CONFIG = {
  plugins: [new BundleAnalyzerPlugin({ openAnalyzer: false })],
};

module.exports = merge(BASE_CONFIG, AUDIT_CONFIG);
