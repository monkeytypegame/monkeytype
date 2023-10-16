const { resolve } = require("path");
const { merge } = require("webpack-merge");
const FilemanagerPlugin = require("filemanager-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

const BASE_CONFIG = require("./config.base");
const webpack = require("webpack");

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
    new FilemanagerPlugin({
      events: {
        onEnd: {
          delete: [resolve(__dirname, "../public/html")],
        },
      },
    }),
    new WorkboxPlugin.GenerateSW({
      // these options encourage the ServiceWorkers to get in there fast
      // and not allow any straggling "old" SWs to hang around
      clientsClaim: true,
      skipWaiting: false,
      //include the generated css and js files
      maximumFileSizeToCacheInBytes: 11000000,
      cleanupOutdatedCaches: true,
      exclude: [
        // /html\/.*\.html/,
        // /LICENSE\.txt/,
        // /\.DS_Store/,
        // /\.map$/,
        // /^manifest.*\.js$/,
        // /languages\/.*\.json/,
        // /quotes\/.*\.json/,
        // /themes\/.*\.css/,
        // /challenges\/.*\.txt/,
        // /sound\/.*\.wav/,
        // /images\/.*\.(png|jpg)/,
        // /webfonts\/.+/,
        /./,
      ],
      runtimeCaching: [
        // {
        //   urlPattern: /.+\.(jpg|jpeg|gif|png|svg)/,
        //   handler: "CacheFirst",
        // },
        // {
        //   urlPattern: /.+\.(eot|otf|ttf|ttc|woff|woff2)/,
        //   handler: "CacheFirst",
        // },
        // // {
        // //   urlPattern: /.+\.(json|wav|txt|css)/,
        // //   handler: "NetworkFirst",
        // // },
        // {
        //   urlPattern: /.+\.min\.(js|css)/,
        //   handler: "CacheFirst",
        // },
        // {
        //   urlPattern: /.+\..{8}\.(js|css)/,
        //   handler: "CacheFirst",
        // },
        {
          urlPattern: /\/\/monkeytype.com.+/,
          handler: "NetworkFirst",
          options: {},
        },

        // {
        //   urlPattern: /languages\/.*/,
        //   handler: "StaleWhileRevalidate",
        // },
        // {
        //   urlPattern: /quotes\/.*/,
        //   handler: "StaleWhileRevalidate",
        // },
        // {
        //   urlPattern: /themes\/.*/,
        //   handler: "StaleWhileRevalidate",
        // },
        // {
        //   urlPattern: /challenges\/.*/,
        //   handler: "StaleWhileRevalidate",
        // },
        // {
        //   urlPattern: /layouts\/.*/,
        //   handler: "StaleWhileRevalidate",
        // },
        // {
        //   urlPattern: /sound\/.*\.wav/,
        //   handler: "StaleWhileRevalidate",
        // },
        // {
        //   urlPattern: /images\/.*\.(png|jpg)/,
        //   handler: "StaleWhileRevalidate",
        // },
        // {
        //   urlPattern: /webfonts\/.+/,
        //   handler: "CacheFirst",
        // },
      ],
    }),
    new webpack.DefinePlugin({
      BACKEND_URL: JSON.stringify("https://api.monkeytype.com"),
      IS_DEVELOPMENT: JSON.stringify(false),
    }),
  ],
};

module.exports = merge(BASE_CONFIG, PRODUCTION_CONFIG);
