const { merge } = require("webpack-merge");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const PROD_CONFIG = require("./config.prod");

/** @type { import('webpack').Configuration } */
const AUDIT_CONFIG = {
  plugins: [new BundleAnalyzerPlugin()],
};

module.exports = merge(PROD_CONFIG, AUDIT_CONFIG);
