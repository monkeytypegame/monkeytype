import { checker } from "vite-plugin-checker";
import Inspect from "vite-plugin-inspect";
import path from "node:path";

/** @type {import("vite").UserConfig} */
export default {
  plugins: [
    checker({
      typescript: {
        tsconfigPath: path.resolve(__dirname, "./tsconfig.json"),
      },
      eslint: {
        lintCommand: `eslint "${path.resolve(__dirname, "./src/ts/**/*.ts")}"`,
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
        `,
      },
    },
  },
  define: {
    BACKEND_URL: JSON.stringify(
      process.env.BACKEND_URL || "http://localhost:5005"
    ),
    IS_DEVELOPMENT: JSON.stringify(true),
    CLIENT_VERSION: JSON.stringify("DEVELOPMENT_CLIENT"),
    RECAPTCHA_SITE_KEY: JSON.stringify(
      "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
    ),
    QUICK_LOGIN_EMAIL: JSON.stringify(process.env.QUICK_LOGIN_EMAIL),
    QUICK_LOGIN_PASSWORD: JSON.stringify(process.env.QUICK_LOGIN_PASSWORD),
  },
  build: {
    outDir: "../dist",
  },
};
