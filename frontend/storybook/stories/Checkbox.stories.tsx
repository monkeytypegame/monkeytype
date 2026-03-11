import preview from "#.storybook/preview";
import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, Component } from "solid-js";

import { Checkbox } from "../../src/ts/components/ui/form/Checkbox";

function createFieldMock(options: { name?: string; value?: boolean }) {
  return {
    name: options.name ?? "test",
    get state() {
      return {
        value: options.value ?? false,
      };
    },
  } as unknown as AnyFieldApi;
}

const meta = preview.meta({
  title: "UI/Form/Checkbox",
  component: Checkbox as Component<{
    field: Accessor<AnyFieldApi>;
    label?: string;
    disabled?: boolean;
  }>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    disabled: { control: "boolean" },
  },
});

export const Unchecked = meta.story({
  args: {
    field: () => createFieldMock({}),
  },
});

export const Checked = meta.story({
  args: {
    field: () => createFieldMock({ value: true }),
  },
});

export const Disabled = meta.story({
  args: {
    disabled: true,
    field: () => createFieldMock({}),
  },
});

export const withLabel = meta.story({
  args: {
    label: "checkbox",
    field: () => createFieldMock({ value: true }),
  },
});
