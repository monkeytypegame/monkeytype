// eslint-disable-next-line
const esbuild = require("esbuild");
const path = require("path");

/**
 * @type {esbuild.BuildOptions}
 */
const buildOptions = {
  entryPoints: [path.join(path.resolve(__dirname, "src/scripts"), "index.ts")],
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
  logLevel: "warning",
  mainFields: ["module", "main"],
  // plugins: [babel({ config: babelConfig })],
};

module.exports = buildOptions;
