import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../../signals/config";
import { getFocus } from "../../../signals/core";
import { Conditional } from "../../common/Conditional";

export function Keytips(): JSXElement {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const modifierKey =
    userAgent.includes("mac") && !userAgent.includes("firefox")
      ? "cmd"
      : "ctrl";

  const commandKey = (): string =>
    getConfig.quickRestart === "esc" ? "tab" : "esc";

  return (
    <Show when={getConfig.showKeyTips}>
      <div
        class="mb-8 text-center leading-loose transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <Conditional
          if={getConfig.quickRestart === "off"}
          then={
            <>
              <kbd>tab</kbd> + <kbd>enter</kbd> - restart test
            </>
          }
          else={
            <>
              <kbd>{getConfig.quickRestart}</kbd> - restart test
            </>
          }
        />
        <br />
        <kbd>{commandKey()}</kbd> or <kbd>{modifierKey}</kbd> + <kbd>shift</kbd>{" "}
        + <kbd>p</kbd> - command line
      </div>
    </Show>
  );
}
