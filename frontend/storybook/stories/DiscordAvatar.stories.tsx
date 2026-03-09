import preview from "#.storybook/preview";

import { DiscordAvatar } from "../../src/ts/components/common/DiscordAvatar";

const meta = preview.meta({
  title: "Common/DiscordAvatar",
  component: DiscordAvatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    discordId: { control: "text" },
    discordAvatar: { control: "text" },
    size: { control: "number" },
    class: { control: "text" },
    fallbackIcon: {
      control: "select",
      options: ["user-circle", "user"],
    },
  },
  decorators: [
    (Story) => (
      <div class="text-2xl">
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    discordId: "102819690287489024",
    discordAvatar: "a_af6c0b8ad26fdd6bcb86ed7bb40ee6e5",
  },
});

export const NoAvatar = meta.story({
  args: {
    discordId: "123456789",
    discordAvatar: undefined,
  },
});

export const UserFallback = meta.story({
  args: {
    discordId: undefined,
    discordAvatar: undefined,
    fallbackIcon: "user",
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div style={{ display: "flex", gap: "32px", "align-items": "center" }}>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <DiscordAvatar discordId={undefined} discordAvatar={undefined} />
        <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
          user-circle fallback
        </div>
      </div>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <DiscordAvatar
          discordId={undefined}
          discordAvatar={undefined}
          fallbackIcon="user"
        />
        <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
          user fallback
        </div>
      </div>
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          gap: "8px",
        }}
      >
        <DiscordAvatar discordId="123456789" discordAvatar="fake" size={64} />
        <div style={{ "font-size": "12px", color: "var(--sub-color)" }}>
          invalid avatar (fallback)
        </div>
      </div>
    </div>
  ),
});
