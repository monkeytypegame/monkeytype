import { Plugin } from "vite";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Minifies all json files in the `dist` directory
 * @returns
 */
export function minifyJson(): Plugin {
  return {
    name: "minify-json",
    apply: "build",
    generateBundle() {
      let totalOriginalSize = 0;
      let totalMinifiedSize = 0;

      const minifyJsonFiles = (dir: string): void => {
        readdirSync(dir).forEach((file) => {
          const sourcePath = path.join(dir, file);
          const stat = statSync(sourcePath);

          if (stat.isDirectory()) {
            minifyJsonFiles(sourcePath);
          } else if (path.extname(file) === ".json") {
            const originalContent = readFileSync(sourcePath, "utf8");
            const originalSize = Buffer.byteLength(originalContent, "utf8");
            const minifiedContent = JSON.stringify(JSON.parse(originalContent));
            const minifiedSize = Buffer.byteLength(minifiedContent, "utf8");

            totalOriginalSize += originalSize;
            totalMinifiedSize += minifiedSize;

            writeFileSync(sourcePath, minifiedContent);

            /*
            const savings =
              ((originalSize - minifiedSize) / originalSize) * 100;
            console.log(
              `\x1b[0m \x1b[36m${sourcePath}\x1b[0m | ` +
                `\x1b[90mOriginal: ${originalSize} bytes\x1b[0m | ` +
                `\x1b[90mMinified: ${minifiedSize} bytes\x1b[0m | ` +
                `\x1b[32mSavings: ${savings.toFixed(2)}%\x1b[0m`
            );
            */
          }
        });
      };

      // console.log("\n\x1b[1mMinifying JSON files...\x1b[0m\n");
      const start = performance.now();

      minifyJsonFiles("./dist");

      const end = performance.now();
      const totalSavings =
        ((totalOriginalSize - totalMinifiedSize) / totalOriginalSize) * 100;

      console.log(
        `\n\n\x1b[1mJSON Minification Summary:\x1b[0m\n` +
          `  \x1b[90mTotal original size: ${(
            totalOriginalSize /
            1024 /
            1024
          ).toFixed(2)} mB\x1b[0m\n` +
          `  \x1b[90mTotal minified size: ${(
            totalMinifiedSize /
            1024 /
            1024
          ).toFixed(2)} mB\x1b[0m\n` +
          `  \x1b[32mTotal savings: ${totalSavings.toFixed(
            2,
          )}%\x1b[0m took ${Math.round(end - start)} ms\n`,
      );
    },
  };
}
