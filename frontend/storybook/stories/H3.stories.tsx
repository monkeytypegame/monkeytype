import { Component } from "solid-js";

import preview from "#.storybook/preview";

import { H3 } from "../../src/ts/components/common/Headers";

const meta = preview.meta({
  title: "Common/H3",
  component: H3 as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => (
    <H3 text="Sub Section" fa={{ icon: "fa-cog", variant: "solid" }} />
  ),
});

export const WithDifferentIcon = meta.story({
  render: () => (
    <H3 text="Appearance" fa={{ icon: "fa-paint-brush", variant: "solid" }} />
  ),
});
