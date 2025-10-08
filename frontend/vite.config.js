import { defineConfig, mergeConfig } from "vite";
import injectHTML from "vite-plugin-html-inject";
import autoprefixer from "autoprefixer";
import "dotenv/config";
import PROD_CONFIG from "./vite.config.prod";
import DEV_CONFIG from "./vite.config.dev";
import MagicString from "magic-string";
import { Fonts } from "./src/ts/constants/fonts";

global.navigator = undefined; // sass compatibly & imagemin bug https://github.com/vitejs/vite/issues/5815#issuecomment-984041683

/** @type {import("vite").UserConfig} */
const BASE_CONFIG = {
  plugins: [
    {
      name: "simple-jquery-inject",
      async transform(src, id) {
        if (id.endsWith(".ts")) {
          //check if file has a jQuery or $() call
          if (/(?:jQuery|\$)\([^)]*\)/.test(src)) {
            const s = new MagicString(src);

            //if file has "use strict"; at the top, add it below that line, if not, add it at the very top
            if (src.startsWith(`"use strict";`)) {
              s.appendRight(12, `\nimport $ from "jquery";`);
            } else {
              s.prepend(`import $ from "jquery";`);
            }

            return {
              code: s.toString(),
              map: s.generateMap({ hires: true, source: id }),
            };
          }
        }
      },
    },
    injectHTML(),
  ],
  server: {
    open: process.env.SERVER_OPEN !== "false",
    port: 3000,
    host: process.env.BACKEND_URL !== undefined,
    watch: {
      //we rebuild the whole contracts package when a file changes
      //so we only want to watch one file
      ignored: [/.*\/packages\/contracts\/dist\/(?!configs).*/],
    },
  },
  clearScreen: false,
  root: "src",
  publicDir: "../static",
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [autoprefixer({})],
    },
  },
  envDir: "../",
  optimizeDeps: {
    include: ["jquery"],
    exclude: ["@fortawesome/fontawesome-free"],
  },
};

export default defineConfig(({ command }) => {
  if (command === "build") {
    if (process.env.RECAPTCHA_SITE_KEY === undefined) {
      throw new Error(".env: RECAPTCHA_SITE_KEY is not defined");
    }
    return mergeConfig(BASE_CONFIG, PROD_CONFIG);
  } else {
    return mergeConfig(BASE_CONFIG, DEV_CONFIG);
  }
});

/** Enable for font awesome v6 */
/*
function sassList(values) {
  return values.map((it) => `"${it}"`).join(",");
}
*/

export function getFontsConig() {
  return (
    "\n" +
    Object.keys(Fonts)
      .sort()
      .map((name) => {
        const config = Fonts[name];
        if (config.systemFont === true) return "";
        return `"${name.replaceAll("_", " ")}": (
        "src": "${config.fileName}",
        "weight": ${config.weight ?? 400},
        ),`;
      })
      .join("\n") +
    "\n"
  );
}
