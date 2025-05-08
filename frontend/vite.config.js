import { defineConfig, mergeConfig } from "vite";
import injectHTML from "vite-plugin-html-inject";
import autoprefixer from "autoprefixer";
import "dotenv/config";
import PROD_CONFIG from "./vite.config.prod";
import DEV_CONFIG from "./vite.config.dev";
import MagicString from "magic-string";

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
