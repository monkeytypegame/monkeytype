import preview from "#.storybook/preview";

import { DiscordAvatar } from "../../src/ts/components/common/DiscordAvatar";

const meta = preview.meta({
  title: "Monkeytype/DiscordAvatar",
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
    discordId: undefined,
    discordAvatar: undefined,
  },
});

export const WithAvatar = meta.story({
  args: {
    discordId: "123456789",
    discordAvatar: "abc123",
    size: 64,
  },
});

export const CustomSize = meta.story({
  args: {
    discordId: "123456789",
    discordAvatar: "abc123",
    size: 128,
  },
});

export const NoAvatar = meta.story({
  args: {
    discordId: "123456789",
    discordAvatar: undefined,
  },
});
