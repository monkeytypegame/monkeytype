import { checker } from "vite-plugin-checker";
import Inspect from "vite-plugin-inspect";
import path from "node:path";
import { getFontsConig } from "./vite.config";

/** @type {import("vite").UserConfig} */
export default {
  plugins: [
    checker({
      typescript: {
        tsconfigPath: path.resolve(__dirname, "./tsconfig.json"),
      },
      oxlint: true,
      eslint: {
        lintCommand: `eslint "${path.resolve(__dirname, "./src/ts/**/*.ts")}"`,
        watchPath: path.resolve(__dirname, "./src/"),
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
