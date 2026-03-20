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

export function TestDuration(): JSXElement {
  const [input, setInput] = createSignal(getConfig.time.toString());

  const humanTime = () => {
    const duration = parseInput(input());

    if (duration < 0) {
      return "Negative time? Really?";
    } else if (duration === 0) {
      return "Infinite test";
    } else {
      return format(duration);
    }
  };

  createEffect(() => {
    getModalVisibility("TestDuration"); // re-run when visibility changes
    setInput(getConfig.time.toString());
  });

  return (
    <AnimatedModal id="TestDuration" title="Test Duration">
      <div class="text-xs">{humanTime()}</div>
      <input
        type="text"
        value={input()}
        onInput={(e) => setInput(e.currentTarget.value)}
      />
      <div class="text-xs">
        You can use &ldquo;h&rdquo; for hours and &ldquo;m&rdquo; for minutes,
        for example &ldquo;1h30m&rdquo;.
        <br />
        <br />
        You can start an infinite test by inputting 0. Then, to stop the test,
        use the Bail Out feature:
        <br />(<kbd>esc</kbd> or <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> +{" "}
        <kbd>p</kbd> &gt; Bail Out)
      </div>
      <Button
        variant="button"
        text="apply"
        onClick={() => {
          const val = parseInput(input());

          if (val === null || isNaN(val) || val < 0 || !isFinite(val)) {
            showNoticeNotification(
              "Custom time must be a positive number or zero",
            );
            return;
          }

          setConfig("time", val);
          restartTestEvent.dispatch();

          if (val >= 1800) {
            showNoticeNotification("Stay safe and take breaks!");
          } else if (val === 0) {
            showNoticeNotification(
              "Infinite time! Make sure to use Bail Out from the command line to save your result.",
              { durationMs: 7000 },
            );
          }

          hideModalAndClearChain("TestDuration");
        }}
      />
    </AnimatedModal>
  );
}

function format(duration: number): string {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;

  const time = [];

  if (hours > 0) {
    time.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }

  if (minutes > 0) {
    time.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  }

  if (seconds > 0) {
    time.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  }

  if (time.length === 0) {
    return "0 seconds";
  } else if (time.length === 3) {
    return `${time[0]}, ${time[1]} and ${time[2]}`;
  } else if (time.length === 2) {
    return `${time[0]} and ${time[1]}`;
  } else {
    return `${time[0]}`;
  }
}

function parseInput(input: string): number {
  const re = /((-\s*)?\d+(\.\d+)?\s*[hms]?)/g;
  const seconds = [...input.toLowerCase().matchAll(re)]
    .map((match) => {
      const part = match[0];
      const duration = parseFloat(part.replace(/\s+/g, ""));

      if (part.includes("h")) {
        return 3600 * duration;
      } else if (part.includes("m")) {
        return 60 * duration;
      } else {
        return duration;
      }
    })
    .reduce((total, dur) => total + dur, 0);

  return Math.floor(seconds);
}
