import { fontawesomeSubset } from "fontawesome-subset";
import { getFontawesomeConfig } from "./scripts/fontawesome";
import { generatePreviewFonts } from "./scripts/font-preview";
import { VitePWA } from "vite-plugin-pwa";
import replace from "vite-plugin-filter-replace";
import path from "node:path";
import { splitVendorChunkPlugin } from "vite";
import childProcess from "child_process";
import { checker } from "vite-plugin-checker";
import { writeFileSync } from "fs";

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

    return `${version}.${commitHash}`.replace(/\n/g, "");
  } catch (e) {
    return `${version}.unknown-hash`;
  }
}

/** Enable for font awesome v6 */
/*
function sassList(values) {
  return values.map((it) => `"${it}"`).join(",");
}
*/

/** @type {import("vite").UserConfig} */
export default {
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
      name: "generate-version-json",
      apply: "build",

      closeBundle() {
        const version = buildClientVersion();
        const versionJson = JSON.stringify({ version });
        const versionPath = path.resolve(__dirname, "dist/version.json");
        writeFileSync(versionPath, versionJson);
      },
    },
    {
      name: "vite-plugin-webfonts-preview",
      apply: "build",
      buildStart() {
        generatePreviewFonts();
      },
    },
    checker({
      typescript: {
        tsconfigPath: path.resolve(__dirname, "./tsconfig.json"),
      },
    }),
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
          {
            urlPattern: (options) => {
              //disable caching for version.json
              return options.url.pathname === "/version.json";
            },
            handler: "NetworkOnly",
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
  define: {
    BACKEND_URL: JSON.stringify(
      process.env.BACKEND_URL || "https://api.monkeytype.com"
    ),
    IS_DEVELOPMENT: JSON.stringify(false),
    CLIENT_VERSION: JSON.stringify(buildClientVersion()),
    RECAPTCHA_SITE_KEY: JSON.stringify(process.env.RECAPTCHA_SITE_KEY),
    QUICK_LOGIN_EMAIL: undefined,
    QUICK_LOGIN_PASSWORD: undefined,
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
