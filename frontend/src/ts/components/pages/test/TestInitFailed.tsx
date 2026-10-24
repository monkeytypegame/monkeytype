import { JSXElement, Show } from "solid-js";

import { getTestInitError } from "../../../states/test";
import { restart } from "../../../test/test-logic";
import { Button } from "../../common/Button";

export function TestInitFailed(): JSXElement {
  return (
    <div id="testInitFailed" class="content-grid mt-8 text-center text-base">
      <div class="max-w-[800px] justify-self-center [grid-area:content]">
        <div>
          Test initialization failed. Please try different settings or
          refreshing the page. If the problem persists, please contact support.
        </div>
        <Show when={getTestInitError()}>
          <div class="mt-8">{getTestInitError()}</div>
        </Show>
        <Button
          class="mt-8 px-8 py-4"
          active
          fa={{ icon: "fa-redo-alt", fixedWidth: true }}
          text="Restart"
          onClick={() => void restart()}
        />
      </div>
    </div>
  );
}
