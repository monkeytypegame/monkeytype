const { resolve } = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

let circularImports = 0;

/** @type { import('webpack').Configuration } */
const BASE_CONFIG = {
  entry: {
    monkeytype: resolve(__dirname, "../src/scripts/index.ts"),
  },
  resolve: { extensions: [".ts", ".js"] },
  output: {
    filename: "./js/[name].[chunkhash:8].js",
    path: resolve(__dirname, "../public/"),
    clean: true,
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
            },
          },
        ],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          name: "vendor",
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
      },
    },
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /./,
      failOnError: true,
      allowAsyncCycles: false,
      cwd: process.cwd(),
      onStart() {
        circularImports = 0;
      },
      onDetected({ paths }) {
        circularImports++;
        const joinedPaths = paths.join("\u001b[31m -> \u001b[0m");
        console.log(`\u001b[31mCircular import found: \u001b[0m${joinedPaths}`);
      },
      onEnd() {
        const colorCode = circularImports === 0 ? 32 : 31;
        const countWithColor = `\u001b[${colorCode}m${circularImports}\u001b[0m`;
        console.log(`Found ${countWithColor} circular imports`);
      },
    }),
    new CopyPlugin({
      patterns: [
        {
          from: resolve(__dirname, "../static"),
          to: "./",
          globOptions: {
            ignore: ["**/index.html"],
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      filename: "./index.html",
      template: resolve(__dirname, "../static/index.html"),
      inject: "body",
    }),
    new MiniCssExtractPlugin({
      filename: "./css/style.[chunkhash:8].css",
    }),
  ],
};

module.exports = BASE_CONFIG;
