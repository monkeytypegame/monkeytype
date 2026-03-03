import preview from "#.storybook/preview";

import { AutoShrink } from "../../src/ts/components/common/AutoShrink";

const meta = preview.meta({
  title: "Monkeytype/AutoShrink",
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
      <div style={{ width: "200px", border: "1px solid var(--sub-color)" }}>
        <Story />
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
