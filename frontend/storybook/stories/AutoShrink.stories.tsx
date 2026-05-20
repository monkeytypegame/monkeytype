import preview from "#.storybook/preview";

import { AutoShrink } from "../../src/ts/components/common/AutoShrink";

const meta = preview.meta({
  title: "Common/AutoShrink",
  component: AutoShrink,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    upperLimitRem: { control: "number" },
    class: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", "flex-direction": "column", gap: "24px" }}>
        <div>
          <div style={{ "font-size": "12px", "margin-bottom": "4px" }}>
            400px container
          </div>
          <div
            style={{
              width: "400px",
              border: "1px dashed gray",
              padding: "8px",
              resize: "horizontal",
              overflow: "auto",
            }}
          >
            <Story />
          </div>
        </div>
        <div>
          <div style={{ "font-size": "12px", "margin-bottom": "4px" }}>
            200px container
          </div>
          <div
            style={{
              width: "200px",
              border: "1px dashed gray",
              padding: "8px",
              resize: "horizontal",
              overflow: "auto",
            }}
          >
            <Story />
          </div>
        </div>
        <div>
          <div style={{ "font-size": "12px", "margin-bottom": "4px" }}>
            100px container
          </div>
          <div
            style={{
              width: "100px",
              border: "1px dashed gray",
              padding: "8px",
              resize: "horizontal",
              overflow: "auto",
            }}
          >
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    upperLimitRem: 2,
    children: "Short",
  },
});

export const LongText = meta.story({
  args: {
    upperLimitRem: 2,
    children: "This is a much longer piece of text that should shrink to fit",
  },
});

export const LargeUpperLimit = meta.story({
  args: {
    upperLimitRem: 4,
    children: "Big text",
  },
});
