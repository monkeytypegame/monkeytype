import { Component } from "solid-js";

import preview from "#.storybook/preview";

import { NotificationBubble } from "../../src/ts/components/common/NotificationBubble";

const meta = preview.meta({
  title: "Common/NotificationBubble",
  component: NotificationBubble as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
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
  render: () => <NotificationBubble variant="fromCorner" show />,
});

export const AtCorner = meta.story({
  render: () => <NotificationBubble variant="atCorner" show />,
});

export const Center = meta.story({
  render: () => <NotificationBubble variant="center" show />,
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
