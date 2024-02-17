import {
  defineConfig,
  splitVendorChunkPlugin,
  mergeConfig,
  // eslint-disable-next-line no-unused-vars
  UserConfig,
} from "vite";
// import path from "node:path";
import inject from "@rollup/plugin-inject";
import injectHTML from "vite-plugin-html-inject";
import eslint from "vite-plugin-eslint";
import childProcess from "child_process";
import { checker } from "vite-plugin-checker";

function pad(numbers, maxLength, fillString) {
  return numbers.map((number) =>
    number.toString().padStart(maxLength, fillString)
  );
}

function buildClientVersion() {
  const date = new Date();
  const versionPrefix = pad(
    [date.getFullYear(), date.getMonth() + 1, date.getDate()],
    2,
    "0"
  ).join(".");
  const versionSuffix = pad([date.getHours(), date.getMinutes()], 2, "0").join(
    "."
  );
  const version = [versionPrefix, versionSuffix].join("_");

  const commitHash = childProcess
    .execSync("git rev-parse --short HEAD")
    .toString();

  return `${version}.${commitHash}`;
}

/** @type {UserConfig} */
const BASE_CONFIG = {
  plugins: [
    inject({
      $: "jquery",
      jQuery: "jquery",
      jQueryColor: "jquery-color",
      jQueryEasing: "jquery.easing",
    }),
    eslint(),
    checker({
      typescript: true,
      overlay: true,
    }),
    injectHTML(),
    splitVendorChunkPlugin(),
  ],
  server: {
    open: true,
    port: 3000,
  },
  publicDir: "static",
  css: {
    devSourcemap: true,
  },
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      // input: {
      //   main: path.resolve(__dirname, "index.html"),
      //   emailHandler: path.resolve(__dirname, "static/email-handler.html"),
      // },
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "images";
          }
          return `${extType}/[name].[hash][extname]`;
        },
        chunkFileNames: "js/[name].[hash].js",
        entryFileNames: "js/[name].[hash].js",
      },
    },
  },
  // resolve: {
  //   alias: {
  //     "/src": path.resolve(process.cwd(), "src"),
  //     $: "jquery",
  //   },
  // },
  define: {
    BACKEND_URL: JSON.stringify(
      process.env.BACKEND_URL || "http://localhost:5005"
    ),
    IS_DEVELOPMENT: JSON.stringify(true),
    CLIENT_VERSION: JSON.stringify("DEVELOPMENT_CLIENT"),
  },
  optimizeDeps: {
    include: ["jquery", "jquery-color", "jquery.easing"],
  },
};

/** @type {UserConfig} */
const BUILD_CONFIG = {
  define: {
    BACKEND_URL: JSON.stringify("https://api.monkeytype.com"),
    IS_DEVELOPMENT: JSON.stringify(false),
    CLIENT_VERSION: JSON.stringify(buildClientVersion()),
  },
};

export default defineConfig(({ command }) => {
  if (command === "build") {
    return mergeConfig(BASE_CONFIG, BUILD_CONFIG);
  } else {
    return BASE_CONFIG;
  }
});
