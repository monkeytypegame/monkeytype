import preview from "#.storybook/preview";

import { H3 } from "../../src/ts/components/common/Headers";

const meta = preview.meta({
  title: "Common/H3",
  component: H3,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  args: {
    text: "Sub Section",
    fa: { icon: "fa-cog", variant: "solid" },
  },
});

export const WithDifferentIcon = meta.story({
  args: {
    text: "Appearance",
    fa: { icon: "fa-paint-brush", variant: "solid" },
  },
});
