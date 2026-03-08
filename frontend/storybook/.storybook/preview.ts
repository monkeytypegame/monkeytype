import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { definePreview } from "storybook-solidjs-vite";

import "../stories/tailwind.css";
import "../stories/storybook-theme.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "balloon-css/balloon.min.css";
import "slim-select/styles";

import { ThemesList } from "../../src/ts/constants/themes";
import { ThemeDecorator } from "./ThemeDecorator";

export default definePreview({
  addons: [addonDocs(), addonA11y()],
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: ThemesList.sort((a, b) => a.name.localeCompare(b.name)).map(
          (t) => ({
            value: t.name,
            title: t.name.replace(/_/g, " "),
          }),
        ),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "serika_dark",
  },
  decorators: [ThemeDecorator],
  parameters: {
    // automatically create action args for all props that start with 'on'
    actions: {
      argTypesRegex: "^on.*",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  // All components will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  // tags: ['autodocs'],
});
