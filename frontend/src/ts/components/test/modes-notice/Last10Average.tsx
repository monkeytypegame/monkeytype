import { createMemo, JSXElement, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import {
  isAuthenticated,
  showCommandLineForConfig,
} from "../../../states/core";
import { Formatting } from "../../../utils/format";
import { Button } from "../../common/Button";

export function Last10Average(): JSXElement {
  const _format = createMemo(() => new Formatting(getConfig));

  return (
    <Show when={isAuthenticated() && getConfig.showAverage !== "off"}>
      average
      <Button
        variant="text"
        fa={{ icon: "fa-chart-bar" }}
        onClick={() => showCommandLineForConfig("showAverage")}
      >
        avg:
        {/*}
        <Show
          when={
            getConfig.showAverage === "speed" ||
            getConfig.showAverage === "both"
          }
        >
          <span>
            {format().typingSpeed(last10()?.wpm)} {getConfig.typingSpeedUnit}
          </span>
        </Show>
        <Show
          when={
            getConfig.showAverage === "acc" || getConfig.showAverage === "both"
          }
        >
          <span>{format().accuracy(last10()?.acc)} acc</span>
        </Show>
        {*/}
      </Button>
    </Show>
  );
}
