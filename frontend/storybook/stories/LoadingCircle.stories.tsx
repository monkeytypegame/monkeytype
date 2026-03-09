import preview from "#.storybook/preview";

import { LoadingCircle } from "../../src/ts/components/common/LoadingCircle";

const meta = preview.meta({
  title: "Common/LoadingCircle",
  component: LoadingCircle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    mode: {
      control: "select",
      options: ["icon", "svg"],
    },
    class: { control: "text" },
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div style={{ display: "flex", gap: "32px", "align-items": "center" }}>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <LoadingCircle mode="icon" />
        <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
          Icon
        </div>
      </div>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <LoadingCircle mode="svg" class="h-8 w-8" />
        <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
          SVG
        </div>
      </div>
    </div>
  ),
});
