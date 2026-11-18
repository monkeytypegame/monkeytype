import { createMemo, JSXElement } from "solid-js";

import { useUserAverage10LiveQuery } from "../../../../collections/results";
import { getFormatting, isAuthenticated } from "../../../../states/core";
import { testConfigView as config } from "../../../../states/test-config-view";
import { Notice } from "./Notice";

export function AverageNotice(): JSXElement {
  const last10 = useUserAverage10LiveQuery({
    isEnabled: () => isAuthenticated() && config.showAverage !== "off",
    config,
  });

  const displayText = createMemo(() => {
    if (last10() === undefined) return "no average";

    const format = getFormatting();
    let speed = undefined;
    let acc = undefined;

    if (config.showAverage === "both" || config.showAverage === "speed") {
      speed = format.typingSpeed(last10()?.wpm ?? 0, {
        suffix: ` ${config.typingSpeedUnit}`,
      });
    }

    if (config.showAverage === "both" || config.showAverage === "acc") {
      acc = format.accuracy(last10()?.acc ?? 0, {
        suffix: " acc",
      });
    }

    return [speed, acc].filter((it) => it !== undefined).join(" ");
  });

  return (
    <Notice
      when={isAuthenticated() && config.showAverage !== "off"}
      icon="fa-chart-bar"
      openCommandline="showAverage"
      text={displayText()}
    />
  );
}
