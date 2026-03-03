import { defineMain } from "storybook-solidjs-vite";
import tailwindcss from "@tailwindcss/vite";
import type { Plugin } from "vite";

function stubVirtualEnvConfig(): Plugin {
  const id = "virtual:env-config";
  const resolved = "\0" + id;
  return {
    name: "stub-virtual-env-config",
    resolveId(source) {
      if (source === id) return resolved;
    },
    load(loadId) {
      if (loadId === resolved) {
        return `export const envConfig = ${JSON.stringify({
          isDevelopment: true,
          backendUrl: "http://localhost:5005",
          clientVersion: "storybook",
          recaptchaSiteKey: "",
          quickLoginEmail: undefined,
          quickLoginPassword: undefined,
        })};`;
      }
    },
  };
}

function stubVirtualLanguageHashes(): Plugin {
  const id = "virtual:language-hashes";
  const resolved = "\0" + id;
  return {
    name: "stub-virtual-language-hashes",
    resolveId(source) {
      if (source === id) return resolved;
    },
    load(loadId) {
      if (loadId === resolved) {
        return `export const languageHashes = {};`;
      }
    },
  };
}

export default defineMain({
  framework: {
    name: "storybook-solidjs-vite",
    options: {
      // docgen: {
      // Enabled by default, but you can configure or disable it:
      //  see https://github.com/styleguidist/react-docgen-typescript#options
      // },
    },
  },
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-links",
    "@storybook/addon-vitest",
  ],
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  viteFinal(config) {
    config.plugins ??= [];
    config.plugins.push(tailwindcss());
    config.plugins.push(stubVirtualEnvConfig());
    config.plugins.push(stubVirtualLanguageHashes());
    return config;
  },
});
