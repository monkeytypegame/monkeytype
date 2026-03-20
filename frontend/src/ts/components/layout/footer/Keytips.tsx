import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getFocus } from "../../../states/core";
import { Commandline } from "../../hotkeys/Commandline";
import { QuickRestart } from "../../hotkeys/QuickRestart";

export function Keytips(): JSXElement {
  return (
    <Show when={getConfig.showKeyTips}>
      <div
        class="mb-8 text-center leading-loose transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <QuickRestart /> - restart test
        <br />
        <Commandline /> - command line
      </div>
    </Show>
  );
}
