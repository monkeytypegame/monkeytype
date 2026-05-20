import preview from "#.storybook/preview";

import { Fa } from "../../src/ts/components/common/Fa";

const meta = preview.meta({
  title: "Common/Fa",
  component: Fa,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    icon: { control: "text" },
    variant: {
      control: "select",
      options: ["solid", "regular", "brand"],
    },
    fixedWidth: { control: "boolean" },
    spin: { control: "boolean" },
    size: { control: "number" },
    class: { control: "text" },
  },
});

export const Default = meta.story({
  args: {
    icon: "fa-cog",
    variant: "solid",
  },
});

export const Spinning = meta.story({
  args: {
    icon: "fa-circle-notch",
    variant: "solid",
    spin: true,
  },
});

export const FixedWidth = meta.story({
  args: {
    icon: "fa-home",
    variant: "solid",
    fixedWidth: true,
  },
});

export const CustomSize = meta.story({
  args: {
    icon: "fa-star",
    variant: "solid",
    size: 3,
  },
});

export const Brand = meta.story({
  args: {
    icon: "fa-discord",
    variant: "brand",
    size: 2,
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div
      style={{
        display: "grid",
        "grid-template-columns": "auto repeat(3, 1fr)",
        gap: "16px",
        "align-items": "center",
        "font-size": "1.5em",
      }}
    >
      <div style={{ "font-size": "10px", color: "var(--sub-color)" }} />
      <div style={{ "font-size": "10px", color: "var(--sub-color)" }}>
        Solid
      </div>
      <div style={{ "font-size": "10px", color: "var(--sub-color)" }}>
        Regular
      </div>
      <div style={{ "font-size": "10px", color: "var(--sub-color)" }}>
        Brand
      </div>

      <div style={{ "font-size": "10px", color: "var(--sub-color)" }}>
        Default
      </div>
      <Fa icon="fa-cog" variant="solid" />
      <Fa icon="fa-circle" variant="regular" />
      <Fa icon="fa-discord" variant="brand" />

      <div style={{ "font-size": "10px", color: "var(--sub-color)" }}>
        Fixed Width
      </div>
      <Fa icon="fa-cog" variant="solid" fixedWidth />
      <Fa icon="fa-circle" variant="regular" fixedWidth />
      <Fa icon="fa-discord" variant="brand" fixedWidth />

      <div style={{ "font-size": "10px", color: "var(--sub-color)" }}>
        Spinning
      </div>
      <Fa icon="fa-circle-notch" variant="solid" spin />
      <Fa icon="fa-circle-notch" variant="solid" spin />
      <div />

      <div style={{ "font-size": "10px", color: "var(--sub-color)" }}>
        Sizes
      </div>
      <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
        <Fa icon="fa-star" variant="solid" size={1} />
        <Fa icon="fa-star" variant="solid" size={2} />
        <Fa icon="fa-star" variant="solid" size={3} />
      </div>
      <div />
      <div />
    </div>
  ),
});
