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
import { fontawesomeSubset } from "fontawesome-subset";
import { getFontawesomeConfig } from "./scripts/fontawesome";
import { generatePreviewFonts } from "./scripts/font-preview";

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

  try {
    const commitHash = childProcess
      .execSync("git rev-parse --short HEAD")
      .toString();

    return `${version}.${commitHash}`;
  } catch (e) {
    return `${version}.unknown-hash`;
  }
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
                `$1import $ from "jquery";`
              );
            } else {
              return `import $ from "jquery";${src}`;
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
    open: process.env.SERVER_OPEN !== "false",
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
    assetsInlineLimit: 0, //dont inline small files as data
    rollupOptions: {
      input: {
        monkeytype: path.resolve(__dirname, "src/index.html"),
        email: path.resolve(__dirname, "src/email-handler.html"),
        privacy: path.resolve(__dirname, "src/privacy-policy.html"),
        security: path.resolve(__dirname, "src/security-policy.html"),
        terms: path.resolve(__dirname, "src/terms-of-service.html"),
        404: path.resolve(__dirname, "src/404.html"),
      },
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "images";
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `webfonts/[name]-[hash].${extType}`;
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
    RECAPTCHA_SITE_KEY: JSON.stringify(
      "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
    ),
  },
  optimizeDeps: {
    include: ["jquery"],
    exclude: ["@fortawesome/fontawesome-free"],
  },
};

/** @type {import("vite").UserConfig} */
const DEV_CONFIG = {
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        $fontAwesomeOverride:"@fortawesome/fontawesome-free/webfonts";
        $previewFontsPath:"webfonts";
        `,
      },
    },
  },
};

/** @type {import("vite").UserConfig} */
const BUILD_CONFIG = {
  plugins: [
    {
      name: "vite-plugin-fontawesome-subset",
      apply: "build",
      buildStart() {
        const fontawesomeClasses = getFontawesomeConfig();
        fontawesomeSubset(fontawesomeClasses, "src/webfonts-generated", {
          targetFormats: ["woff2"],
        });
      },
    },
    {
      name: "vite-plugin-webfonts-preview",
      apply: "build",
      buildStart() {
        generatePreviewFonts();
      },
    },
    splitVendorChunkPlugin(),
    VitePWA({
      injectRegister: "networkfirst",
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
        globPatterns: [],
        navigateFallback: "",
        runtimeCaching: [
          {
            urlPattern: (options) => {
              const isApi = options.url.hostname === "api.monkeytype.com";
              return options.sameOrigin && !isApi;
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
    BACKEND_URL: JSON.stringify(
      process.env.BACKEND_URL || "https://api.monkeytype.com"
    ),
    IS_DEVELOPMENT: JSON.stringify(false),
    CLIENT_VERSION: JSON.stringify(buildClientVersion()),
    RECAPTCHA_SITE_KEY: JSON.stringify(process.env.RECAPTCHA_SITE_KEY),
  },
  /** Enable for font awesome v6 */
  /*preprocessorOptions: {
    scss: {
      additionalData(source, fp) {
        if (fp.endsWith("index.scss")) {
          const fontawesomeClasses = getFontawesomeConfig();
          return `
          //inject variables into sass context
          $fontawesomeBrands: ${sassList(
            fontawesomeClasses.brands
          )};             
          $fontawesomeSolid: ${sassList(fontawesomeClasses.solid)};

          ${source}`;
        } else {
          return source;
        }
      },
    },
  },*/
};

export default defineConfig(({ command }) => {
  if (command === "build") {
    if (process.env.RECAPTCHA_SITE_KEY === undefined) {
      throw new Error(".env: RECAPTCHA_SITE_KEY is not defined");
    }
    return mergeConfig(BASE_CONFIG, BUILD_CONFIG);
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
