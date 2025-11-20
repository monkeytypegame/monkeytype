import { checker } from "vite-plugin-checker";
import Inspect from "vite-plugin-inspect";
import path from "node:path";
import { getFontsConig } from "./vite.config";
import { envConfig } from "./vite-plugins/env-config";
import { languageHashes } from "./vite-plugins/language-hashes";

/** @type {import("vite").UserConfig} */
export default {
  plugins: [
    envConfig({ isDevelopment: true }),
    languageHashes({ skip: true }),
    checker({
      typescript: {
        tsconfigPath: path.resolve(__dirname, "./tsconfig.json"),
      },
      oxlint: {
        lintCommand: "oxlint . --type-aware",
      },
      overlay: {
        initialIsOpen: false,
      },
    }),
    Inspect(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        $fontAwesomeOverride:"@fortawesome/fontawesome-free/webfonts";
        $previewFontsPath:"webfonts";
        $fonts: (${getFontsConig()});
        `,
      },
    },
  },
  build: {
    outDir: "../dist",
  },
};
