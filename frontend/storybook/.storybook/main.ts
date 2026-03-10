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

function patchQsrToNotThrow(): Plugin {
  return {
    name: "patch-qsr-not-throw",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("utils/dom")) return;
      // Replace the throw in qsr with creating a dummy element
      return code.replaceAll(
        `throw new Error(\`Required element not found: \${selector}\`);`,
        `console.warn(\`[storybook] qsr: element not found: \${selector}, returning dummy\`);
    return new ElementWithUtils(document.createElement("div") as T);`,
      );
    },
  };
}

function patchAnimatedModalToNotThrow(): Plugin {
  return {
    name: "patch-animated-modal-not-throw",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("utils/animated-modal")) return;
      return code
        .replaceAll(
          `throw new Error(
        \`Dialog element with id \${constructorParams.dialogId} not found\`,
      );`,
          `console.warn(\`[storybook] AnimatedModal: dialog #\${constructorParams.dialogId} not found\`); return;`,
        )
        .replace(
          `throw new Error("Animated dialog must be an HTMLDialogElement");`,
          `console.warn("[storybook] AnimatedModal: element is not a dialog"); return;`,
        );
    },
  };
}

function stubChartController(): Plugin {
  const stubId = "\0stub-chart-controller";
  const stubCode = `
    const noop = () => {};
    const fakeScale = new Proxy({}, { get: () => "" , set: () => true });
    const fakeDataset = new Proxy({}, { get: () => [], set: () => true });
    const fakeChart = {
      data: { labels: [] },
      options: { plugins: {} },
      getDataset: () => fakeDataset,
      getScale: () => fakeScale,
      update: noop,
      resize: noop,
    };
    export class ChartWithUpdateColors {}
    export const result = fakeChart;
    export const accountHistory = fakeChart;
    export const accountActivity = fakeChart;
    export const accountHistogram = fakeChart;
    export const miniResult = fakeChart;
    export let accountHistoryActiveIndex = 0;
    export function updateAccountChartButtons() {}
  `;
  return {
    name: "stub-chart-controller",
    enforce: "pre",
    resolveId(source, _importer) {
      if (
        source.endsWith("controllers/chart-controller") ||
        source.endsWith("controllers/chart-controller.ts")
      ) {
        return stubId;
      }
    },
    load(id) {
      if (id === stubId) return stubCode;
      if (id.includes("controllers/chart-controller")) return stubCode;
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
  staticDirs: ["../../static"],
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
    config.plugins.push(patchQsrToNotThrow());
    config.plugins.push(patchAnimatedModalToNotThrow());
    config.plugins.push(stubChartController());
    return config;
  },
});
