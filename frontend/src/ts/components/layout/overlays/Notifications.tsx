import { AnimationParams } from "animejs";
import { For, JSXElement, onMount } from "solid-js";

import {
  getFocus,
  getGlobalOffsetTop,
  getIsScreenshotting,
} from "../../../signals/core";
import {
  Notification,
  pushNotification,
  getNotifications,
  removeNotification,
  clearAllNotifications as clearAll,
} from "../../../stores/notifications";
import { cn } from "../../../utils/cn";
import { isDevEnvironment } from "../../../utils/misc";
import { Anime } from "../../common/anime/Anime";
import { AnimePresence } from "../../common/anime/AnimePresence";
import { AnimeShow } from "../../common/anime/AnimeShow";
import { Fa, FaProps } from "../../common/Fa";

const levelConfig = {
  0: {
    icon: "fa-info-circle",
    title: "Notice",
    border: "rgba(0,130,251,0.985)",
    bg: "rgba(0,77,148,0.9)",
    bgHover: "rgba(0,77,148,0.5)",
  },
  1: {
    icon: "fa-check-circle",
    title: "Success",
    border: "rgba(100,206,100,0.71)",
    bg: "rgba(0,148,0,0.9)",
    bgHover: "rgba(0,148,0,0.5)",
  },
  [-1]: {
    icon: "fa-times-circle",
    title: "Error",
    border: "rgba(241,51,34,0.71)",
    bg: "rgba(138,18,12,0.9)",
    bgHover: "rgba(138,18,12,0.5)",
  },
} as const;

const enterInitial = { opacity: 0 } as Partial<AnimationParams>;
const enterAnimate = { opacity: 1, duration: 125 } as AnimationParams;
const exitAnimation = {
  opacity: 0,
  height: 0,
  marginBottom: 0,
  duration: 250,
} as AnimationParams;

function NotificationItem(props: { notification: Notification }): JSXElement {
  const config = (): (typeof levelConfig)[keyof typeof levelConfig] =>
    levelConfig[props.notification.level as keyof typeof levelConfig] ??
    levelConfig[0];

  const iconProps = (): FaProps =>
    props.notification.customIcon !== undefined
      ? ({
          icon: `fa-${props.notification.customIcon}`,
          fixedWidth: true,
        } as FaProps)
      : ({ icon: config().icon } as FaProps);

  const title = (): string => props.notification.customTitle ?? config().title;

  return (
    <Anime
      initial={enterInitial}
      animate={enterAnimate}
      exit={exitAnimation}
      class={cn(
        "mb-4 cursor-pointer overflow-hidden rounded-xl border-2 border-solid backdrop-blur-[15px] select-none",
        "text-white relative grid",
        "shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08)]",
        "transition-[background] duration-125",
        "border-(--notif-border) bg-(--notif-bg) hover:bg-(--notif-bg-hover)",
        props.notification.important && "important",
      )}
      style={{
        "--notif-border": config().border,
        "--notif-bg": config().bg,
        "--notif-bg-hover": config().bgHover,
      }}
    >
      <div
        class="p-4 text-sm"
        onClick={() => removeNotification(props.notification.id)}
      >
        <div class="text-white/60 pb-2 font-medium">
          <Fa {...iconProps()} class="text-white/60 mr-2 inline" />
          {title()}
        </div>
        {/* oxlint-disable-next-line solid/no-innerhtml -- notification message contains escaped HTML */}
        <div innerHTML={props.notification.message}></div>
      </div>
    </Anime>
  );
}

export function Notifications(): JSXElement {
  const stickyCount = (): number =>
    getNotifications().filter((n) => n.duration === 0).length;

  onMount(() => {
    if (!isDevEnvironment()) return;
    pushNotification({
      message: "This is a notice notification (debug)",
      level: 0,
      important: true,
      duration: 0,
    });
    pushNotification({
      message: "This is a success notification (debug)",
      level: 1,
      important: false,
      duration: 0,
    });
    pushNotification({
      message: "This is an error notification (debug)",
      level: -1,
      important: false,
      duration: 0,
    });
  });

  return (
    <div
      class={cn(
        "fixed right-4 z-99999999 grid w-87.5 pt-4 transition-opacity duration-125",
        (getFocus() || getIsScreenshotting()) &&
          "pointer-events-none opacity-0",
      )}
      style={{ "margin-top": `${getGlobalOffsetTop()}px` }}
    >
      <AnimeShow when={stickyCount() > 1}>
        <button
          type="button"
          class="text-white mb-4 w-full overflow-hidden text-xs"
          onClick={() => clearAll()}
        >
          <Fa icon="fa-times" class="mr-1" />
          Clear all
        </button>
      </AnimeShow>
      <AnimePresence mode="list">
        <For each={getNotifications()}>
          {(notification) => <NotificationItem notification={notification} />}
        </For>
      </AnimePresence>
    </div>
  );
}
