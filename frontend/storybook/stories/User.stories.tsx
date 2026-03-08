import preview from "#.storybook/preview";
import { createSignal, onCleanup } from "solid-js";

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

// oxlint-disable-next-line no-unused-vars
function SpinnerCycleUser(props: {
  data: Record<string, unknown>;
}): ReturnType<typeof User> {
  const [showSpinner, setShowSpinner] = createSignal(false);
  const interval = setInterval(() => {
    setShowSpinner((prev) => !prev);
  }, 2000);
  onCleanup(() => clearInterval(interval));
  //@ts-expect-error - just for testing, ignore type issues
  return <User user={{ ...props.data }} showSpinner={showSpinner()} />;
}

export const Default = meta.story({
  // args: {
  //   user: {
  //     uid: "user123",
  //     name: "monkeytyper",
  //     discordId: undefined,
  //     discordAvatar: undefined,
  //   },
  // },

  render: () => {
    const data = {
      uid: "user123",
      name: "monkeytyper",
      discordId: "102819690287489024",
      discordAvatar: "a_af6c0b8ad26fdd6bcb86ed7bb40ee6e5",
      isPremium: true,
      banned: true,
    };
    return (
      <div class="grid grid-cols-[auto_1fr] place-items-start gap-4 [--themable-button-text:var(--sub-color)]">
        <div class="text-sub">With avatar:</div>
        <User user={{ ...data }} />
        <div class="text-sub">No avatar:</div>
        <User user={{ ...data }} showAvatar={false} />
        <div class="text-sub">Avatar fallback:</div>
        <User user={{ ...data, discordAvatar: "" }} />
        <div class="text-sub">Avatar fallback with color:</div>
        <User
          user={{ ...data, discordAvatar: "" }}
          avatarFallback="user-circle"
          avatarColor="sub"
        />
        <div class="text-sub">Flag color:</div>
        <User user={{ ...data }} flagsColor="sub" />
        <div class="text-sub">Hide name on small screen:</div>
        <User user={{ ...data }} hideNameOnSmallScreens={true} />
        <div class="text-sub">Level:</div>
        <User user={{ ...data }} level={10} />
        <div class="text-sub">Level no flags:</div>
        <User
          user={{ ...data, isPremium: undefined, banned: undefined }}
          level={10}
        />
        <div class="text-sub">Show spinner (cycling):</div>
        <SpinnerCycleUser data={data} />
        <div class="text-sub">Show notification bubble:</div>
        <User user={{ ...data }} showNotificationBubble={true} />
      </div>
    );
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
