import preview from "#.storybook/preview";

import { Fa } from "../../src/ts/components/common/Fa";

const meta = preview.meta({
  title: "Monkeytype/Fa",
  component: Fa,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: { control: "text" },
    variant: {
      control: "select",
      options: ["solid", "regular", "brand"],
    },
    fixedWidth: { control: "boolean" },
    spin: { control: "boolean" },
    size: { control: "number" },
    class: { control: "text" },
  },
});

export const Default = meta.story({
  args: {
    icon: "fa-cog",
    variant: "solid",
  },
});

export const Spinning = meta.story({
  args: {
    icon: "fa-circle-notch",
    variant: "solid",
    spin: true,
  },
});

export const FixedWidth = meta.story({
  args: {
    icon: "fa-home",
    variant: "solid",
    fixedWidth: true,
  },
});

export const CustomSize = meta.story({
  args: {
    icon: "fa-star",
    variant: "solid",
    size: 3,
  },
});

export const Brand = meta.story({
  args: {
    icon: "fa-discord",
    variant: "brand",
    size: 2,
  },
});
