import preview from "#.storybook/preview";
import { fn } from "storybook/test";

import { Button } from "../../src/ts/components/common/Button";

const meta = preview.meta({
  title: "Monkeytype/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["button", "text"],
    },
  },
  args: {
    onClick: fn(),
  },
});

export const Default = meta.story({
  args: {
    text: "Button",
  },
});

export const WithIcon = meta.story({
  args: {
    text: "Settings",
    fa: { icon: "fa-cog", variant: "solid" },
    type: "button",
  },
});

export const IconOnly = meta.story({
  args: {
    fa: { icon: "fa-cog", variant: "solid" },
    ariaLabel: "Settings",
  },
});

export const TextType = meta.story({
  args: {
    text: "Text Button",
    type: "text",
  },
});

export const Active = meta.story({
  args: {
    text: "Active",
    active: true,
  },
});

export const Disabled = meta.story({
  args: {
    text: "Disabled",
    disabled: true,
  },
});

export const ActiveDisabled = meta.story({
  args: {
    text: "Active + Disabled",
    active: true,
    disabled: true,
  },
});

export const AsLink = meta.story({
  args: {
    text: "External Link",
    href: "https://monkeytype.com",
    fa: { icon: "fa-external-link-alt", variant: "solid" },
  },
});
