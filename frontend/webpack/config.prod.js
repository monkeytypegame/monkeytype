const { resolve } = require("path");
const { merge } = require("webpack-merge");
const RemovePlugin = require("remove-files-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

const BASE_CONFIG = require("./config.base");

function pad(numbers, maxLength, fillString) {
  return numbers.map((number) =>
    number.toString().padStart(maxLength, fillString)
  );
}

const { COMMIT_HASH = "NO_HASH" } = process.env;

/** @type { import('webpack').Configuration } */
const PRODUCTION_CONFIG = {
  mode: "production",
  module: {
    rules: [
      {
        test: /version\.ts$/,
        loader: "string-replace-loader",
        options: {
          search: /^export const CLIENT_VERSION =.*/,
          replace() {
            const date = new Date();

            const versionPrefix = pad(
              [date.getFullYear(), date.getMonth() + 1, date.getDate()],
              2,
              "0"
            ).join(".");
            const versionSuffix = pad(
              [date.getHours(), date.getMinutes()],
              2,
              "0"
            ).join(".");
            const version = [versionPrefix, versionSuffix].join("_");

            return `export const CLIENT_VERSION = "${version}.${COMMIT_HASH}";`;
          },
          flags: "g",
        },
      },
      {
        test: /firebase\.ts$/,
        loader: "string-replace-loader",
        options: {
          search: /\.\/constants\/firebase-config/,
          replace() {
            return "./constants/firebase-config-live";
          },
          flags: "g",
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      `...`,
      new HtmlMinimizerPlugin(),
      new JsonMinimizerPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new RemovePlugin({
      after: {
        include: [resolve(__dirname, "../public/html")],
      },
    }),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: false,
      //include the generated css and js files
      maximumFileSizeToCacheInBytes: 11000000,
      exclude: [
        /html\/.*\.html/,
        /LICENSE\.txt/,
        /\.DS_Store/,
        /\.map$/,
        /^manifest.*\.js$/,
        /languages\/.*\.json/,
        /quotes\/.*\.json/,
        /themes\/.*\.css/,
        /challenges\/.*\.txt/,
        /sound\/.*\.wav/,
        /images\/.*\.(png|jpg)/,
        /webfonts\/.+/,
      ],
      runtimeCaching: [
        {
          urlPattern: /languages\/.*\.json/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /quotes\/.*\.json/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /themes\/.*\.css/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /challenges\/.*\.txt/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /sound\/.*\.wav/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /images\/.*\.(png|jpg)/,
          handler: "StaleWhileRevalidate",
        },
        {
          urlPattern: /webfonts\/.+/,
          handler: "CacheFirst",
        },
      ],
    }),
  ],
};

module.exports = merge(BASE_CONFIG, PRODUCTION_CONFIG);
