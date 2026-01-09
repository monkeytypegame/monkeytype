import { Accessor, JSXElement } from "solid-js";

import { isFocused } from "../../test/focus";
import {
  useVisibilityAnimation,
  VisibilityAnimationOptions,
} from "../../hooks/useVisibilityAnimation";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { getTestTime, statsVisible } from "../../signals/test";
import Config from "../../config";
import * as CustomText from "../../test/custom-text";
import { getConfigSignal } from "../../signals/config";

function Stat(props: {
  value: Accessor<string>;
  visibilityOptions: Accessor<VisibilityAnimationOptions>;
  class?: string;
  style?: Record<string, string>;
}): JSXElement {
  const [ref, element] = useRefWithUtils<HTMLDivElement>();

  useVisibilityAnimation(element, props.visibilityOptions);

  return (
    <div ref={ref} class={props.class} style={props.style}>
      {props.value()}
    </div>
  );
}

const getStatsVisible = (
  visible: Accessor<boolean>,
): Accessor<VisibilityAnimationOptions> => {
  return () => ({
    visible: statsVisible().visible && isFocused() && visible(),
    animate: statsVisible().animate,
  });
};

function getStatsColorClass(): string {
  const cfg = getConfigSignal();
  const configValue = cfg.timerColor;
  if (configValue === "main") {
    return "colorMain";
  } else if (configValue === "sub") {
    return "colorSub";
  } else if (configValue === "text") {
    return "colorText";
  } else if (configValue === "black") {
    return "colorBlack";
  }
  return "";
}

function getFlashTimerOpacity(): string {
  let opacity = "1";
  const time = getTestTime();
  let maxtime = Config.time;
  if (Config.mode === "custom" && CustomText.getLimitMode() === "time") {
    maxtime = CustomText.getLimitValue();
  }

  const timedTest =
    Config.mode === "time" ||
    (Config.mode === "custom" && CustomText.getLimitMode() === "time");

  if (
    timedTest &&
    (getConfigSignal().timerStyle === "flash_mini" ||
      getConfigSignal().timerStyle === "flash_text")
  ) {
    if ((maxtime - time) % 15 !== 0) {
      opacity = "0";
    } else {
      opacity = "1";
    }
  }
  return opacity;
}

export function MiniLiveStats(props: {
  progress: Accessor<string>;
  wpm: Accessor<string>;
  acc: Accessor<string>;
  burst: Accessor<string>;
}): JSXElement {
  const isVisible = (
    config: Accessor<string>,
  ): Accessor<VisibilityAnimationOptions> => {
    return getStatsVisible(() => config() === props.mode);
  };

  return (
    <div
      class="wrapper"
      classList={{
        [getStatsColorClass()]: true,
      }}
      style={{
        opacity: getConfigSignal().timerOpacity,
      }}
    >
      <Stat
        class={"progress time"}
        value={props.progress}
        style={{ opacity: getFlashTimerOpacity() }}
        visibilityOptions={getStatsVisible(
          () =>
            getConfigSignal().timerStyle === "mini" ||
            getConfigSignal().timerStyle === "flash_mini",
        )}
      />
      <Stat
        class={"speed"}
        value={props.wpm}
        visibilityOptions={getStatsVisible(
          () => getConfigSignal().liveSpeedStyle === "mini",
        )}
      />
      <Stat
        class={"acc"}
        value={props.acc}
        visibilityOptions={getStatsVisible(
          () => getConfigSignal().liveAccStyle === "mini",
        )}
      />
      <Stat
        class={"burst"}
        value={props.burst}
        visibilityOptions={getStatsVisible(
          () => getConfigSignal().liveBurstStyle === "mini",
        )}
      />
    </div>
  );
}

export function TextLiveStatsTop(props: {
  progress: Accessor<string>;
}): JSXElement {
  return (
    <div
      class="wrapper"
      classList={{
        [getStatsColorClass()]: true,
      }}
      style={{
        opacity: getConfigSignal().timerOpacity,
      }}
    >
      <Stat
        class={"progress time"}
        value={props.progress}
        style={{ opacity: getFlashTimerOpacity() }}
        visibilityOptions={getStatsVisible(
          () =>
            getConfigSignal().timerStyle === "text" ||
            getConfigSignal().timerStyle === "flash_text",
        )}
      />
    </div>
  );
}

export function TextLiveStatsBottom(props: {
  wpm: Accessor<string>;
  acc: Accessor<string>;
  burst: Accessor<string>;
}): JSXElement {
  return (
    <div
      class="wrapper"
      classList={{
        [getStatsColorClass()]: true,
      }}
      style={{
        opacity: getConfigSignal().timerOpacity,
      }}
    >
      <Stat
        class={"liveSpeed"}
        value={props.wpm}
        visibilityOptions={getStatsVisible(
          () => getConfigSignal().liveSpeedStyle === "text",
        )}
      />
      <Stat
        class={"liveAcc"}
        value={props.acc}
        visibilityOptions={getStatsVisible(
          () => getConfigSignal().liveAccStyle === "text",
        )}
      />
      <Stat
        class={"liveBurst"}
        value={props.burst}
        visibilityOptions={getStatsVisible(
          () => getConfigSignal().liveBurstStyle === "text",
        )}
      />
    </div>
  );
}
