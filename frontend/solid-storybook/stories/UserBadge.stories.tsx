import preview from "#.storybook/preview";

import { UserBadge } from "../../src/ts/components/common/UserBadge";

const meta = preview.meta({
  title: "Common/UserBadge",
  component: UserBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: { type: "select" },
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    },
    iconOnly: { control: "boolean" },
  },
});

export const Developer = meta.story({
  args: { id: 1 },
});

export const Collaborator = meta.story({
  args: { id: 2 },
});

export const ServerMod = meta.story({
  args: { id: 3 },
});

export const OGAccount = meta.story({
  args: { id: 4 },
});

export const Supporter = meta.story({
  args: { id: 6 },
});

export const SugarDaddy = meta.story({
  args: { id: 7 },
});

export const WhiteHat = meta.story({
  args: { id: 9 },
});

export const BugHunter = meta.story({
  args: { id: 10 },
});

export const Contributor = meta.story({
  args: { id: 12 },
});

export const Mythical = meta.story({
  args: { id: 13 },
});

export const AllYearLong = meta.story({
  args: { id: 14 },
});

export const Perfection = meta.story({
  args: { id: 16 },
});

export const IconOnly = meta.story({
  args: { id: 1, iconOnly: true },
});
