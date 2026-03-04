import preview from "#.storybook/preview";

import { UserFlags } from "../../src/ts/components/common/UserFlags";

const meta = preview.meta({
  title: "Common/UserFlags",
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
