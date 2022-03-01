// eslint-disable-next-line
const esbuild = require("esbuild");
const path = require("path");
const madge = require("madge");

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
  plugins: [
    {
      name: "circulars",
      setup(build) {
        build.onStart(async () => {
          const madgeInstance = await madge(
            build.initialOptions.entryPoints[0],
            {
              includeNpm: true,
              tsConfig: "tsconfig.json",
            }
          );

          const circulars = madgeInstance.circular();

          return {
            errors: circulars.map((v) => ({
              text: "Circular Dependency Found",
              location: {
                file: v[0] ?? "",
              },
            })),
            warnings: [
              {
                text: `Found ${circulars.length} circular dependencies`,
              },
            ],
          };
        });
      },
    },
  ],
};

module.exports = buildOptions;
