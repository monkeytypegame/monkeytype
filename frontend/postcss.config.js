/** @type {import('postcss-load-config').Config} */
const config = {
  parser: "postcss-scss",
  plugins: [require("autoprefixer")],
};

module.exports = config;
