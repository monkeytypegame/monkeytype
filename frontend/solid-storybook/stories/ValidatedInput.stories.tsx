import preview from "#.storybook/preview";
import { Component } from "solid-js";

import { ValidatedInput } from "../../src/ts/components/ui/ValidatedInput";

const meta = preview.meta({
  title: "Monkeytype/ValidatedInput",
  component: ValidatedInput as Component<{
    value?: string;
    placeholder?: string;
    class?: string;
  }>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text" },
    placeholder: { control: "text" },
    class: { control: "text" },
  },
});

export const Default = meta.story({
  args: {
    placeholder: "Type something...",
  },
});

export const WithValue = meta.story({
  args: {
    placeholder: "Enter a value",
    value: "hello",
  },
});
