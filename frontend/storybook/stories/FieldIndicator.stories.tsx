import preview from "#.storybook/preview";
import { AnyFieldApi } from "@tanstack/solid-form";
import { Component } from "solid-js";

import { FieldIndicator } from "../../src/ts/components/ui/form/FieldIndicator";

type MetaState = {
  isTouched?: boolean;
  isValid?: boolean;
  isValidating?: boolean;
  errors?: string[];
  hasWarning?: boolean;
  warnings?: string[];
};

function createFieldMock(meta: MetaState) {
  const stateMeta = {
    isTouched: true,
    isValid: true,
    isValidating: false,
    errors: [],
    ...meta,
  };

  return {
    get state() {
      return {
        meta: stateMeta,
      };
    },

    getMeta() {
      return {
        hasWarning: meta.hasWarning ?? false,
        warnings: meta.warnings ?? [],
      };
    },
  } as unknown as AnyFieldApi;
}

const meta = preview.meta({
  title: "UI/Form/FieldIndicator",
  component: FieldIndicator as Component<{
    field?: AnyFieldApi;
  }>,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
});

export const Validating = meta.story({
  args: {
    field: createFieldMock({
      isValidating: true,
    }),
  },
});

export const Warning = meta.story({
  args: {
    field: createFieldMock({
      isValid: true,
      hasWarning: true,
      warnings: ["are you sure?", "are you really sure?"],
    }),
  },
});

export const Valid = meta.story({
  args: {
    field: createFieldMock({
      isValid: true,
    }),
  },
});

export const Error = meta.story({
  args: {
    field: createFieldMock({
      isValid: false,
      errors: [
        "Failed validation",
        "Extra error",
        "very very very very very very very very very long error",
      ],
    }),
  },
});
