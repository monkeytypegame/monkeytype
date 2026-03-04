import preview from "#.storybook/preview";

import { Bar } from "../../src/ts/components/common/Bar";

const meta = preview.meta({
  title: "Common/Bar",
  component: Bar,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    percent: { control: { type: "range", min: 0, max: 100 } },
    fill: { control: "select", options: ["main", "text"] },
    bg: { control: "select", options: ["bg", "sub-alt"] },
    showPercentageOnHover: { control: "boolean" },
    animationDuration: { control: "number" },
  },
});

export const Default = meta.story({
  args: {
    percent: 50,
    fill: "main",
    bg: "sub-alt",
  },
});

export const Full = meta.story({
  args: {
    percent: 100,
    fill: "main",
    bg: "sub-alt",
  },
});

export const HalfWithHover = meta.story({
  args: {
    percent: 50,
    fill: "main",
    bg: "sub-alt",

    showPercentageOnHover: true,
  },
});

export const TextFill = meta.story({
  args: {
    percent: 75,
    fill: "text",
    bg: "sub-alt",
  },
});
