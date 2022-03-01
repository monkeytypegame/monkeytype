// eslint-disable-next-line
const esbuild = require("esbuild");
const path = require("path");
const babel = require("esbuild-plugin-babel");
const babelConfig = require("./babel.config.json");
const circular = require("./esbuild-circular-plugin");

/**
 * @type {esbuild.BuildOptions}
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
    ".firebaserc": "json",
  },
  minify: false,
  platform: "browser",
  define: {
    global: "window",
  },
  logLevel: "warning",
  plugins: [circular, babel(babelConfig)],
};

module.exports = buildOptions;
