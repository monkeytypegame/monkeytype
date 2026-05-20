import preview from "#.storybook/preview";
import { AnyFieldApi } from "@tanstack/solid-form";
import { Component, Accessor } from "solid-js";

import { InputField } from "../../src/ts/components/ui/form/InputField";

type MetaState = {
  isTouched?: boolean;
  isValid?: boolean;
  isValidating?: boolean;
  errors?: string[];
  hasWarning?: boolean;
  warnings?: string[];
};

function createFieldMock(options: {
  name?: string;
  value?: string;
  meta?: MetaState;
  validators?: object;
}) {
  const stateMeta = {
    isTouched: true,
    isValid: true,
    isValidating: false,
    errors: [],
    ...(options.meta ?? {}),
  };
  return {
    name: options.name ?? "test",
    options: {
      validators: options.validators,
    },
    get state() {
      return {
        value: options.value ?? "",
        meta: stateMeta,
      };
    },
    getMeta() {
      return {
        hasWarning: options.meta?.hasWarning ?? false,
        warnings: options.meta?.warnings ?? [],
      };
    },
  } as unknown as AnyFieldApi;
}

const meta = preview.meta({
  title: "UI/Form/InputField",
  component: InputField as Component<{
    field: Accessor<AnyFieldApi>;
    placeholder?: string;
    autocomplete?: string;
    type?: string;
    disabled?: boolean;
    onFocus?: () => void;
  }>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: { control: "text" },
    autocomplete: { control: "text" },
    type: { control: "text" },
    disabled: { control: "boolean" },
  },
});

export const Default = meta.story({
  args: {
    field: () => createFieldMock({}),
  },
});

export const withIndicator = meta.story({
  args: {
    field: () =>
      createFieldMock({
        validators: { onChange: () => undefined },
      }),
  },
});

export const withPlaceholder = meta.story({
  args: {
    placeholder: "placeholder",
    field: () => createFieldMock({}),
  },
});

export const withAutocomplete = meta.story({
  args: {
    autocomplete: "autocomplete",
    field: () => createFieldMock({}),
  },
});

export const withTypePassword = meta.story({
  args: {
    type: "password",
    placeholder: "password",
    field: () => createFieldMock({ value: "test" }),
  },
});

export const disabled = meta.story({
  args: {
    disabled: true,
    field: () => createFieldMock({ value: "test", meta: { isValid: true } }),
  },
});
