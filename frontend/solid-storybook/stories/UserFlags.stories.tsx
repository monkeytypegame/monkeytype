import preview from "#.storybook/preview";

import { UserFlags } from "../../src/ts/components/common/UserFlags";

const meta = preview.meta({
  title: "Monkeytype/UserFlags",
  component: UserFlags,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isPremium: { control: "boolean" },
    banned: { control: "boolean" },
    lbOptOut: { control: "boolean" },
    isFriend: { control: "boolean" },
    iconsOnly: { control: "boolean" },
  },
});

export const PrimeApe = meta.story({
  args: {
    isPremium: true,
  },
});

export const Banned = meta.story({
  args: {
    banned: true,
  },
});

export const LbOptOut = meta.story({
  args: {
    lbOptOut: true,
  },
});

export const Friend = meta.story({
  args: {
    isFriend: true,
  },
});

export const AllFlags = meta.story({
  args: {
    isPremium: true,
    banned: true,
    lbOptOut: true,
    isFriend: true,
  },
});

export const AllFlagsIconsOnly = meta.story({
  args: {
    isPremium: true,
    banned: true,
    lbOptOut: true,
    isFriend: true,
    iconsOnly: true,
  },
});
