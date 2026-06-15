import { Component } from "solid-js";

import preview from "#.storybook/preview";

import { Bar } from "../../src/ts/components/common/Bar";

const meta = preview.meta({
  title: "Common/Bar",
  component: Bar as Component,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => <Bar percent={50} fill="main" bg="sub-alt" />,
});

export const Full = meta.story({
  render: () => <Bar percent={100} fill="main" bg="sub-alt" />,
});

export const HalfWithHover = meta.story({
  render: () => (
    <Bar percent={50} fill="main" bg="sub-alt" showPercentageOnHover />
  ),
});

export const TextFill = meta.story({
  render: () => <Bar percent={75} fill="text" bg="sub-alt" />,
});
