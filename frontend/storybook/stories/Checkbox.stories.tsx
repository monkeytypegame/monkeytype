import preview from "#.storybook/preview";
import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, Component, createSignal } from "solid-js";

import { Checkbox } from "../../src/ts/components/ui/form/Checkbox";

function createFieldMock(options: { name?: string; value?: boolean }) {
  const [value, setValue] = createSignal(options.value ?? false);
  return {
    name: options.name ?? "test",
    get state() {
      return { value: value() };
    },
    handleChange(v: boolean) {
      setValue(v);
    },
    handleBlur() {},
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

export const Default = meta.story({
  render: () => {
    const unchecked = createFieldMock({});
    const checked = createFieldMock({ value: true });
    const checked2xl = createFieldMock({ value: true });
    const disabledUnchecked = createFieldMock({});
    const disabledChecked = createFieldMock({ value: true });
    const withLabel = createFieldMock({ value: true });

    return (
      <div class="grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-3 text-text">
        <div class="text-xs text-sub">Unchecked</div>
        <Checkbox field={() => unchecked} />
        <div class="text-xs text-sub">Checked</div>
        <Checkbox field={() => checked} />
        <div class="text-xs text-sub">Checked 2xl</div>
        <Checkbox class="text-2xl" field={() => checked2xl} />
        <div class="text-xs text-sub">Disabled</div>
        <Checkbox field={() => disabledUnchecked} disabled={true} />
        <div class="text-xs text-sub">Disabled Checked</div>
        <Checkbox field={() => disabledChecked} disabled={true} />
        <div class="text-xs text-sub">With Label</div>
        <Checkbox field={() => withLabel} label="checkbox" />
      </div>
    );
  },
});
