import { createEffect, createSignal, JSXElement } from "solid-js";

import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../states/core";
import {
  getModalVisibility,
  hideModalAndClearChain,
} from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";

export function CustomWordAmount(): JSXElement {
  const [input, setInput] = createSignal(getConfig.words.toString());

  createEffect(() => {
    getModalVisibility("CustomWordAmount");
    setInput(getConfig.words.toString());
  });

  const apply = () => {
    const val = parseInt(input(), 10);

    if (val === null || isNaN(val) || val < 0 || !isFinite(val)) {
      showNoticeNotification("Custom word amount must be at least 1");
      return;
    }

    setConfig("words", val);
    restartTestEvent.dispatch();

    if (val > 2000) {
      showNoticeNotification("Stay safe and take breaks!");
    } else if (val === 0) {
      showNoticeNotification(
        "Infinite words! Make sure to use Bail Out from the command line to save your result.",
        { durationMs: 7000 },
      );
    }

    hideModalAndClearChain("CustomWordAmount");
  };

  return (
    <AnimatedModal
      id="CustomWordAmount"
      title="Custom word amount"
      focusFirstInput="focusAndSelect"
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <input
          type="number"
          min="0"
          max="10000"
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
        />
        <div class="text-xs">
          You can start an infinite test by inputting 0. Then, to stop the test,
          use the Bail Out feature:
          <br />(<kbd>esc</kbd> or <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> +{" "}
          <kbd>p</kbd> &gt; Bail Out)
        </div>
        <Button variant="button" text="apply" onClick={apply} />
      </form>
    </AnimatedModal>
  );
}
