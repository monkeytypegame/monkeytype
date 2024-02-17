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

/** @type {UserConfig} */
const BASE_CONFIG = {
  plugins: [
    inject({
      select2: "select2",
      $: "jquery",
      jQuery: "jquery",
      jQueryColor: "jquery-color",
      jQueryEasing: "jquery.easing",
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
  },
  optimizeDeps: {
    include: ["select2", "jquery", "jquery-color", "jquery.easing"],
  },
};

/** @type {UserConfig} */
const BUILD_CONFIG = {
  define: {
    BACKEND_URL: JSON.stringify("https://api.monkeytype.com"),
    IS_DEVELOPMENT: JSON.stringify(false),
  },
};

export default defineConfig(({ command }) => {
  if (command === "build") {
    return mergeConfig(BASE_CONFIG, BUILD_CONFIG);
  } else {
    return BASE_CONFIG;
  }
});
