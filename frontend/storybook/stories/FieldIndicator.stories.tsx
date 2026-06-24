import { AnyFieldApi } from "@tanstack/solid-form";
import { Component } from "solid-js";

import preview from "#.storybook/preview";

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
  component: FieldIndicator as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Validating = meta.story({
  render: () => (
    <FieldIndicator
      field={createFieldMock({
        isValidating: true,
      })}
    />
  ),
});

export const Warning = meta.story({
  render: () => (
    <FieldIndicator
      field={createFieldMock({
        isValid: true,
        hasWarning: true,
        warnings: ["are you sure?", "are you really sure?"],
      })}
    />
  ),
});

export const Valid = meta.story({
  render: () => (
    <FieldIndicator
      field={createFieldMock({
        isValid: true,
      })}
    />
  ),
});

export const Error = meta.story({
  render: () => (
    <FieldIndicator
      field={createFieldMock({
        isValid: false,
        errors: [
          "Failed validation",
          "Extra error",
          "very very very very very very very very very long error",
        ],
      })}
    />
  ),
});
