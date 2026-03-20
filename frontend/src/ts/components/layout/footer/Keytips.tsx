import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../../config/store";
import { getFocus } from "../../../states/core";
import { CommandlineHotkey } from "../../hotkeys/CommandlineHotkey";
import { QuickRestartHotkey } from "../../hotkeys/QuickRestartHotkey";

export function Keytips(): JSXElement {
  return (
    <Show when={getConfig.showKeyTips}>
      <div
        class="mb-8 text-center leading-loose transition-opacity"
        classList={{
          "opacity-0": getFocus(),
        }}
      >
        <QuickRestartHotkey /> - restart test
        <br />
        <CommandlineHotkey /> - command line
      </div>
    </Show>
  );
}
