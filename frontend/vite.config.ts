import {
  defineConfig,
  loadEnv,
  UserConfig,
  BuildEnvironmentOptions,
  PluginOption,
  Plugin,
  CSSOptions,
} from "vite";
import path from "node:path";
import injectHTML from "vite-plugin-html-inject";
import childProcess from "child_process";
import autoprefixer from "autoprefixer";
import { Fonts } from "./src/ts/constants/fonts";
import { fontawesomeSubset } from "./vite-plugins/fontawesome-subset";
import { fontPreview } from "./vite-plugins/font-preview";
import { envConfig } from "./vite-plugins/env-config";
import { languageHashes } from "./vite-plugins/language-hashes";
import { minifyJson } from "./vite-plugins/minify-json";
import { versionFile } from "./vite-plugins/version-file";
import { oxlintChecker } from "./vite-plugins/oxlint-checker";
import { injectPreload } from "./vite-plugins/inject-preload";
import Inspect from "vite-plugin-inspect";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import replace from "vite-plugin-filter-replace";
import { KnownFontName } from "@monkeytype/schemas/fonts";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

function getFontsConfig(): string {
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

/** Enable for font awesome v6 */
/*
function sassList(values) {
  return values.map((it) => `"${it}"`).join(",");
}
*/

function getPlugins({
  isDevelopment,
  env,
  useSentry,
}: {
  isDevelopment: boolean;
  env: Record<string, string>;
  useSentry: boolean;
}): PluginOption[] {
  const clientVersion = getClientVersion(isDevelopment);

  const plugins: PluginOption[] = [
    envConfig({ isDevelopment, clientVersion, env }),
    languageHashes({ skip: isDevelopment }),
    oxlintChecker({
      debounceDelay: 125,
      typeAware: true,
      overlay: isDevelopment,
    }),
    injectHTML() as PluginOption,
    tailwindcss(),
    solidPlugin(),
  ];

  const devPlugins: PluginOption[] = [Inspect()];

  const prodPlugins: PluginOption[] = [
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
    useSentry
      ? (sentryVitePlugin({
          authToken: env["SENTRY_AUTH_TOKEN"],
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
    ]) as PluginOption,
    injectPreload(),
    minifyJson(),
  ];

  return [...plugins, ...(isDevelopment ? devPlugins : prodPlugins)].filter(
    (it) => it !== null,
  );
}

function getBuildOptions({
  enableSourceMaps,
}: {
  enableSourceMaps: boolean;
}): BuildEnvironmentOptions {
  return {
    sourcemap: enableSourceMaps,
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
          let extType = (assetInfo.names[0] as string).split(".").at(1);

          if (extType === undefined) {
            throw new Error(
              `Could not determine asset type for asset: ${assetInfo.names[0]}`,
            );
          }

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "images";
          }
          if (
            /\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.names[0] as string)
          ) {
            return `webfonts/[name]-[hash].${extType}`;
          }
          // oxlint-disable-next-line no-deprecated
          if (assetInfo.name === "misc.css") {
            return `${extType}/vendor.[hash][extname]`;
          }

          return `${extType}/[name].[hash][extname]`;
        },
        chunkFileNames: "js/[name].[hash].js",
        entryFileNames: "js/[name].[hash].js",
        manualChunks: (id) => {
          if (id.includes("@sentry")) {
            return "vendor-sentry";
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
  } as BuildEnvironmentOptions;
}

function getCssOptions({
  isDevelopment,
}: {
  isDevelopment: boolean;
}): CSSOptions {
  return {
    devSourcemap: true,
    postcss: {
      plugins: [autoprefixer({})],
    },
    preprocessorOptions: {
      scss: {
        additionalData(source, fp) {
          if (isDevelopment || fp.endsWith("index.scss")) {
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
  };
}

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd(), "");
  const useSentry = env["SENTRY"] !== undefined;
  const isDevelopment = mode !== "production";

  if (!isDevelopment) {
    if (env["RECAPTCHA_SITE_KEY"] === undefined) {
      throw new Error(`${mode}: RECAPTCHA_SITE_KEY is not defined`);
    }
    if (useSentry && env["SENTRY_AUTH_TOKEN"] === undefined) {
      throw new Error(`${mode}: SENTRY_AUTH_TOKEN is not defined`);
    }
  }

  return {
    plugins: getPlugins({ isDevelopment, useSentry: useSentry, env }),
    build: getBuildOptions({ enableSourceMaps: useSentry }),
    css: getCssOptions({ isDevelopment }),
    server: {
      open: env["SERVER_OPEN"] !== "false",
      port: 3000,
      host: env["BACKEND_URL"] !== undefined,
      watch: {
        //we rebuild the whole contracts package when a file changes
        //so we only want to watch one file
        ignored: [/.*\/packages\/contracts\/dist\/(?!configs).*/],
      },
    },
    clearScreen: false,
    root: "src",
    publicDir: "../static",
    optimizeDeps: {
      exclude: ["@fortawesome/fontawesome-free"],
    },
  };
});
