import preview from "#.storybook/preview";
import { Component } from "solid-js";

import { NotificationBubble } from "../../src/ts/components/common/NotificationBubble";

const meta = preview.meta({
  title: "Common/NotificationBubble",
  component: NotificationBubble,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["fromCorner", "atCorner", "center"],
    },
    show: { control: "boolean" },
  },
  decorators: [
    (Story: Component) => (
      <div
        style={{
          position: "relative",
          width: "48px",
          height: "48px",
          "background-color": "var(--sub-alt-color)",
          "border-radius": "8px",
        }}
      >
        <Story />
      </div>
    ),
  ],
});

export const FromCorner = meta.story({
  args: {
    variant: "fromCorner",
    show: true,
  },
});

export const AtCorner = meta.story({
  args: {
    variant: "atCorner",
    show: true,
  },
});

export const Center = meta.story({
  args: {
    variant: "center",
    show: true,
  },
});

export const AllVariants = meta.story({
  decorators: [
    () => (
      <div style={{ display: "flex", gap: "32px" }}>
        {(["fromCorner", "atCorner", "center"] as const).map((variant) => (
          <div
            style={{
              display: "flex",
              "flex-direction": "column",
              "align-items": "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "48px",
                height: "48px",
                "background-color": "var(--sub-alt-color)",
                "border-radius": "8px",
              }}
            >
              <NotificationBubble variant={variant} show />
            </div>
            <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
              {variant}
            </div>
          </div>
        ))}
      </div>
    ),
  ],
});
