import { Component } from "solid-js";

import preview from "#.storybook/preview";

import { H2 } from "../../src/ts/components/common/Headers";

const metaH2 = preview.meta({
  title: "Common/H2",
  component: H2 as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Default = metaH2.story({
  render: () => <H2 text="Section Header" />,
});

export const WithIcon = metaH2.story({
  render: () => (
    <H2 text="Settings" fa={{ icon: "fa-cog", variant: "solid" }} />
  ),
});
