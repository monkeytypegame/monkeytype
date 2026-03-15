import preview from "#.storybook/preview";

import { Footer } from "../../src/ts/components/layout/footer/Footer";

const meta = preview.meta({
  title: "Layout/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ padding: "16px" }}>
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({});
