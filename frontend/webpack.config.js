const path = require("path");

module.exports = {
  mode: "production", // Change to 'production' for production
  entry: "./src/js/index.js",
  resolve: {
    fallback: { crypto: false },
  },
  output: {
    path: path.resolve(__dirname, "public/js/"),
    filename: "monkeytype.js",
  },
};
