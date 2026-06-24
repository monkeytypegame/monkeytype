import { AnyFieldApi } from "@tanstack/solid-form";
import { Component } from "solid-js";

import preview from "#.storybook/preview";

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
  component: InputField as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => <InputField field={() => createFieldMock({})} />,
});

export const withIndicator = meta.story({
  render: () => (
    <InputField
      field={() =>
        createFieldMock({
          validators: { onChange: () => undefined },
        })
      }
    />
  ),
});

export const withPlaceholder = meta.story({
  render: () => (
    <InputField placeholder="placeholder" field={() => createFieldMock({})} />
  ),
});

export const withAutocomplete = meta.story({
  render: () => (
    <InputField autocomplete="autocomplete" field={() => createFieldMock({})} />
  ),
});

export const withTypePassword = meta.story({
  render: () => (
    <InputField
      type="password"
      placeholder="password"
      field={() => createFieldMock({ value: "test" })}
    />
  ),
});

export const disabled = meta.story({
  render: () => (
    <InputField
      disabled
      field={() => createFieldMock({ value: "test", meta: { isValid: true } })}
    />
  ),
});
