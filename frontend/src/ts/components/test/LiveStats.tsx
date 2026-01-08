import { Accessor, createSignal, JSXElement } from "solid-js";
import {
  getLiveAccStyle,
  getLiveBurstStyle,
  getLiveSpeedStyle,
} from "../../signals/config";
import { isFocused } from "../../test/focus";
import {
  useVisibilityAnimation,
  VisibilityAnimationOptions,
} from "../../hooks/useVisibilityAnimation";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";

export function Stat(props: {
  value: Accessor<string>;
  visibilityOptions: Accessor<VisibilityAnimationOptions>;
  class?: string;
}): JSXElement {
  const [ref, element] = useRefWithUtils<HTMLDivElement>();

  useVisibilityAnimation(element, props.visibilityOptions);

  return (
    <div ref={ref} class={props.class}>
      {props.value()}
    </div>
  );
}

const [statsVisible, setStatsVisible] =
  createSignal<VisibilityAnimationOptions>({
    visible: false,
    animate: true,
  });

const getStatsVisible = (): VisibilityAnimationOptions => {
  return {
    visible: statsVisible().visible && isFocused(),
    animate: statsVisible().animate,
  };
};

export { setStatsVisible as setStatsVisible };

export function LiveStatsMini(props: {
  wpm: Accessor<string>;
  acc: Accessor<string>;
  burst: Accessor<string>;
}): JSXElement {
  return (
    <>
      <Stat
        class="speed"
        value={() => (getLiveSpeedStyle() === "mini" ? props.wpm() : "")}
        visibilityOptions={getStatsVisible}
      />
      <Stat
        class="acc"
        value={() => (getLiveAccStyle() === "mini" ? props.acc() : "")}
        visibilityOptions={getStatsVisible}
      />
      <Stat
        class="burst"
        value={() => (getLiveBurstStyle() === "mini" ? props.burst() : "")}
        visibilityOptions={getStatsVisible}
      />
    </>
  );
}

export function LiveStats(props: {
  wpm: Accessor<string>;
  acc: Accessor<string>;
  burst: Accessor<string>;
}): JSXElement {
  return (
    <>
      <Stat
        class="liveSpeed"
        value={() => (getLiveSpeedStyle() === "text" ? props.wpm() : "")}
        visibilityOptions={getStatsVisible}
      />
      <Stat
        class="liveAcc"
        value={() => (getLiveAccStyle() === "text" ? props.acc() : "")}
        visibilityOptions={getStatsVisible}
      />
      <Stat
        class="liveBurst"
        value={() => (getLiveBurstStyle() === "text" ? props.burst() : "")}
        visibilityOptions={getStatsVisible}
      />
    </>
  );
}
