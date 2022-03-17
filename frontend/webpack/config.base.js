const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");

let circularImports = 0;

const BASE_CONFIGURATION = {
  entry: path.resolve(__dirname, "../src/scripts/index.ts"),
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
    },
    extensions: [".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "../public/js/"),
    filename: "monkeytype.js",
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
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
      patterns: [{ from: "./static", to: "../" }],
    }),
  ],
};

module.exports = BASE_CONFIGURATION;
