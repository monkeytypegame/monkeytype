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

function Stat(props: {
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

const getStatsVisible = (
  visible: Accessor<boolean>,
): Accessor<VisibilityAnimationOptions> => {
  return () => ({
    visible: statsVisible().visible && isFocused() && visible(),
    animate: statsVisible().animate,
  });
};

export { setStatsVisible };

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
        visibilityOptions={getStatsVisible(
          () => getLiveSpeedStyle() === "mini",
        )}
      />
      <Stat
        class="acc"
        value={props.acc}
        visibilityOptions={getStatsVisible(() => getLiveAccStyle() === "mini")}
      />
      <Stat
        class="burst"
        value={props.burst}
        visibilityOptions={getStatsVisible(
          () => getLiveBurstStyle() === "mini",
        )}
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
        value={props.wpm}
        visibilityOptions={getStatsVisible(
          () => getLiveSpeedStyle() === "text",
        )}
      />
      <Stat
        class="liveAcc"
        value={props.acc}
        visibilityOptions={getStatsVisible(() => getLiveAccStyle() === "text")}
      />
      <Stat
        class="liveBurst"
        value={props.burst}
        visibilityOptions={getStatsVisible(
          () => getLiveBurstStyle() === "text",
        )}
      />
    </>
  );
}
