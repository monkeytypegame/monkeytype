const path = require("path");

module.exports = {
  mode: "production", // Change to 'production' for production
  entry: "./src/js/index.js",
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
    },
  },
  output: {
    path: path.resolve(__dirname, "public/js/"),
    filename: "monkeytype.js",
  },
};
