import { AnimationParams } from "animejs";
import { For, JSXElement } from "solid-js";

import { getGlobalOffsetTop, getIsScreenshotting } from "../../../states/core";
import {
  Notification,
  getNotifications,
  removeNotification,
  clearAllNotifications,
} from "../../../states/notifications";
import { getFocus } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Anime } from "../../common/anime/Anime";
import { AnimePresence } from "../../common/anime/AnimePresence";
import { AnimeShow } from "../../common/anime/AnimeShow";
import { Conditional } from "../../common/Conditional";
import { Fa, FaProps } from "../../common/Fa";

const levelConfig = {
  notice: {
    icon: "fa-info-circle",
    title: "Notice",
    border: "var(--notif-notice-border, rgba(0,130,251,0.985))",
    bg: "var(--notif-notice-bg, rgba(0,77,148,0.9))",
    bgHover: "var(--notif-notice-bg-hover, rgba(0,77,148,0.5))",
  },
  success: {
    icon: "fa-check-circle",
    title: "Success",
    border: "var(--notif-success-border, rgba(100,206,100,0.71))",
    bg: "var(--notif-success-bg, rgba(0,148,0,0.9))",
    bgHover: "var(--notif-success-bg-hover, rgba(0,148,0,0.5))",
  },
  error: {
    icon: "fa-times-circle",
    title: "Error",
    border: "var(--notif-error-border, rgba(241,51,34,0.71))",
    bg: "var(--notif-error-bg, rgba(138,18,12,0.9))",
    bgHover: "var(--notif-error-bg-hover, rgba(138,18,12,0.5))",
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
    levelConfig[props.notification.level] ?? levelConfig.notice;

  const iconProps = (): FaProps =>
    props.notification.customIcon !== undefined
      ? ({
          icon: `fa-${props.notification.customIcon}`,
          fixedWidth: true,
        } as FaProps)
      : ({ icon: config().icon } as FaProps);

  const title = (): string => props.notification.customTitle ?? config().title;

  return (
    <div
      class={cn(
        "transition-opacity duration-125",
        getFocus() &&
          !props.notification.important &&
          "pointer-events-none hidden",
      )}
    >
      <Anime
        initial={enterInitial}
        animate={enterAnimate}
        exit={exitAnimation}
        class={cn(
          "mb-4 cursor-pointer overflow-hidden rounded-double border-2 border-solid backdrop-blur-[15px] select-none",
          "relative grid text-[white]",
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
          <div class="pb-2 opacity-50">
            <Fa {...iconProps()} class="mr-2 inline" />
            {title()}
          </div>
          <Conditional
            if={props.notification.useInnerHtml}
            // oxlint-disable-next-line solid/no-innerhtml
            then={<div innerHTML={props.notification.message}></div>}
            else={<div>{props.notification.message}</div>}
          />
        </div>
      </Anime>
    </div>
  );
}

export function Notifications(): JSXElement {
  const stickyCount = (): number => {
    const focus = getFocus();
    return getNotifications().filter(
      (n) => n.durationMs === 0 && (!focus || n.important),
    ).length;
  };

  return (
    <div
      data-ui-element="notifications"
      class={cn(
        "fixed right-4 z-99999999 grid w-87.5 pt-4 transition-opacity duration-125",
        getIsScreenshotting() && "pointer-events-none opacity-0",
      )}
      style={{ "margin-top": `${getGlobalOffsetTop()}px` }}
    >
      <AnimeShow when={stickyCount() > 1}>
        <button
          type="button"
          class="text-white mb-4 w-full overflow-hidden text-xs"
          onClick={() => clearAllNotifications()}
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
