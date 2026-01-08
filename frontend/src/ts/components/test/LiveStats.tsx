import { Accessor, JSXElement } from "solid-js";
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
import { statsVisible } from "../../signals/test";

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

const getStatsVisible = (
  visible: Accessor<boolean>,
): Accessor<VisibilityAnimationOptions> => {
  return () => ({
    visible: statsVisible().visible && isFocused() && visible(),
    animate: statsVisible().animate,
  });
};

export function LiveStats(props: {
  mode: "mini" | "text";
  wpm: Accessor<string>;
  acc: Accessor<string>;
  burst: Accessor<string>;
}): JSXElement {
  const isVisible = (
    config: Accessor<string>,
  ): Accessor<VisibilityAnimationOptions> =>
    getStatsVisible(() => config() === props.mode);

  return (
    <>
      <Stat
        class="speed"
        value={props.wpm}
        visibilityOptions={isVisible(getLiveSpeedStyle)}
      />
      <Stat
        class="acc"
        value={props.acc}
        visibilityOptions={isVisible(getLiveAccStyle)}
      />
      <Stat
        class="burst"
        value={props.burst}
        visibilityOptions={isVisible(getLiveBurstStyle)}
      />
    </>
  );
}
