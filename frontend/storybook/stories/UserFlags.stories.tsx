import { Component } from "solid-js";

import preview from "#.storybook/preview";

import { UserFlags } from "../../src/ts/components/common/UserFlags";

const meta = preview.meta({
  title: "Common/UserFlags",
  component: UserFlags as Component,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
});

export const PrimeApe = meta.story({
  render: () => <UserFlags isPremium />,
});

export const Banned = meta.story({
  render: () => <UserFlags banned />,
});

export const LbOptOut = meta.story({
  render: () => <UserFlags lbOptOut />,
});

export const Friend = meta.story({
  render: () => <UserFlags isFriend />,
});

export const AllFlags = meta.story({
  render: () => <UserFlags isPremium banned lbOptOut isFriend />,
});

export const AllFlagsIconsOnly = meta.story({
  render: () => <UserFlags isPremium banned lbOptOut isFriend iconsOnly />,
});

export const AllVariants = meta.story({
  render: () => (
    <div
      style={{
        display: "grid",
        "grid-template-columns": "auto 1fr 1fr",
        gap: "12px",
        "align-items": "center",
      }}
    >
      <div style={{ "font-size": "12px", color: "var(--sub-color)" }} />
      <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>Full</div>
      <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
        Icon Only
      </div>

      <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
        Premium
      </div>
      <UserFlags isPremium />
      <UserFlags isPremium iconsOnly />

      <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
        Banned
      </div>
      <UserFlags banned />
      <UserFlags banned iconsOnly />

      <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
        LB Opt Out
      </div>
      <UserFlags lbOptOut />
      <UserFlags lbOptOut iconsOnly />

      <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
        Friend
      </div>
      <UserFlags isFriend />
      <UserFlags isFriend iconsOnly />

      <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>All</div>
      <UserFlags isPremium banned lbOptOut isFriend />
      <UserFlags isPremium banned lbOptOut isFriend iconsOnly />
    </div>
  ),
});
