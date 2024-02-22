import { defineConfig, splitVendorChunkPlugin, mergeConfig } from "vite";
import path from "node:path";
import injectHTML from "vite-plugin-html-inject";
import childProcess from "child_process";
import { checker } from "vite-plugin-checker";
import { VitePWA } from "vite-plugin-pwa";
import replace from "vite-plugin-filter-replace";
import Inspect from "vite-plugin-inspect";
import autoprefixer from "autoprefixer";
import "dotenv/config";

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

/** @type {import("vite").UserConfig} */
const BASE_CONFIG = {
  plugins: [
    {
      name: "simple-jquery-inject",
      async transform(src, id) {
        if (id.endsWith(".ts")) {
          //check if file has a jQuery or $() call
          if (/(?:jQuery|\$)\([^)]*\)/.test(src)) {
            //if file has "use strict"; at the top, add it below that line, if not, add it at the very top
            if (src.startsWith(`"use strict";`)) {
              return src.replace(
                /("use strict";)/,
                `$1\nimport $ from "jquery";`
              );
            } else {
              return `import $ from "jquery";\n${src}`;
            }
          }
        }
      },
    },
    checker({
      typescript: {
        root: path.resolve(__dirname, "./"),
      },
      eslint: {
        lintCommand: `eslint "${path.resolve(__dirname, "./src/ts/**/*.ts")}"`,
      },
      overlay: {
        initialIsOpen: false,
      },
    }),
    injectHTML(),
    Inspect(),
  ],
  server: {
    open: true,
    port: 3000,
    host: process.env.BACKEND_URL !== undefined,
  },
  root: "src",
  publicDir: "../static",
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [autoprefixer({})],
    },
  },
  envDir: "../",
  build: {
    emptyOutDir: true,
    outDir: "../dist",
    rollupOptions: {
      input: {
        monkeytype: path.resolve(__dirname, "src/index.html"),
        email: path.resolve(__dirname, "src/email-handler.html"),
        privacy: path.resolve(__dirname, "src/privacy-policy.html"),
        security: path.resolve(__dirname, "src/security-policy.html"),
        terms: path.resolve(__dirname, "src/terms-of-service.html"),
      },
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
    include: ["jquery"],
  },
};

/** @type {import("vite").UserConfig} */
const BUILD_CONFIG = {
  plugins: [
    splitVendorChunkPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        short_name: "Monkeytype",
        name: "Monkeytype",
        start_url: "/",
        icons: [
          {
            src: "/images/icons/maskable_icon_x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/images/icons/general_icon_x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
        background_color: "#323437",
        display: "standalone",
        theme_color: "#323437",
      },
      manifestFilename: "manifest.json",
      workbox: {
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globIgnores: ["**/.*"],
        globPatterns: ["index.html"],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => {
              const sameOrigin =
                new URL(request.url).origin === new URL(url).origin;
              const isApi = request.url.includes("api.monkeytype.com");
              return sameOrigin && !isApi;
            },
            handler: "NetworkFirst",
            options: {},
          },
        ],
      },
    }),
    replace([
      {
        filter: /firebase\.ts$/,
        replace: {
          from: /\.\/constants\/firebase-config/gi,
          to: "./constants/firebase-config-live",
        },
      },
    ]),
  ],
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
