import preview from "#.storybook/preview";

import { Separator } from "../../src/ts/components/common/Separator";

const meta = preview.meta({
  title: "Common/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    vertical: { control: "boolean" },
    class: { control: "text" },
  },
});

export const Horizontal = meta.story({
  args: {},
  render: (props) => (
    <div style={{ width: "300px" }}>
      <div style={{ color: "var(--text-color)", "margin-bottom": "8px" }}>
        Above
      </div>
      <Separator {...props} />
      <div style={{ color: "var(--text-color)", "margin-top": "8px" }}>
        Below
      </div>
    </div>
  ),
});

export const Vertical = meta.story({
  args: {
    vertical: true,
  },
  render: (props) => (
    <div style={{ display: "flex", gap: "8px", height: "60px" }}>
      <span style={{ color: "var(--text-color)" }}>Left</span>
      <Separator {...props} />
      <span style={{ color: "var(--text-color)" }}>Right</span>
    </div>
  ),
});
