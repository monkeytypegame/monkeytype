import { createMemo, JSXElement } from "solid-js";

import { useUserAverage10LiveQuery } from "../../../collections/results";
import { getConfig } from "../../../config/store";
import { getFormatting, isAuthenticated } from "../../../states/core";
import { Notice } from "./Notice";

export function AverageNotice(): JSXElement {
  const last10 = useUserAverage10LiveQuery({
    isEnabled: () => isAuthenticated() && getConfig.showAverage !== "off",
  });

  const displayText = createMemo(() => {
    if (last10() === undefined) return "no average";

    const format = getFormatting();
    let speed = undefined;
    let acc = undefined;

    if (getConfig.showAverage === "both" || getConfig.showAverage === "speed") {
      speed = format.typingSpeed(last10()?.wpm ?? 0, {
        suffix: ` ${getConfig.typingSpeedUnit}`,
      });
    }

    if (getConfig.showAverage === "both" || getConfig.showAverage === "acc") {
      acc = format.accuracy(last10()?.acc ?? 0, {
        suffix: " acc",
      });
    }

    return [speed, acc].filter((it) => it !== undefined).join(" ");
  });

  return (
    <Notice
      when={isAuthenticated() && getConfig.showAverage !== "off"}
      icon="fa-chart-bar"
      openCommandline="showAverage"
      text={displayText()}
    />
  );
}
