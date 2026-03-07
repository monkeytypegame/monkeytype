import preview from "#.storybook/preview";
import { fn } from "storybook/test";

import { Button } from "../../src/ts/components/common/Button";

const meta = preview.meta({
  title: "Common/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    active: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    text: {
      control: "text",
    },
    fa: {
      control: "object",
    },
    balloon: {
      control: "object",
    },
    class: {
      control: "text",
    },
    "router-link": {
      control: "boolean",
    },
    href: {
      control: "text",
    },
    sameTarget: {
      control: "boolean",
    },
  },
  args: {
    onClick: fn(),
  },
});

export const Default = meta.story({
  args: {
    text: "Button",
    type: "button",
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div class="grid grid-cols-6 gap-4 text-text">
      <div class="self-center">Button Type</div>
      <Button text="Default" onClick={fn()} />
      <Button text="Active" active={true} onClick={fn()} />
      <Button text="Disabled" disabled={true} onClick={fn()} />
      <Button
        text="Icon"
        fa={{ icon: "fa-cog", variant: "solid" }}
        onClick={fn()}
      />
      <Button fa={{ icon: "fa-cog", variant: "solid" }} onClick={fn()} />
      <div class="self-center">Text Type</div>

      <Button variant="text" text="Default" onClick={fn()} />
      <Button variant="text" text="Active" active={true} onClick={fn()} />
      <Button variant="text" text="Disabled" disabled={true} onClick={fn()} />
      <Button
        variant="text"
        text="Icon"
        fa={{ icon: "fa-cog", variant: "solid" }}
        onClick={fn()}
      />
      <Button
        variant="text"
        fa={{ icon: "fa-cog", variant: "solid" }}
        onClick={fn()}
      />
    </div>
  ),
  args: {
    text: "Button",
  },
});
