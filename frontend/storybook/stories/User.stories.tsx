import preview from "#.storybook/preview";

import { User } from "../../src/ts/components/common/User";

const meta = preview.meta({
  title: "Common/User",
  component: User,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    showAvatar: { control: "boolean" },
    iconsOnly: { control: "boolean" },
    isFriend: { control: "boolean" },
  },
});

export const Default = meta.story({
  args: {
    user: {
      uid: "user123",
      name: "monkeytyper",
      discordId: undefined,
      discordAvatar: undefined,
    },
  },
});

export const WithBadge = meta.story({
  args: {
    user: {
      uid: "user123",
      name: "monkeytyper",
      discordId: undefined,
      discordAvatar: undefined,
      badgeId: 1,
    },
  },
});

export const Premium = meta.story({
  args: {
    user: {
      uid: "user123",
      name: "monkeytyper",
      discordId: undefined,
      discordAvatar: undefined,
      badgeId: 6,
      isPremium: true,
    },
  },
});

export const Friend = meta.story({
  args: {
    user: {
      uid: "user123",
      name: "monkeytyper",
      discordId: undefined,
      discordAvatar: undefined,
    },
    isFriend: true,
  },
});

export const Banned = meta.story({
  args: {
    user: {
      uid: "user123",
      name: "monkeytyper",
      discordId: undefined,
      discordAvatar: undefined,
      banned: true,
    },
  },
});

export const NoAvatar = meta.story({
  args: {
    user: {
      uid: "user123",
      name: "monkeytyper",
      discordId: undefined,
      discordAvatar: undefined,
      badgeId: 13,
      isPremium: true,
    },
    showAvatar: false,
  },
});

export const FullyLoaded = meta.story({
  args: {
    user: {
      uid: "user123",
      name: "monkeytyper",
      discordId: undefined,
      discordAvatar: undefined,
      badgeId: 1,
      isPremium: true,
    },
    isFriend: true,
  },
});
