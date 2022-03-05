// eslint-disable-next-line
const { BuildOptions } = require("esbuild");
const path = require("path");

/**
 * @type {BuildOptions}
 */
const buildOptions = {
  entryPoints: [
    path.join(path.resolve(__dirname, "src/scripts"), "index.firebase-init.ts"),
  ],
  bundle: true,
  outfile: path.join(path.resolve(__dirname, "public/js/"), "monkeytype.js"),
  loader: {
    ".ts": "ts",
    ".js": "ts",
  },
  minify: true,
  platform: "browser",
  define: {
    global: "window",
  },
};

module.exports = buildOptions;
