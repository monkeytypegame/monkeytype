import preview from "#.storybook/preview";

import { Logo } from "../../src/ts/components/layout/header/Logo";

const meta = preview.meta({
  title: "Layout/Header/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({});
