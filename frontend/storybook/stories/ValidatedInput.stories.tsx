import preview from "#.storybook/preview";
import { Component } from "solid-js";
import { z } from "zod";

import { ValidatedInput } from "../../src/ts/components/ui/ValidatedInput";

const meta = preview.meta({
  title: "UI/ValidatedInput",
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

export const WithSchemaValidation = meta.story({
  render: () => (
    <ValidatedInput
      placeholder="Enter 3-20 characters..."
      schema={z.string().min(3, "Too short").max(20, "Too long")}
    />
  ),
});

export const AllVariants = meta.story({
  render: () => (
    <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
      <div>
        <div
          style={{
            "font-size": "12px",
            color: "var(--sub-color)",
            "margin-bottom": "4px",
          }}
        >
          Empty
        </div>
        <ValidatedInput placeholder="Type something..." />
      </div>
      <div>
        <div
          style={{
            "font-size": "12px",
            color: "var(--sub-color)",
            "margin-bottom": "4px",
          }}
        >
          With value
        </div>
        <ValidatedInput placeholder="Enter a value" value="hello" />
      </div>
      <div>
        <div
          style={{
            "font-size": "12px",
            color: "var(--sub-color)",
            "margin-bottom": "4px",
          }}
        >
          With schema (3-20 chars)
        </div>
        <ValidatedInput
          placeholder="Enter 3-20 characters..."
          schema={z.string().min(3, "Too short").max(20, "Too long")}
        />
      </div>
    </div>
  ),
});
