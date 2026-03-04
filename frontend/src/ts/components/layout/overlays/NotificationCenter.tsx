import { AnimationParams } from "animejs";
import { For, JSXElement, onMount } from "solid-js";

import { getGlobalOffsetTop } from "../../../signals/core";
import {
  Notification,
  pushNotification,
  getNotifications,
  removeNotification,
  clearAllNotifications as clearAll,
} from "../../../stores/notifications";
import { isDevEnvironment } from "../../../utils/misc";
import { Anime } from "../../common/anime/Anime";
import { AnimePresence } from "../../common/anime/AnimePresence";
import { AnimeShow } from "../../common/anime/AnimeShow";
import { Fa } from "../../common/Fa";

const levelConfig = {
  notice: {
    icon: "fa-info-circle",
    title: "Notice",
    "--notif-border": "rgba(0,130,251,0.985)",
    "--notif-bg": "rgba(0,77,148,0.9)",
    "--notif-bg-hover": "rgba(0,77,148,0.5)",
  },
  good: {
    icon: "fa-check-circle",
    title: "Success",
    "--notif-border": "rgba(100,206,100,0.71)",
    "--notif-bg": "rgba(0,148,0,0.9)",
    "--notif-bg-hover": "rgba(0,148,0,0.5)",
  },
  bad: {
    icon: "fa-times-circle",
    title: "Error",
    "--notif-border": "rgba(241,51,34,0.71)",
    "--notif-bg": "rgba(138,18,12,0.9)",
    "--notif-bg-hover": "rgba(138,18,12,0.5)",
  },
} as const;

function levelToCls(level: number): "notice" | "good" | "bad" {
  if (level === 1) return "good";
  if (level === -1) return "bad";
  return "notice";
}

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
    levelConfig[levelToCls(props.notification.level)];

  const icon = (): string =>
    props.notification.customIcon !== undefined
      ? `fa-fw fa-${props.notification.customIcon}`
      : config().icon;

  const title = (): string => props.notification.customTitle ?? config().title;

  return (
    <Anime
      initial={enterInitial}
      animate={enterAnimate}
      exit={exitAnimation}
      class={[
        "mb-4 cursor-pointer select-none rounded-xl border-2 border-solid backdrop-blur-[15px]",
        "relative grid grid-cols-[auto] text-white",
        "shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08)]",
        "transition-[background] duration-125",
        "border-(--notif-border) bg-(--notif-bg) hover:bg-(--notif-bg-hover)",
        props.notification.important ? "important" : "",
      ].join(" ")}
      style={{
        overflow: "hidden",
        "--notif-border": config()["--notif-border"],
        "--notif-bg": config()["--notif-bg"],
        "--notif-bg-hover": config()["--notif-bg-hover"],
      }}
    >
      <div onClick={() => removeNotification(props.notification.id)}>
        <div class="text-white p-4 text-sm">
          <div class="pb-2 font-medium text-[#ffffff92]">
            <i class={`fas ${icon()} mr-2 inline text-[#ffffff92]`}></i>
            {title()}
          </div>
          {/* oxlint-disable-next-line solid/no-innerhtml -- notification message contains escaped HTML */}
          <div innerHTML={props.notification.message}></div>
        </div>
      </div>
    </Anime>
  );
}

export function NotificationCenter(): JSXElement {
  const stickyCount = (): number =>
    getNotifications().filter((n) => n.duration === 0).length;

  onMount(() => {
    if (!isDevEnvironment()) return;
    pushNotification({
      message: "This is a notice notification (debug)",
      level: 0,
      important: false,
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
      class="fixed right-4 z-99999999 grid w-87.5 pt-4"
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
