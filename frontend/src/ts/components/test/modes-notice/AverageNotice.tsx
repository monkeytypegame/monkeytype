import { createMemo, JSXElement, Show } from "solid-js";

import { useUserAverage10LiveQuery } from "../../../collections/results";
import { getConfig } from "../../../config/store";
import {
  isAuthenticated,
  showCommandLineForConfig,
} from "../../../states/core";
import { Formatting } from "../../../utils/format";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";

export function AverageNotice(): JSXElement {
  const format = createMemo(() => new Formatting(getConfig));
  const last10 = useUserAverage10LiveQuery();

  return (
    <Show when={isAuthenticated() && getConfig.showAverage !== "off"}>
      <AsyncContent collections={{ last10 }}>
        {({ last10Data }) => (
          <Show when={last10Data().length > 0}>
            <Button
              variant="text"
              fa={{ icon: "fa-chart-bar" }}
              onClick={() => showCommandLineForConfig("showAverage")}
            >
              avg:
              <Show
                when={
                  getConfig.showAverage === "speed" ||
                  getConfig.showAverage === "both"
                }
              >
                <span>
                  {format().typingSpeed(last10Data()?.at(0)?.wpm ?? 0, {
                    suffix: ` ${getConfig.typingSpeedUnit}`,
                  })}
                </span>
              </Show>
              <Show
                when={
                  getConfig.showAverage === "acc" ||
                  getConfig.showAverage === "both"
                }
              >
                <span>
                  {format().accuracy(last10Data()?.at(0)?.acc ?? 0, {
                    suffix: " acc",
                  })}
                </span>
              </Show>
            </Button>
          </Show>
        )}
      </AsyncContent>
    </Show>
  );
}
