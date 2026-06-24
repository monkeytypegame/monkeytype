import { Component } from "solid-js";

import preview from "#.storybook/preview";

import { UserBadge } from "../../src/ts/components/common/UserBadge";

const meta = preview.meta({
  title: "Common/UserBadge",
  component: UserBadge as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const Developer = meta.story({
  render: () => <UserBadge id={1} />,
});

export const Collaborator = meta.story({
  render: () => <UserBadge id={2} />,
});

export const ServerMod = meta.story({
  render: () => <UserBadge id={3} />,
});

export const OGAccount = meta.story({
  render: () => <UserBadge id={4} />,
});

export const Supporter = meta.story({
  render: () => <UserBadge id={6} />,
});

export const SugarDaddy = meta.story({
  render: () => <UserBadge id={7} />,
});

export const WhiteHat = meta.story({
  render: () => <UserBadge id={9} />,
});

export const BugHunter = meta.story({
  render: () => <UserBadge id={10} />,
});

export const Contributor = meta.story({
  render: () => <UserBadge id={12} />,
});

export const Mythical = meta.story({
  render: () => <UserBadge id={13} />,
});

export const AllYearLong = meta.story({
  render: () => <UserBadge id={14} />,
});

export const Perfection = meta.story({
  render: () => <UserBadge id={16} />,
});

export const IconOnly = meta.story({
  render: () => <UserBadge id={1} iconOnly />,
});
