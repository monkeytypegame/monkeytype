import preview from "#.storybook/preview";

import { LoadingCircle } from "../../src/ts/components/common/LoadingCircle";

const meta = preview.meta({
  title: "Monkeytype/LoadingCircle",
  component: LoadingCircle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    mode: {
      control: "select",
      options: ["icon", "svg"],
    },
    class: { control: "text" },
  },
});

export const Icon = meta.story({
  args: {
    mode: "icon",
  },
});

export const Svg = meta.story({
  args: {
    mode: "svg",
  },
});
