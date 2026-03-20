import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getFocus } from "../../../states/core";
import {
  getCommandLineKeyLabel,
  getModifierKeyLabel,
  isFirefoxBrowser,
} from "../../../utils/shortcuts";
import { Conditional } from "../../common/Conditional";

export function Keytips(): JSXElement {
  const isFirefox = isFirefoxBrowser();
  const modifierKey = getModifierKeyLabel();
  const commandKey = (): string =>
    getCommandLineKeyLabel(getConfig.quickRestart);

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
        <Conditional
          if={isFirefox}
          then={
            <>
              <kbd>{commandKey()}</kbd> - command line
            </>
          }
          else={
            <>
              <kbd>{commandKey()}</kbd> or <kbd>{modifierKey}</kbd> +{" "}
              <kbd>shift</kbd> + <kbd>p</kbd> - command line
            </>
          }
        />
      </div>
    </Show>
  );
}
