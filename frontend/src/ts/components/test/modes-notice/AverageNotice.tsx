import { createMemo, JSXElement, Show } from "solid-js";

import { useUserAverage10LiveQuery } from "../../../collections/results";
import { getConfig } from "../../../config/store";
import { isAuthenticated } from "../../../states/core";
import { Formatting } from "../../../utils/format";
import { Notice } from "./Notice";

export function AverageNotice(): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));
  const last10 = useUserAverage10LiveQuery({
    isEnabled: () => isAuthenticated() && getConfig.showAverage !== "off",
  });

  return (
    <Notice
      when={isAuthenticated() && getConfig.showAverage !== "off"}
      icon="fa-chart-bar"
      openCommandline="showAverage"
    >
      <Show when={last10() !== undefined} fallback="no average">
        avg:{" "}
        <Show
          when={
            getConfig.showAverage === "speed" ||
            getConfig.showAverage === "both"
          }
        >
          {format().typingSpeed(last10()?.wpm ?? 0, {
            suffix: ` ${getConfig.typingSpeedUnit}`,
          })}
        </Show>
        <Show
          when={
            getConfig.showAverage === "acc" || getConfig.showAverage === "both"
          }
        >
          <span>
            {format().accuracy(last10()?.acc ?? 0, {
              suffix: " acc",
            })}
          </span>
        </Show>
      </Show>
    </Notice>
  );
}
