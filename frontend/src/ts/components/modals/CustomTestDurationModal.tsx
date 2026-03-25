import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { hideModalAndClearChain } from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";

export function CustomTestDurationModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      duration: getConfig.time.toString(),
    },
    onSubmit: ({ value }) => {
      const val = parseInput(value.duration);

      if (isNaN(val) || val < 0 || !isFinite(val)) {
        showNoticeNotification("Custom time must be a positive number or zero");
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
    },
  }));

  const durationValue = form.useStore((s) => s.values.duration);

  const humanTime = () => {
    const duration = parseInput(durationValue());

    if (duration < 0) {
      return "Negative time? Really?";
    } else if (duration === 0) {
      return "Infinite test";
    } else {
      return format(duration);
    }
  };

  return (
    <AnimatedModal
      id="TestDuration"
      title="Test Duration"
      beforeShow={() => {
        form.reset({ duration: getConfig.time.toString() });
      }}
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div class="text-xs">{humanTime()}</div>
        <form.Field
          name="duration"
          validators={{
            onChange: ({ value }) => {
              const val = parseInput(value);
              if (isNaN(val) || !isFinite(val)) return "Must be a number";
              if (val < 0) return "Must be non-negative";
              return undefined;
            },
          }}
          children={(field) => (
            <InputField field={field} type="text" placeholder="duration" />
          )}
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
        <SubmitButton
          form={form}
          variant="button"
          text="apply"
          skipDirtyCheck
        />
      </form>
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
