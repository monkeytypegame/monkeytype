import { StreakHourOffsetSchema } from "@monkeytype/schemas/users";
import { createForm } from "@tanstack/solid-form";

import Ape from "../../ape";
import { Snapshot } from "../../constants/default-snapshot";
import { getSnapshot, setSnapshot } from "../../db";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal } from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { allFieldsMandatory, fromSchema } from "../ui/form/utils";

export function StreakHourOffsetModal() {
  const form = createForm(() => ({
    defaultValues: {
      offset: "0.0",
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
    onSubmit: async ({ value }) => {
      const { offset } = value;
      const hourOffset = parseFloat(offset);

      showLoaderBar();

      const response = await Ape.users.setStreakHourOffset({
        body: { hourOffset },
      });
      hideLoaderBar();

      if (response.status !== 200) {
        showErrorNotification("Failed to set streak hour offset", { response });
        hideModal("StreakHourOffset");
        return;
      }
      showSuccessNotification("Streak hour offset set");
      const snap = getSnapshot() as Snapshot;

      snap.streakHourOffset = hourOffset;
      setSnapshot(snap);
      hideModal("StreakHourOffset");
    },
  }));

  return (
    <AnimatedModal
      id="StreakHourOffset"
      title="Set streak hour offset"
      modalClass="max-w-lg"
    >
      <p>
        Streaks reset at midnight UTC by default. If this is not convenient for
        you (for example if it means that streaks reset in the middle of the
        day), you can change the hour offset here.
        <br />
        <br />
        This will not take daylight savings time into consideration!
        <br />
        <br />
        <span class="text-error">You can only do this once!</span>
      </p>
      <form
        class="flex flex-col justify-center gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div class="grid grid-cols-3 items-center justify-items-center gap-2 text-2xl">
          <form.Field
            name="offset"
            validators={{
              onChange: ({ value }) => {
                const val = parseFloat(String(value));
                if (isNaN(val)) {
                  return "Must be a number";
                }
                return fromSchema(StreakHourOffsetSchema)({
                  value: val,
                });
              },
            }}
            children={(field) => (
              <>
                <Button
                  fa={{ icon: "fa-chevron-left" }}
                  class="w-full"
                  disabled={clampOffset(field().state.value) <= -11}
                  onClick={() => {
                    const current = clampOffset(form.getFieldValue("offset"));
                    const newVal = (current - 0.5).toFixed(1);
                    form.setFieldValue("offset", newVal);
                  }}
                />
                <InputField
                  field={field}
                  type="number"
                  class="text-center"
                  min={-11}
                  max={12}
                  step={0.5}
                  alwaysShowFieldIndicator={true}
                />
                <Button
                  fa={{ icon: "fa-chevron-right" }}
                  class="w-full"
                  disabled={clampOffset(field().state.value) >= 12}
                  onClick={() => {
                    const current = clampOffset(form.getFieldValue("offset"));
                    const newVal = (current + 0.5).toFixed(1);
                    form.setFieldValue("offset", newVal);
                  }}
                />
              </>
            )}
          />
        </div>

        <div class="grid grid-cols-[1fr_auto] gap-2">
          <div>Current local reset time:</div>
          <div>{getDate()}</div>

          <div>New local reset time:</div>
          <form.Field
            name="offset"
            children={(field) => <div>{getNewDate(field().state.value)}</div>}
          />
        </div>

        <SubmitButton form={form} text="set" skipUnchangedCheck />
      </form>
    </AnimatedModal>
  );
}

function clampOffset(value: string): number {
  const num = Number.parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.max(-11, Math.min(12, num));
}

function getNewDate(offset: string): string {
  const inputValue = Number.parseFloat(offset);
  if (isNaN(inputValue)) return "-";
  const newDate = new Date();
  newDate.setUTCHours(0);
  newDate.setUTCMinutes(0);
  newDate.setUTCSeconds(0);
  newDate.setUTCMilliseconds(0);

  newDate.setHours(newDate.getHours() - -1 * Math.floor(inputValue)); //idk why, but it only works when i subtract (so i have to negate inputValue)
  newDate.setMinutes(
    newDate.getMinutes() - -1 * ((((inputValue % 1) + 1) % 1) * 60),
  );
  return newDate.toLocaleTimeString();
}

function getDate(): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date.toLocaleTimeString();
}
