const madge = require("madge");

module.exports = {
  name: "circulars",
  setup(build) {
    build.onStart(async () => {
      const madgeInstance = await madge(build.initialOptions.entryPoints[0], {
        includeNpm: true,
        tsConfig: "tsconfig.json",
      });

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
};
