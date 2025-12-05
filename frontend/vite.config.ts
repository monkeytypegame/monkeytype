import {
  defineConfig,
  loadEnv,
  UserConfig,
  BuildEnvironmentOptions,
  PluginOption,
  Plugin,
} from "vite";
import path from "node:path";
import injectHTML from "vite-plugin-html-inject";
import childProcess from "child_process";
import autoprefixer from "autoprefixer";
import MagicString from "magic-string";
import { Fonts } from "./src/ts/constants/fonts";
import { fontawesomeSubset } from "./vite-plugins/fontawesome-subset";
import { fontPreview } from "./vite-plugins/font-preview";
import { envConfig } from "./vite-plugins/env-config";
import { languageHashes } from "./vite-plugins/language-hashes";
import { minifyJson } from "./vite-plugins/minify-json";
import { versionFile } from "./vite-plugins/version-file";
import { checker } from "vite-plugin-checker";
import Inspect from "vite-plugin-inspect";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import replace from "vite-plugin-filter-replace";
// eslint-disable-next-line import/no-unresolved
import UnpluginInjectPreload from "unplugin-inject-preload/vite";
import { KnownFontName } from "@monkeytype/schemas/fonts";

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), "");

  if (mode === "production") {
    if (env["RECAPTCHA_SITE_KEY"] === undefined) {
      throw new Error(`${mode}: RECAPTCHA_SITE_KEY is not defined`);
    }
    if (env["SENTRY"] !== null && env["SENTRY_AUTH_TOKEN"] === undefined) {
      throw new Error(`${mode}: SENTRY_AUTH_TOKEN is not defined`);
    }
  }

  const isDevelopment = mode !== "production";
  const clientVersion = getClientVersion(isDevelopment);

  const plugins: Plugin[] = [
    envConfig({ isDevelopment, clientVersion, env }),
    languageHashes({ skip: isDevelopment }),
    checker({
      typescript: {
        tsconfigPath: path.resolve(__dirname, "./tsconfig.json"),
      },
      oxlint: isDevelopment,
      eslint: isDevelopment
        ? {
            lintCommand: `eslint "${path.resolve(__dirname, "./src/ts/**/*.ts")}"`,
            watchPath: path.resolve(__dirname, "./src/"),
          }
        : false,
      overlay: isDevelopment
        ? {
            initialIsOpen: false,
          }
        : false,
    }),
    {
      name: "simple-jquery-inject",
      async transform(src: string, id: string) {
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
        return;
      },
    },
    injectHTML(),
  ];

  const devPlugins: Plugin[] = [Inspect()];
  const prodPlugins: (Plugin | PluginOption)[] = [
    fontPreview(),
    fontawesomeSubset(),
    versionFile({ clientVersion }),
    ViteMinifyPlugin(),
    VitePWA({
      // injectRegister: "networkfirst",
      injectRegister: null,
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
    process.env["SENTRY"] !== null
      ? (sentryVitePlugin({
          authToken: process.env["SENTRY_AUTH_TOKEN"],
          org: "monkeytype",
          project: "frontend",
          release: {
            name: clientVersion,
          },
          applicationKey: "monkeytype-frontend",
        }) as Plugin)
      : null,
    replace([
      {
        filter: ["src/ts/firebase.ts"],
        replace: {
          from: `"./constants/firebase-config.ts"`,
          to: `"./constants/firebase-config-live.ts"`,
        },
      },
      {
        filter: ["src/email-handler.html"],
        replace: {
          from: `"./ts/constants/firebase-config"`,
          to: `"./ts/constants/firebase-config-live"`,
        },
      },
    ]),
    UnpluginInjectPreload({
      files: [
        {
          outputMatch: /css\/vendor.*\.css$/,
          attributes: {
            as: "style",
            type: "text/css",
            rel: "preload",
            crossorigin: true,
          },
        },
        {
          outputMatch: /.*\.woff2$/,
          attributes: {
            as: "font",
            type: "font/woff2",
            rel: "preload",
            crossorigin: true,
          },
        },
      ],
      injectTo: "head-prepend",
    }),
    minifyJson(),
  ];

  return {
    plugins: [...plugins, ...(isDevelopment ? devPlugins : prodPlugins)].filter(
      (it) => it !== null,
    ),
    build: isDevelopment
      ? ({
          outDir: "../dist",
        } as BuildEnvironmentOptions)
      : ({
          sourcemap: process.env["SENTRY"],
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
              assetFileNames: (assetInfo: { name: string }) => {
                let extType = assetInfo.name.split(".").at(1) as string;
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
              manualChunks: (id) => {
                if (id.includes("@sentry")) {
                  return "vendor-sentry";
                }
                if (id.includes("jquery")) {
                  return "vendor-jquery";
                }
                if (id.includes("@firebase")) {
                  return "vendor-firebase";
                }
                if (id.includes("monkeytype/packages")) {
                  return "monkeytype-packages";
                }
                if (id.includes("node_modules")) {
                  return "vendor";
                }
                return;
              },
            },
          },
        } as BuildEnvironmentOptions),
    server: {
      open: process.env["SERVER_OPEN"] !== "false",
      port: 3000,
      host: process.env["BACKEND_URL"] !== undefined,
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
        plugins: [
          // @ts-expect-error TODO maybe update the plugin?
          autoprefixer({}),
        ],
      },
      preprocessorOptions: {
        scss: {
          additionalData(source, fp) {
            if (fp.endsWith("index.scss")) {
              /** Enable for font awesome v6 */
              /*
                const fontawesomeClasses = getFontawesomeConfig();

                //inject variables into sass context
                $fontawesomeBrands: ${sassList(
                  fontawesomeClasses.brands
                )};             
                $fontawesomeSolid: ${sassList(fontawesomeClasses.solid)};
              */

              const bypassFonts = isDevelopment
                ? `
                $fontAwesomeOverride:"@fortawesome/fontawesome-free/webfonts";
                $previewFontsPath:"webfonts";`
                : "";
              const fonts = `
              ${bypassFonts}
              $fonts: (${getFontsConfig()});
              `;
              return `
              //inject variables into sass context
              ${fonts}
            
              ${source}`;
            } else {
              return source;
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ["jquery"],
      exclude: ["@fortawesome/fontawesome-free"],
    },
  };
});

/** Enable for font awesome v6 */
/*
function sassList(values) {
  return values.map((it) => `"${it}"`).join(",");
}
*/

export function getFontsConfig(): string {
  return (
    "\n" +
    Object.keys(Fonts)
      .sort()
      .map((name: string) => {
        const config = Fonts[name as KnownFontName];
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

function pad(
  numbers: number[],
  maxLength: number,
  fillString: string,
): string[] {
  return numbers.map((number) =>
    number.toString().padStart(maxLength, fillString),
  );
}

/** Enable for font awesome v6 */
/*
function sassList(values) {
  return values.map((it) => `"${it}"`).join(",");
}
*/

function getClientVersion(isDevelopment: boolean): string {
  if (isDevelopment) {
    return "DEVELOPMENT_CLIENT";
  }
  const date = new Date();
  const versionPrefix = pad(
    [date.getFullYear(), date.getMonth() + 1, date.getDate()],
    2,
    "0",
  ).join(".");
  const versionSuffix = pad([date.getHours(), date.getMinutes()], 2, "0").join(
    ".",
  );
  const version = [versionPrefix, versionSuffix].join("_");

  try {
    const commitHash = childProcess
      .execSync("git rev-parse --short HEAD")
      .toString();

    return `${version}_${commitHash}`.replace(/\n/g, "");
  } catch (e) {
    return `${version}_unknown-hash`;
  }
}
