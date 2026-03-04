import preview from "#.storybook/preview";

import { AccountMenu } from "../../src/ts/components/layout/header/AccountMenu";

const meta = preview.meta({
  title: "Layout/Header/AccountMenu",
  component: AccountMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    showFriendsNotificationBubble: { control: "boolean" },
  },
});

export const Default = meta.story({
  render: () => (
    <div style={{ position: "relative", "pointer-events": "auto", opacity: 1 }}>
      <AccountMenu showFriendsNotificationBubble={false} />
    </div>
  ),
});

export const WithNotification = meta.story({
  render: () => (
    <div style={{ position: "relative", "pointer-events": "auto", opacity: 1 }}>
      <AccountMenu showFriendsNotificationBubble />
    </div>
  ),
});
